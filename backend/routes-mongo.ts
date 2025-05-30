import { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import { WebSocketServer } from 'ws';
import { isAuthenticated, hasRole } from './auth-mongo';
import { collections } from './mongodb';
import { ObjectId } from 'mongodb';
import verificationRoutes from './routes/verification';
import resumeRoutes from './routes/resume';

export async function registerRoutes(app: Express): Promise<Server> {
  // Use our route modules
  app.use('/api/verify', verificationRoutes);
  app.use('/api/users/resume', resumeRoutes);

  // User profile
  app.get('/api/user/profile', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Return user data without sensitive fields
      const { password, ...userProfile } = req.user;
      
      res.status(200).json(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update user profile
  app.patch('/api/user/profile', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { name, location, phone, skills, preferredWorkMode } = req.body;
      
      // Build update object with fields that are provided
      const updateData: Record<string, any> = {};
      
      if (name) updateData.name = name;
      if (location) updateData.location = location;
      if (phone) updateData.phone = phone;
      if (skills) updateData.skills = skills;
      if (preferredWorkMode) updateData.preferredWorkMode = preferredWorkMode;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }
      
      // Update the user
      const result = await collections.users?.updateOne(
        { _id: req.user._id },
        { $set: updateData }
      );
      
      if (result?.modifiedCount === 0) {
        return res.status(404).json({ message: 'User not found or no changes made' });
      }
      
      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get job listings with filters
  app.get('/api/jobs', async (req: Request, res: Response) => {
    try {
      const { 
        search, 
        location, 
        type, 
        experience,
        workMode,
        page = 1, 
        limit = 10 
      } = req.query;
      
      // Build filter object
      const filter: Record<string, any> = { status: 'active' };
      
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (location) {
        filter.location = { $regex: location, $options: 'i' };
      }
      
      if (type) {
        filter.type = type;
      }
      
      if (experience) {
        filter.experienceLevel = experience;
      }
      
      if (workMode) {
        filter.workMode = workMode;
      }
      
      // Paginate results
      const skip = (Number(page) - 1) * Number(limit);
      
      // Get total count for pagination
      const total = await collections.jobs?.countDocuments(filter);
      
      // Get jobs
      const jobs = await collections.jobs?.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray();
        
      res.status(200).json({
        jobs: jobs || [],
        total: total || 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((total || 0) / Number(limit))
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get job by ID
  app.get('/api/jobs/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      
      const job = await collections.jobs?.findOne({ _id: new ObjectId(id) });
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      res.status(200).json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Create job (employers only)
  app.post('/api/jobs', isAuthenticated, hasRole(['employer']), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { 
        title, 
        company, 
        description, 
        location, 
        type, 
        workMode,
        salary,
        minSalary,
        maxSalary,
        requirements,
        experienceLevel,
        skills,
        deadline 
      } = req.body;
      
      // Validate required fields
      if (!title || !company || !description || !location || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Create job object
      const job = {
        title,
        company,
        description,
        location,
        type,
        workMode: workMode || 'onsite',
        salary: salary || '',
        minSalary: minSalary || null,
        maxSalary: maxSalary || null,
        requirements: requirements || '',
        experienceLevel: experienceLevel || 'entry',
        skills: skills || [],
        postedBy: req.user._id,
        status: req.user.isApproved ? 'active' : 'pending', // If employer is approved, job is active immediately
        createdAt: new Date(),
        updatedAt: new Date(),
        deadline: deadline ? new Date(deadline) : null,
      };
      
      const result = await collections.jobs?.insertOne(job);
      
      res.status(201).json({ 
        message: 'Job created successfully',
        jobId: result?.insertedId,
        status: job.status
      });
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update job (employer who posted the job only)
  app.patch('/api/jobs/:id', isAuthenticated, hasRole(['employer']), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { id } = req.params;
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      
      // Verify job exists and belongs to this employer
      const job = await collections.jobs?.findOne({ 
        _id: new ObjectId(id),
        postedBy: req.user._id
      });
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found or you do not have permission to update it' });
      }
      
      // Extract fields to update
      const updateFields = {};
      const allowedFields = [
        'title', 'description', 'location', 'type', 'workMode',
        'salary', 'minSalary', 'maxSalary', 'requirements', 
        'experienceLevel', 'skills', 'deadline'
      ];
      
      // Only include fields that were provided in the request
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      }
      
      // Add updatedAt timestamp
      updateFields['updatedAt'] = new Date();
      
      // If deadline provided, convert to Date
      if (updateFields['deadline']) {
        updateFields['deadline'] = new Date(updateFields['deadline']);
      }
      
      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }
      
      // Update the job
      const result = await collections.jobs?.updateOne(
        { _id: new ObjectId(id), postedBy: req.user._id },
        { $set: updateFields }
      );
      
      if (result?.modifiedCount === 0) {
        return res.status(404).json({ message: 'Job not found or no changes made' });
      }
      
      res.status(200).json({ message: 'Job updated successfully' });
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get employer's jobs
  app.get('/api/employer/jobs', isAuthenticated, hasRole(['employer']), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const jobs = await collections.jobs?.find({ postedBy: req.user._id })
        .sort({ createdAt: -1 })
        .toArray();
        
      res.status(200).json(jobs || []);
    } catch (error) {
      console.error('Error fetching employer jobs:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Apply for a job
  app.post('/api/jobs/:id/apply', isAuthenticated, hasRole(['jobseeker']), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { id } = req.params;
      const { coverLetter } = req.body;
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      
      // Check if job exists and is active
      const job = await collections.jobs?.findOne({ 
        _id: new ObjectId(id),
        status: 'active'
      });
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found or not active' });
      }
      
      // Check if already applied
      const existingApplication = await collections.applications?.findOne({
        jobId: new ObjectId(id),
        userId: req.user._id
      });
      
      if (existingApplication) {
        return res.status(400).json({ message: 'You have already applied for this job' });
      }
      
      // Create application
      const application = {
        jobId: new ObjectId(id),
        userId: req.user._id,
        status: 'pending',
        coverLetter: coverLetter || '',
        appliedAt: new Date(),
        updatedAt: new Date()
      };
      
      await collections.applications?.insertOne(application);
      
      res.status(201).json({ message: 'Application submitted successfully' });
    } catch (error) {
      console.error('Error applying for job:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get user's job applications
  app.get('/api/user/applications', isAuthenticated, hasRole(['jobseeker']), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Get applications with job details
      const applications = await collections.applications?.aggregate([
        { 
          $match: { userId: req.user._id } 
        },
        {
          $lookup: {
            from: 'jobs',
            localField: 'jobId',
            foreignField: '_id',
            as: 'job'
          }
        },
        {
          $unwind: '$job'
        },
        {
          $sort: { appliedAt: -1 }
        }
      ]).toArray();
      
      res.status(200).json(applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get applications for a job (employer only)
  app.get('/api/jobs/:id/applications', isAuthenticated, hasRole(['employer']), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { id } = req.params;
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      
      // Check if job belongs to employer
      const job = await collections.jobs?.findOne({
        _id: new ObjectId(id),
        postedBy: req.user._id
      });
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found or you do not have permission to view applications' });
      }
      
      // Get applications with user details (excluding password)
      const applications = await collections.applications?.aggregate([
        { 
          $match: { jobId: new ObjectId(id) } 
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            'user.password': 0
          }
        },
        {
          $sort: { appliedAt: -1 }
        }
      ]).toArray();
      
      res.status(200).json(applications || []);
    } catch (error) {
      console.error('Error fetching job applications:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update application status (employer only)
  app.patch('/api/applications/:id/status', isAuthenticated, hasRole(['employer']), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { id } = req.params;
      const { status } = req.body;
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }
      
      if (!status || !['pending', 'reviewed', 'interviewed', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      // Get application
      const application = await collections.applications?.findOne({ _id: new ObjectId(id) });
      
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      // Check if job belongs to employer
      const job = await collections.jobs?.findOne({
        _id: application.jobId,
        postedBy: req.user._id
      });
      
      if (!job) {
        return res.status(403).json({ message: 'You do not have permission to update this application' });
      }
      
      // Update application status
      const result = await collections.applications?.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status,
            updatedAt: new Date()
          } 
        }
      );
      
      if (result?.modifiedCount === 0) {
        return res.status(400).json({ message: 'No changes made to application' });
      }
      
      res.status(200).json({ message: 'Application status updated successfully' });
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Admin routes
  // Get pending employers for approval
  app.get('/api/admin/pending-employers', isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const pendingEmployers = await collections.users?.find({
        role: 'employer',
        isApproved: false
      })
      .project({ password: 0 })
      .toArray();
      
      res.status(200).json(pendingEmployers || []);
    } catch (error) {
      console.error('Error fetching pending employers:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Approve employer
  app.patch('/api/admin/approve-employer/:id', isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { id } = req.params;
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const result = await collections.users?.updateOne(
        { _id: new ObjectId(id), role: 'employer' },
        { $set: { isApproved: true } }
      );
      
      if (result?.modifiedCount === 0) {
        return res.status(404).json({ message: 'Employer not found or already approved' });
      }
      
      // Also approve any pending jobs by this employer
      await collections.jobs?.updateMany(
        { postedBy: new ObjectId(id), status: 'pending' },
        { $set: { status: 'active' } }
      );
      
      res.status(200).json({ message: 'Employer approved successfully' });
    } catch (error) {
      console.error('Error approving employer:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get flagged jobs (for admin review)
  app.get('/api/admin/flagged-jobs', isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const flaggedJobs = await collections.jobs?.find({ status: 'flagged' })
        .sort({ updatedAt: -1 })
        .toArray();
      
      res.status(200).json(flaggedJobs || []);
    } catch (error) {
      console.error('Error fetching flagged jobs:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Flag a job (jobseekers can flag suspicious jobs)
  app.post('/api/jobs/:id/flag', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      
      if (!reason) {
        return res.status(400).json({ message: 'Reason for flagging is required' });
      }
      
      const job = await collections.jobs?.findOne({ _id: new ObjectId(id) });
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Create a flag report
      await collections.flaggedJobs?.insertOne({
        jobId: new ObjectId(id),
        reportedBy: req.user._id,
        reason,
        createdAt: new Date()
      });
      
      // Update job status to flagged if it's the first time or if it meets a threshold
      const flagCount = await collections.flaggedJobs?.countDocuments({ jobId: new ObjectId(id) });
      
      if (flagCount >= 3) {
        await collections.jobs?.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: 'flagged', updatedAt: new Date() } }
        );
      }
      
      res.status(200).json({ message: 'Job flagged for review' });
    } catch (error) {
      console.error('Error flagging job:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Admin decision on flagged job
  app.patch('/api/admin/review-flagged-job/:id', isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { id } = req.params;
      const { decision } = req.body;
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      
      if (!decision || !['approve', 'remove'].includes(decision)) {
        return res.status(400).json({ message: 'Valid decision (approve or remove) is required' });
      }
      
      if (decision === 'approve') {
        // Mark job as active again
        await collections.jobs?.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: 'active', updatedAt: new Date() } }
        );
        
        // Remove flag reports
        await collections.flaggedJobs?.deleteMany({ jobId: new ObjectId(id) });
        
        res.status(200).json({ message: 'Job approved and restored' });
      } else {
        // Mark job as closed/removed
        await collections.jobs?.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: 'closed', updatedAt: new Date() } }
        );
        
        res.status(200).json({ message: 'Job removed' });
      }
    } catch (error) {
      console.error('Error reviewing flagged job:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Simple chatbot response
  app.post('/api/chatbot/message', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }
      
      const response = processChatbotMessage(message);
      
      res.status(200).json({ response });
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Here you can implement message handling logic
        // For example, authenticating the connection, subscribing to specific events, etc.
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}

// Simple chatbot message processing function
function processChatbotMessage(text: string): string {
  text = text.toLowerCase();
  
  if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
    return "Hello! I'm your job search assistant. How can I help you today?";
  } else if (text.includes('job') && (text.includes('find') || text.includes('search') || text.includes('looking'))) {
    return "To find a job, you can use the search bar at the top of the page. You can filter jobs by location, type, and experience level. If you need more personalized recommendations, please complete your profile.";
  } else if (text.includes('resume') || text.includes('cv')) {
    return "You can build or upload your resume in the Resume Management section of your profile. A complete resume will help you apply for jobs quickly and get better recommendations.";
  } else if (text.includes('apply')) {
    return "To apply for a job, first make sure your resume is uploaded or created. Then, navigate to the job details page and click the 'Apply' button. You may add a cover letter to strengthen your application.";
  } else if (text.includes('profile')) {
    return "You can update your profile from the Profile section. Make sure to complete all sections, verify your email and phone, and add your skills to get better job matches.";
  } else if (text.includes('verify') || text.includes('verification')) {
    return "You need to verify your email and phone for security purposes. Go to your Profile settings and click on 'Verify' next to your email or phone. We'll send you a verification code.";
  } else if (text.includes('employer') || text.includes('recruit') || text.includes('hire')) {
    return "If you're an employer looking to post jobs, you need to register with an employer account. After registration, your account will be reviewed by our admins. Once approved, you can start posting jobs.";
  } else if (text.includes('contact') || text.includes('support')) {
    return "For any issues or questions, please contact our support team at support@jobportal.com or use the Contact page accessible from the footer.";
  } else if (text.includes('login') || text.includes('sign in')) {
    return "You can log in using your username and password. We also support login via Google or Facebook. If you've forgotten your password, use the 'Forgot Password' link on the login page.";
  } else if (text.includes('register') || text.includes('sign up')) {
    return "To register, click on the 'Sign Up' button and fill out the registration form. Choose your account type (Job Seeker or Employer) and complete all required fields.";
  } else {
    return "I'm not sure how to help with that. Can you try rephrasing your question? Or you can ask about finding jobs, resume building, applying to jobs, profile management, verification, or contacting support.";
  }
}