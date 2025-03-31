import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hasRole } from "./auth";
import { insertJobSchema, insertApplicationSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // =================== JOB ROUTES ===================
  
  // Get all jobs with optional filters
  app.get("/api/jobs", async (req, res, next) => {
    try {
      const { search, location, type, experience, page = '1', limit = '10' } = req.query;
      
      const jobs = await storage.getJobs({
        search: search as string,
        location: location as string,
        type: type as string,
        experience: experience as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
      
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });
  
  // Get job by id
  app.get("/api/jobs/:id", async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      next(error);
    }
  });
  
  // Create job (employers only)
  app.post("/api/jobs", isAuthenticated, hasRole(["employer", "admin"]), async (req, res, next) => {
    try {
      const validatedData = insertJobSchema.parse(req.body);
      
      // Ensure the job is associated with the logged-in employer
      const job = await storage.createJob({
        ...validatedData,
        postedBy: req.user.id,
        company: req.user.company || validatedData.company,
      });
      
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });
  
  // Update job (owner or admin only)
  app.put("/api/jobs/:id", isAuthenticated, async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if user is the owner or an admin
      if (job.postedBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const validatedData = insertJobSchema.parse(req.body);
      
      const updatedJob = await storage.updateJob(jobId, {
        ...validatedData,
        // Keep the original poster
        postedBy: job.postedBy,
      });
      
      res.json(updatedJob);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });
  
  // Delete job (owner or admin only)
  app.delete("/api/jobs/:id", isAuthenticated, async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if user is the owner or an admin
      if (job.postedBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteJob(jobId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // =================== APPLICATION ROUTES ===================
  
  // Apply for a job (job seekers only)
  app.post("/api/jobs/:id/apply", isAuthenticated, hasRole(["jobseeker"]), async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      if (job.status !== "active") {
        return res.status(400).json({ message: "Job is not active" });
      }
      
      // Check if user already applied
      const existingApplication = await storage.getUserApplicationForJob(req.user.id, jobId);
      if (existingApplication) {
        return res.status(400).json({ message: "You have already applied to this job" });
      }
      
      const validatedData = insertApplicationSchema.pick({ coverLetter: true }).parse(req.body);
      
      const application = await storage.createApplication({
        jobId,
        userId: req.user.id,
        coverLetter: validatedData.coverLetter,
      });
      
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });
  
  // Get applications for a job (job poster or admin only)
  app.get("/api/jobs/:id/applications", isAuthenticated, async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if user is the job poster or an admin
      if (job.postedBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const applications = await storage.getApplicationsForJob(jobId);
      
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });
  
  // Update application status (job poster or admin only)
  app.put("/api/applications/:id/status", isAuthenticated, async (req, res, next) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const job = await storage.getJob(application.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if user is the job poster or an admin
      if (job.postedBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const schema = z.object({
        status: z.enum(['pending', 'reviewed', 'interviewed', 'accepted', 'rejected']),
      });
      
      const { status } = schema.parse(req.body);
      
      const updatedApplication = await storage.updateApplicationStatus(applicationId, status);
      
      res.json(updatedApplication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });
  
  // Get user's applications (for job seeker dashboard)
  app.get("/api/applications", isAuthenticated, async (req, res, next) => {
    try {
      const applications = await storage.getUserApplications(req.user.id);
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });
  
  // =================== USER ROUTES ===================
  
  // Get user profile
  app.get("/api/users/profile", isAuthenticated, (req, res) => {
    // Return the user without the password
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // Update user profile
  app.put("/api/users/profile", isAuthenticated, async (req, res, next) => {
    try {
      const updateProfileSchema = insertUserSchema
        .partial()
        .omit({ username: true, email: true, password: true, role: true });
      
      const validatedData = updateProfileSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(req.user.id, validatedData);
      
      // Return the user without the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });
  
  // =================== ADMIN ROUTES ===================
  
  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, hasRole(["admin"]), async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from the response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });
  
  // Get pending employer approvals (admin only)
  app.get("/api/admin/pending-approvals", isAuthenticated, hasRole(["admin"]), async (req, res, next) => {
    try {
      const pendingApprovals = await storage.getPendingEmployers();
      
      // Remove passwords from the response
      const usersWithoutPasswords = pendingApprovals.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });
  
  // Approve or reject an employer (admin only)
  app.put("/api/admin/users/:id/approve", isAuthenticated, hasRole(["admin"]), async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const schema = z.object({
        approved: z.boolean(),
      });
      
      const { approved } = schema.parse(req.body);
      
      const updatedUser = await storage.updateUserApproval(userId, approved);
      
      // Return the user without the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });
  
  // Get flagged jobs (admin only)
  app.get("/api/admin/flagged-jobs", isAuthenticated, hasRole(["admin"]), async (req, res, next) => {
    try {
      const flaggedJobs = await storage.getFlaggedJobs();
      res.json(flaggedJobs);
    } catch (error) {
      next(error);
    }
  });
  
  // Update job status (admin only)
  app.put("/api/admin/jobs/:id/status", isAuthenticated, hasRole(["admin"]), async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const schema = z.object({
        status: z.enum(['active', 'closed', 'pending', 'flagged']),
      });
      
      const { status } = schema.parse(req.body);
      
      const updatedJob = await storage.updateJobStatus(jobId, status);
      
      res.json(updatedJob);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });
  
  // Get admin statistics
  app.get("/api/admin/stats", isAuthenticated, hasRole(["admin"]), async (req, res, next) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });
  
  // =================== EMPLOYER ROUTES ===================
  
  // Get employer jobs
  app.get("/api/employer/jobs", isAuthenticated, hasRole(["employer"]), async (req, res, next) => {
    try {
      const jobs = await storage.getEmployerJobs(req.user.id);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });
  
  // Get employer statistics
  app.get("/api/employer/stats", isAuthenticated, hasRole(["employer"]), async (req, res, next) => {
    try {
      const stats = await storage.getEmployerStats(req.user.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });
  
  // =================== COMPANIES ROUTES ===================
  
  // Get companies with filtering
  app.get("/api/companies", async (req, res, next) => {
    try {
      const { search, type, location, industry, experience, page = '1', limit = '10' } = req.query;
      
      // Mock companies data for now
      // In real implementation, this would query from storage
      const companies = [
        {
          id: 1,
          name: "Acme Formulation",
          logo: "",
          rating: 3.9,
          reviews: 150, 
          industry: ["Pharmaceutical & Life Sciences"],
          type: "Corporate",
          founded: 2004
        },
        {
          id: 2,
          name: "Digit Insurance",
          logo: "",
          rating: 3.9,
          reviews: 1240,
          industry: ["Internet", "Unicorn"],
          type: "Startup",
          founded: 2016
        },
        // More companies would be here in real implementation
      ];
      
      res.json({
        companies,
        total: companies.length,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get company by ID
  app.get("/api/companies/:id", async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.id);
      
      // Mock company data
      // In real implementation, this would query from storage
      const company = {
        id: companyId,
        name: "Acme Technologies",
        logo: "",
        description: "Leading technology solutions provider with global presence",
        website: "https://www.acmetech.com",
        headquarters: "Bangalore, India",
        founded: 2005,
        industry: ["IT Services & Consulting", "Software Development"],
        employeeCount: "1000-5000",
        rating: 4.2,
        reviewsCount: 235,
        about: "Acme Technologies is a global leader in providing innovative technology solutions.",
        benefits: [
          "Comprehensive health insurance",
          "Flexible work hours",
          "Remote work options"
        ],
        socialLinks: {
          linkedin: "https://www.linkedin.com/company/acmetech"
        },
        reviews: [
          {
            id: 1,
            user: "Senior Software Engineer",
            rating: 4,
            title: "Great work culture with growth opportunities",
            pros: "Good work-life balance, talented colleagues.",
            cons: "Sometimes communication between departments could be better.",
            date: "July 15, 2024"
          }
        ],
        jobs: []
      };
      
      // Get jobs for this company
      const companyJobs = await storage.getJobs({
        search: company.name,
        page: 1,
        limit: 10
      });
      
      company.jobs = companyJobs.jobs;
      
      res.json(company);
    } catch (error) {
      next(error);
    }
  });

  // =================== SERVICES ROUTES ===================
  
  // Get premium services
  app.get("/api/services/premium", async (req, res) => {
    const premiumServices = [
      {
        id: "resume-display",
        title: "RESUME DISPLAY",
        description: "Increase your Profile Visibility to recruiters upto 3 times.",
        imageUrl: "/assets/resume-display.png",
        price: 890,
        period: "3 Months",
        popular: false
      },
      {
        id: "priority-applicant",
        title: "PRIORITY APPLICANT",
        description: "Be a Priority Applicant & increase your chance of getting a call.",
        imageUrl: "/assets/priority-applicant.png",
        price: 971,
        period: "3 Months",
        popular: true
      },
      {
        id: "ai-interview",
        title: "AI MOCK INTERVIEW",
        description: "Personalised AI driven mock interviews for your profile",
        imageUrl: "/assets/ai-interview.png",
        price: 296,
        period: "3 Months",
        freeTrialAvailable: true
      }
    ];
    
    res.json(premiumServices);
  });
  
  // Get resume services
  app.get("/api/services/resume", async (req, res) => {
    const resumeServices = [
      {
        id: "resume-writing",
        title: "Professional Resume Writing",
        description: "Resume that highlights your strengths and showcase your experience",
        price: 1653,
        pricePeriod: "One-time"
      },
      {
        id: "resume-maker",
        title: "Online Resume Maker",
        description: "Create a job-winning resume with our simple resume maker",
        free: true
      }
    ];
    
    res.json(resumeServices);
  });
  
  // Get subscription plans
  app.get("/api/services/subscriptions", async (req, res) => {
    const subscriptions = [
      {
        id: "monthly-job-search",
        title: "Monthly Job Search Plan",
        benefits: [
          "Rank higher in Recruiter Searches",
          "Priority Access to Jobs",
          "Send message to Recruiter anytime"
        ],
        price: 890,
        period: "per month"
      },
      {
        id: "quarterly-job-search",
        title: "Quarterly Job Search Plan",
        benefits: [
          "Rank higher in Recruiter Searches",
          "Priority Access to Jobs",
          "Send message to Recruiter anytime",
          "Profile highlighted to recruiters"
        ],
        price: 2400,
        period: "for 3 months",
        discounted: true,
        originalPrice: 2670
      }
    ];
    
    res.json(subscriptions);
  });
  
  // =================== CHATBOT WEBSOCKET ===================
  
  const httpServer = createServer(app);
  
  // Setup WebSocket server for chatbot
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Chatbot client connected');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'message',
      data: {
        id: Date.now().toString(),
        text: "Hi there! I'm your JobPortal assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date()
      }
    }));
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'message') {
          // Process message and generate response
          setTimeout(() => {
            const responseText = processChatbotMessage(data.text);
            
            ws.send(JSON.stringify({
              type: 'message',
              data: {
                id: Date.now().toString(),
                text: responseText,
                sender: 'bot',
                timestamp: new Date()
              }
            }));
          }, 1000); // Simulate processing delay
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Chatbot client disconnected');
    });
  });
  
  // Simple message processing function
  function processChatbotMessage(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("job") && lowerText.includes("apply")) {
      return "To apply for a job, navigate to the job listing page, select a job that interests you, and click the 'Apply Now' button.";
    } else if (lowerText.includes("resume") || lowerText.includes("cv")) {
      return "You can upload your resume in your profile settings. We also offer professional resume writing services that can help you stand out to employers!";
    } else if (lowerText.includes("account") && (lowerText.includes("create") || lowerText.includes("register"))) {
      return "To create an account, click on the 'Register' button in the top right corner of the page and follow the instructions.";
    } else if (lowerText.includes("forgot") && lowerText.includes("password")) {
      return "If you've forgotten your password, click on the 'Login' button, then select 'Forgot Password'. We'll send you an email with instructions to reset it.";
    } else if (lowerText.includes("contact") || lowerText.includes("support")) {
      return "You can reach our support team at support@jobportal.com or call us at 1800-102-5557.";
    } else if (lowerText.includes("premium") || lowerText.includes("subscription")) {
      return "We offer various premium plans that can help boost your job search or recruitment efforts. Check out our Services page for more details!";
    } else {
      return "I'm not sure I understand. Could you please rephrase your question? I can help with job applications, resume tips, account issues, and more.";
    }
  }
  return httpServer;
}
