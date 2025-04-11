import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import {
  User,
  Job,
  Application,
  Company,
  CompanyReview,
  OTPVerification,
  ServicePlan
} from '@shared/mongodb-types';

// Load environment variables
dotenv.config();

// MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobPortal';

// Create a MongoClient
export const client = new MongoClient(uri, {
  // Options can be configured here
});

// Connect to MongoDB
export const connectToMongoDB = async () => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Ensure indexes for better performance
    await setupIndexes();
    
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return false;
  }
};

// Setup database indexes
async function setupIndexes() {
  try {
    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    
    // Job indexes
    await db.collection('jobs').createIndex({ postedBy: 1 });
    await db.collection('jobs').createIndex({ status: 1 });
    await db.collection('jobs').createIndex({ createdAt: -1 });
    await db.collection('jobs').createIndex({ 
      title: 'text', 
      description: 'text', 
      company: 'text',
      requirements: 'text'
    });
    
    // Application indexes
    await db.collection('applications').createIndex({ jobId: 1 });
    await db.collection('applications').createIndex({ userId: 1 });
    await db.collection('applications').createIndex({ jobId: 1, userId: 1 }, { unique: true });
    
    // Company indexes
    await db.collection('companies').createIndex({ name: 1 }, { unique: true });
    
    // OTP verification indexes
    await db.collection('otpVerifications').createIndex({ userId: 1 });
    await db.collection('otpVerifications').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    console.log('Database indexes set up successfully');
  } catch (error) {
    console.error('Error setting up database indexes:', error);
  }
}

// Get database and collections
export const db = client.db('jobPortal');

export const collections = {
  users: db.collection<User>('users'),
  jobs: db.collection<Job>('jobs'),
  applications: db.collection<Application>('applications'),
  companies: db.collection<Company>('companies'),
  companyReviews: db.collection<CompanyReview>('companyReviews'),
  otpVerifications: db.collection<OTPVerification>('otpVerifications'),
  servicePlans: db.collection<ServicePlan>('servicePlans'),
  flaggedJobs: db.collection('flaggedJobs')
};

// Helper function to convert string ID to ObjectId
export function toObjectId(id: string): ObjectId {
  try {
    return new ObjectId(id);
  } catch (error) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
}

// Close MongoDB connection when the application shuts down
process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});