import { 
  User, InsertUser, Job, InsertJob, Application, InsertApplication,
  users, jobs, applications, 
  userRoleEnum, jobStatusEnum, applicationStatusEnum, jobTypeEnum, experienceLevelEnum
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, like, desc, asc, sql, count, gt, inArray } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

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
  updateJobStatus(id: number, status: "active" | "closed" | "pending" | "flagged"): Promise<Job>;
  deleteJob(id: number): Promise<void>;
  getEmployerJobs(employerId: number): Promise<Job[]>;
  getFlaggedJobs(): Promise<Job[]>;
  
  // Application operations
  getApplication(id: number): Promise<Application | undefined>;
  getUserApplicationForJob(userId: number, jobId: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: "pending" | "reviewed" | "interviewed" | "accepted" | "rejected"): Promise<Application>;
  getApplicationsForJob(jobId: number): Promise<(Application & { user: Omit<User, 'password'> })[]>;
  getUserApplications(userId: number): Promise<(Application & { job: Job })[]>;
  
  // Statistics
  getAdminStats(): Promise<AdminStats>;
  getEmployerStats(employerId: number): Promise<EmployerStats>;
  
  // Session store
  sessionStore: any; // This avoids the type error with session.SessionStore
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
  sessionStore: any; // Using any to match the interface
  
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
    // Ensure all required fields have values
    const user: User = { 
      ...insertUser,
      id,
      role: insertUser.role || 'jobseeker', // Default role
      company: insertUser.company || null,
      location: insertUser.location || null,
      skills: insertUser.skills || null,
      resume: insertUser.resume || null,
      bio: insertUser.bio || null,
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
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date();
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date();
      return dateB.getTime() - dateA.getTime();
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
    // Ensure all required fields have values
    const newJob: Job = {
      ...job,
      id,
      status: 'active',
      salary: job.salary || null,
      requirements: job.requirements || null,
      experienceLevel: job.experienceLevel || null,
      deadline: job.deadline || null,
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
  
  async updateJobStatus(id: number, status: "active" | "closed" | "pending" | "flagged"): Promise<Job> {
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
      coverLetter: application.coverLetter || null,
      appliedAt: new Date(),
      updatedAt: new Date(),
    };
    this.applications.set(id, newApplication);
    return newApplication;
  }
  
  async updateApplicationStatus(id: number, status: "pending" | "reviewed" | "interviewed" | "accepted" | "rejected"): Promise<Application> {
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
      (app) => {
        const appDate = app.appliedAt ? new Date(app.appliedAt) : new Date();
        return appDate >= startOfDay;
      }
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

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any to match the interface

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || 'jobseeker', // Default role
        company: insertUser.company || null,
        location: insertUser.location || null,
        skills: insertUser.skills || null,
        resume: insertUser.resume || null,
        bio: insertUser.bio || null,
        isApproved: insertUser.role !== 'employer', // Auto-approve all except employers
      })
      .returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }
  
  async updateUserApproval(id: number, approved: boolean): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ isApproved: approved })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getPendingEmployers(): Promise<User[]> {
    return db.select()
      .from(users)
      .where(
        and(
          eq(users.role, 'employer'),
          eq(users.isApproved, false)
        )
      );
  }
  
  // Job operations
  async getJobs(filters: JobFilters): Promise<{ jobs: Job[]; total: number }> {
    const condition = sql`${jobs.status} = 'active'`;
    let whereClause = condition;
    
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      whereClause = sql`${whereClause} AND (${jobs.title} ILIKE ${searchTerm} OR
                         ${jobs.description} ILIKE ${searchTerm} OR
                         ${jobs.company} ILIKE ${searchTerm})`;
    }
    
    if (filters.location) {
      whereClause = sql`${whereClause} AND ${jobs.location} ILIKE ${'%' + filters.location + '%'}`;
    }
    
    if (filters.type) {
      whereClause = sql`${whereClause} AND ${jobs.type} = ${filters.type}`;
    }
    
    if (filters.experience) {
      whereClause = sql`${whereClause} AND ${jobs.experienceLevel} = ${filters.experience}`;
    }
    
    // Get total count with filters
    const [{ value: total }] = await db.select({
      value: count()
    }).from(jobs).where(whereClause);
    
    // Apply pagination and sorting
    const offset = (filters.page - 1) * filters.limit;
    
    const jobResults = await db.select()
      .from(jobs)
      .where(whereClause)
      .orderBy(desc(jobs.createdAt))
      .limit(filters.limit)
      .offset(offset);
    
    return { 
      jobs: jobResults, 
      total: Number(total)
    };
  }
  
  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }
  
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs)
      .values({
        ...job,
        status: 'active',
        salary: job.salary || null,
        requirements: job.requirements || null,
        experienceLevel: job.experienceLevel || null, 
        deadline: job.deadline || null,
      })
      .returning();
    
    return newJob;
  }
  
  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job> {
    const [updatedJob] = await db.update(jobs)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, id))
      .returning();
    
    if (!updatedJob) {
      throw new Error(`Job with ID ${id} not found`);
    }
    
    return updatedJob;
  }
  
  async updateJobStatus(id: number, status: "active" | "closed" | "pending" | "flagged"): Promise<Job> {
    const [updatedJob] = await db.update(jobs)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, id))
      .returning();
    
    if (!updatedJob) {
      throw new Error(`Job with ID ${id} not found`);
    }
    
    return updatedJob;
  }
  
  async deleteJob(id: number): Promise<void> {
    // First delete all applications for this job
    await db.delete(applications).where(eq(applications.jobId, id));
    
    // Then delete the job
    const result = await db.delete(jobs).where(eq(jobs.id, id)).returning();
    
    if (result.length === 0) {
      throw new Error(`Job with ID ${id} not found`);
    }
  }
  
  async getEmployerJobs(employerId: number): Promise<Job[]> {
    return db.select()
      .from(jobs)
      .where(eq(jobs.postedBy, employerId));
  }
  
  async getFlaggedJobs(): Promise<Job[]> {
    return db.select()
      .from(jobs)
      .where(eq(jobs.status, 'flagged'));
  }
  
  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select()
      .from(applications)
      .where(eq(applications.id, id));
    
    return application;
  }
  
  async getUserApplicationForJob(userId: number, jobId: number): Promise<Application | undefined> {
    const [application] = await db.select()
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.jobId, jobId)
        )
      );
    
    return application;
  }
  
  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApplication] = await db.insert(applications)
      .values({
        ...application,
        status: 'pending',
        coverLetter: application.coverLetter || null,
      })
      .returning();
    
    return newApplication;
  }
  
  async updateApplicationStatus(id: number, status: "pending" | "reviewed" | "interviewed" | "accepted" | "rejected"): Promise<Application> {
    const [updatedApplication] = await db.update(applications)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(applications.id, id))
      .returning();
    
    if (!updatedApplication) {
      throw new Error(`Application with ID ${id} not found`);
    }
    
    return updatedApplication;
  }
  
  async getApplicationsForJob(jobId: number): Promise<(Application & { user: Omit<User, 'password'> })[]> {
    const jobApplications = await db.select()
      .from(applications)
      .where(eq(applications.jobId, jobId));
    
    const result = [];
    
    for (const app of jobApplications) {
      const [user] = await db.select().from(users).where(eq(users.id, app.userId));
      
      if (!user) {
        throw new Error(`User with ID ${app.userId} not found`);
      }
      
      // Remove password from user object
      const { password, ...userWithoutPassword } = user;
      
      result.push({
        ...app,
        user: userWithoutPassword,
      });
    }
    
    return result;
  }
  
  async getUserApplications(userId: number): Promise<(Application & { job: Job })[]> {
    const userApplications = await db.select()
      .from(applications)
      .where(eq(applications.userId, userId));
    
    const result = [];
    
    for (const app of userApplications) {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, app.jobId));
      
      if (!job) {
        throw new Error(`Job with ID ${app.jobId} not found`);
      }
      
      result.push({
        ...app,
        job,
      });
    }
    
    return result;
  }
  
  // Statistics
  async getAdminStats(): Promise<AdminStats> {
    // Count total users
    const [{ value: totalUsers }] = await db.select({
      value: count()
    }).from(users);
    
    // Count total jobs
    const [{ value: totalJobs }] = await db.select({
      value: count()
    }).from(jobs);
    
    // Count pending approvals
    const [{ value: pendingApprovals }] = await db.select({
      value: count()
    }).from(users).where(
      and(
        eq(users.role, 'employer'),
        eq(users.isApproved, false)
      )
    );
    
    // Count flagged jobs
    const [{ value: flaggedJobs }] = await db.select({
      value: count()
    }).from(jobs).where(eq(jobs.status, 'flagged'));
    
    // Count applications today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [{ value: applicationsToday }] = await db.select({
      value: count()
    }).from(applications).where(gt(applications.appliedAt, today));
    
    return {
      totalUsers: Number(totalUsers),
      totalJobs: Number(totalJobs),
      pendingApprovals: Number(pendingApprovals),
      flaggedJobs: Number(flaggedJobs),
      applicationsToday: Number(applicationsToday),
    };
  }
  
  async getEmployerStats(employerId: number): Promise<EmployerStats> {
    // Count active listings
    const [{ value: activeListings }] = await db.select({
      value: count()
    }).from(jobs).where(
      and(
        eq(jobs.postedBy, employerId),
        eq(jobs.status, 'active')
      )
    );
    
    // Get all job IDs for this employer
    const employerJobs = await db.select()
      .from(jobs)
      .where(eq(jobs.postedBy, employerId));
    
    const jobIds = employerJobs.map(job => job.id);
    
    // Count total applicants across all jobs
    let totalApplicants = 0;
    
    if (jobIds.length > 0) {
      const [{ value }] = await db.select({
        value: count()
      }).from(applications).where(sql`${applications.jobId} IN (${jobIds.join(',')})`);
      
      totalApplicants = Number(value);
    }
    
    // In a real application, we would track views per job
    // For this implementation, we'll just generate a random number
    const listingViews = Math.floor(Math.random() * 1000) + 200;
    
    return {
      activeListings: Number(activeListings),
      totalApplicants,
      listingViews,
    };
  }
}

// Create a single admin user for initial access
async function seedAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.username, 'admin'));
    
    if (existingAdmin.length === 0) {
      // Create admin user
      await db.insert(users).values({
        username: "admin",
        email: "admin@jobportal.com",
        password: "admin123", // In a real app, this would be hashed
        name: "Admin User",
        role: "admin",
        company: "JobPortal",
        location: "Global",
        skills: [],
        resume: "",
        bio: "System administrator",
        isApproved: true,
      });
      console.log("Admin user created");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}

// Call the seed function
seedAdminUser();

// Export an instance of DatabaseStorage
export const storage = new DatabaseStorage();
