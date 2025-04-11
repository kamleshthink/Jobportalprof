import { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  username: string;
  email: string;
  password?: string;
  name: string;
  role: 'jobseeker' | 'employer' | 'admin';
  company?: string;
  location?: string;
  skills?: string[];
  resumePath?: string;
  builtResume?: BuiltResume;
  hasResume?: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  phone?: string;
  isApproved: boolean;
  createdAt: Date;
  preferredWorkMode?: 'remote' | 'hybrid' | 'onsite';
  googleId?: string;
  facebookId?: string;
  bio?: string;
}

export interface Job {
  _id: ObjectId;
  title: string;
  company: string;
  description: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  workMode: 'remote' | 'hybrid' | 'onsite';
  salary?: string;
  minSalary?: number;
  maxSalary?: number;
  requirements: string;
  experienceLevel: 'entry' | 'intermediate' | 'senior' | 'executive';
  skills: string[];
  postedBy: ObjectId;
  status: 'active' | 'closed' | 'pending' | 'flagged';
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
}

export interface Application {
  _id: ObjectId;
  jobId: ObjectId;
  userId: ObjectId;
  status: 'pending' | 'reviewed' | 'interviewed' | 'accepted' | 'rejected';
  coverLetter: string;
  appliedAt: Date;
  updatedAt: Date;
  resumeId?: ObjectId;
}

export interface Company {
  _id: ObjectId;
  name: string;
  description: string;
  industry: string;
  location: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  website?: string;
  logo?: string;
  founded?: number;
  socialLinks?: {
    linkedIn?: string;
    twitter?: string;
    facebook?: string;
  };
  employerId: ObjectId;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyReview {
  _id: ObjectId;
  companyId: ObjectId;
  userId: ObjectId;
  rating: number;
  title: string;
  comment: string;
  workStatus: 'current' | 'former';
  pros?: string;
  cons?: string;
  isApproved: boolean;
  createdAt: Date;
}

export interface OTPVerification {
  _id: ObjectId;
  userId: ObjectId;
  otp: string;
  type: 'email' | 'phone';
  expiresAt: Date;
  createdAt: Date;
}

export interface ServicePlan {
  _id: ObjectId;
  name: string;
  type: 'free' | 'basic' | 'premium' | 'enterprise';
  price: number;
  duration: number; // in days
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ResumeData = BuiltResume;

export interface BuiltResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    linkedIn?: string;
    website?: string;
    summary?: string;
  };
  experience: {
    company: string;
    jobTitle: string;
    location?: string;
    startDate: string;
    endDate?: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }[];
  skills: string[];
  certifications?: {
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
  }[];
  languages?: {
    language: string;
    proficiency: 'Elementary' | 'Limited Working' | 'Professional Working' | 'Full Professional' | 'Native';
  }[];
  projects?: {
    name: string;
    description: string;
    startDate?: string;
    endDate?: string;
    link?: string;
  }[];
  references?: {
    name: string;
    company: string;
    position: string;
    email?: string;
    phone?: string;
  }[];
}

export interface Message {
  _id: ObjectId;
  sender: ObjectId;
  recipient: ObjectId;
  relatedJobId?: ObjectId;
  relatedApplicationId?: ObjectId;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface Notification {
  _id: ObjectId;
  userId: ObjectId;
  type: 'application_status' | 'new_job' | 'message' | 'reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  relatedId?: ObjectId; // Can be jobId, applicationId, etc.
  createdAt: Date;
}

export interface FlaggedJob {
  _id: ObjectId;
  jobId: ObjectId;
  reportedBy: ObjectId;
  reason: string;
  status: 'pending' | 'reviewed' | 'removed' | 'approved';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: ObjectId;
}

export interface JobApplication {
  job: Job;
  application: Application;
  applicant?: User;
}