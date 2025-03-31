import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hasRole } from "./auth";
import { insertJobSchema, insertApplicationSchema } from "@shared/schema";
import { z } from "zod";

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

  const httpServer = createServer(app);
  return httpServer;
}
