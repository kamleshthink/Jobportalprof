import { 
  User, InsertUser, Job, InsertJob, Application, InsertApplication 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  updateUserApproval(id: number, approved: boolean): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getPendingEmployers(): Promise<User[]>;
  
  // Job operations
  getJobs(filters: JobFilters): Promise<{ jobs: Job[]; total: number }>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job>;
  updateJobStatus(id: number, status: string): Promise<Job>;
  deleteJob(id: number): Promise<void>;
  getEmployerJobs(employerId: number): Promise<Job[]>;
  getFlaggedJobs(): Promise<Job[]>;
  
  // Application operations
  getApplication(id: number): Promise<Application | undefined>;
  getUserApplicationForJob(userId: number, jobId: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application>;
  getApplicationsForJob(jobId: number): Promise<(Application & { user: Omit<User, 'password'> })[]>;
  getUserApplications(userId: number): Promise<(Application & { job: Job })[]>;
  
  // Statistics
  getAdminStats(): Promise<AdminStats>;
  getEmployerStats(employerId: number): Promise<EmployerStats>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export interface JobFilters {
  search?: string;
  location?: string;
  type?: string;
  experience?: string;
  page: number;
  limit: number;
}

export interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  pendingApprovals: number;
  flaggedJobs: number;
  applicationsToday: number;
}

export interface EmployerStats {
  activeListings: number;
  totalApplicants: number;
  listingViews: number;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobs: Map<number, Job>;
  private applications: Map<number, Application>;
  sessionStore: session.SessionStore;
  
  currentUserId: number;
  currentJobId: number;
  currentApplicationId: number;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.currentUserId = 1;
    this.currentJobId = 1;
    this.currentApplicationId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Create an admin user
    this.createUser({
      username: "admin",
      email: "admin@jobportal.com",
      password: "admin123",
      name: "Admin User",
      role: "admin",
      company: "JobPortal",
      location: "Global",
      skills: [],
      resume: "",
      bio: "System administrator",
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser,
      id,
      isApproved: insertUser.role !== 'employer', // Auto-approve all except employers
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserApproval(id: number, approved: boolean): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, isApproved: approved };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getPendingEmployers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === 'employer' && !user.isApproved
    );
  }
  
  // Job operations
  async getJobs(filters: JobFilters): Promise<{ jobs: Job[]; total: number }> {
    let filteredJobs = Array.from(this.jobs.values());
    
    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(searchLower) || 
        job.description.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(locationLower)
      );
    }
    
    if (filters.type) {
      filteredJobs = filteredJobs.filter(job => job.type === filters.type);
    }
    
    if (filters.experience) {
      filteredJobs = filteredJobs.filter(job => job.experienceLevel === filters.experience);
    }
    
    // By default only show active jobs
    filteredJobs = filteredJobs.filter(job => job.status === 'active');
    
    // Sort by date (newest first)
    filteredJobs.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    const total = filteredJobs.length;
    
    // Apply pagination
    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;
    filteredJobs = filteredJobs.slice(start, end);
    
    return { jobs: filteredJobs, total };
  }
  
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }
  
  async createJob(job: InsertJob): Promise<Job> {
    const id = this.currentJobId++;
    const newJob: Job = {
      ...job,
      id,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, newJob);
    return newJob;
  }
  
  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job> {
    const job = await this.getJob(id);
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }
    
    const updatedJob = { ...job, ...updates, updatedAt: new Date() };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
  
  async updateJobStatus(id: number, status: string): Promise<Job> {
    const job = await this.getJob(id);
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }
    
    const updatedJob = { ...job, status, updatedAt: new Date() };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
  
  async deleteJob(id: number): Promise<void> {
    if (!this.jobs.has(id)) {
      throw new Error(`Job with ID ${id} not found`);
    }
    
    this.jobs.delete(id);
    
    // Delete all applications associated with this job
    const applicationsToDelete = Array.from(this.applications.values())
      .filter(app => app.jobId === id)
      .map(app => app.id);
    
    applicationsToDelete.forEach(appId => {
      this.applications.delete(appId);
    });
  }
  
  async getEmployerJobs(employerId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.postedBy === employerId
    );
  }
  
  async getFlaggedJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === 'flagged'
    );
  }
  
  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }
  
  async getUserApplicationForJob(userId: number, jobId: number): Promise<Application | undefined> {
    return Array.from(this.applications.values()).find(
      (app) => app.userId === userId && app.jobId === jobId
    );
  }
  
  async createApplication(application: InsertApplication): Promise<Application> {
    const id = this.currentApplicationId++;
    const newApplication: Application = {
      ...application,
      id,
      status: 'pending',
      appliedAt: new Date(),
      updatedAt: new Date(),
    };
    this.applications.set(id, newApplication);
    return newApplication;
  }
  
  async updateApplicationStatus(id: number, status: string): Promise<Application> {
    const application = await this.getApplication(id);
    if (!application) {
      throw new Error(`Application with ID ${id} not found`);
    }
    
    const updatedApplication = { ...application, status, updatedAt: new Date() };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  async getApplicationsForJob(jobId: number): Promise<(Application & { user: Omit<User, 'password'> })[]> {
    const applications = Array.from(this.applications.values()).filter(
      (app) => app.jobId === jobId
    );
    
    return Promise.all(applications.map(async (app) => {
      const user = await this.getUser(app.userId);
      if (!user) {
        throw new Error(`User with ID ${app.userId} not found`);
      }
      
      const { password, ...userWithoutPassword } = user;
      
      return {
        ...app,
        user: userWithoutPassword,
      };
    }));
  }
  
  async getUserApplications(userId: number): Promise<(Application & { job: Job })[]> {
    const applications = Array.from(this.applications.values()).filter(
      (app) => app.userId === userId
    );
    
    return Promise.all(applications.map(async (app) => {
      const job = await this.getJob(app.jobId);
      if (!job) {
        throw new Error(`Job with ID ${app.jobId} not found`);
      }
      
      return {
        ...app,
        job,
      };
    }));
  }
  
  // Statistics
  async getAdminStats(): Promise<AdminStats> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const applicationsToday = Array.from(this.applications.values()).filter(
      (app) => new Date(app.appliedAt) >= startOfDay
    ).length;
    
    return {
      totalUsers: this.users.size,
      totalJobs: this.jobs.size,
      pendingApprovals: (await this.getPendingEmployers()).length,
      flaggedJobs: (await this.getFlaggedJobs()).length,
      applicationsToday,
    };
  }
  
  async getEmployerStats(employerId: number): Promise<EmployerStats> {
    const employerJobs = await this.getEmployerJobs(employerId);
    const jobIds = employerJobs.filter(job => job.status === 'active').map(job => job.id);
    
    let totalApplicants = 0;
    
    for (const jobId of jobIds) {
      const applications = Array.from(this.applications.values()).filter(
        (app) => app.jobId === jobId
      );
      totalApplicants += applications.length;
    }
    
    // In a real application, we would track views per job
    // For this implementation, we'll just generate a random number
    const listingViews = Math.floor(Math.random() * 1000) + 200;
    
    return {
      activeListings: jobIds.length,
      totalApplicants,
      listingViews,
    };
  }
}

export const storage = new MemStorage();
