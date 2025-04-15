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

// MongoDB connection string - hardcoded for testing 
// Uses the provided connection string directly
const uri = 'mongodb+srv://kamleshsharmathink:db_Kamlesh123@cluster0.lpwxhp7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
console.log('Using MongoDB connection string directly');

// Safe log URI without exposing credentials
const logSafeUri = (mongoUri: string) => {
  if (!mongoUri.startsWith('mongodb')) {
    return 'Invalid MongoDB URI format';
  }
  
  if (mongoUri.includes('@')) {
    // Hide credentials in URI that contains authentication
    const parts = mongoUri.split('@');
    const credentials = parts[0].split('://')[0] + '://*****:*****';
    return credentials + '@' + parts[1];
  }
  
  return mongoUri;
};

console.log('Connecting to MongoDB using URI:', logSafeUri(uri));

// Create a MongoClient
export const client = new MongoClient(uri, {
  // Configure options for better performance and compatibility
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  serverSelectionTimeoutMS: 60000,
});

// Connect to MongoDB
export const connectToMongoDB = async () => {
  try {
    // Test the connection before proceeding
    await client.connect();
    await client.db().admin().ping();
    console.log('Connected to MongoDB successfully');
    
    try {
      // Ensure indexes for better performance
      await setupIndexes();
    } catch (indexError) {
      // Non-fatal error, log it but continue
      console.warn('Warning: Could not set up all database indexes. Some queries might be slower:', indexError);
    }
    
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // Additional info for troubleshooting
    if (uri.includes('localhost')) {
      console.error('You are trying to connect to a local MongoDB instance. Make sure MongoDB is running locally or provide a remote DATABASE_URL.');
    }
    return false;
  }
};

// Setup database indexes - with improved error handling
async function setupIndexes() {
  // Helper function to safely create an index
  const safeCreateIndex = async (
    collection: string, 
    indexSpec: Record<string, any>, 
    options: Record<string, any> = {}
  ) => {
    try {
      await db.collection(collection).createIndex(indexSpec, options);
      return true;
    } catch (error: any) {
      console.warn(`Failed to create index on ${collection}:`, error.message);
      return false;
    }
  };

  try {
    // User indexes
    await safeCreateIndex('users', { email: 1 }, { unique: true });
    await safeCreateIndex('users', { username: 1 }, { unique: true });
    await safeCreateIndex('users', { role: 1 });
    
    // Job indexes
    await safeCreateIndex('jobs', { postedBy: 1 });
    await safeCreateIndex('jobs', { status: 1 });
    await safeCreateIndex('jobs', { createdAt: -1 });
    await safeCreateIndex('jobs', { 
      title: 'text', 
      description: 'text', 
      company: 'text',
      requirements: 'text'
    });
    
    // Application indexes
    await safeCreateIndex('applications', { jobId: 1 });
    await safeCreateIndex('applications', { userId: 1 });
    await safeCreateIndex('applications', { jobId: 1, userId: 1 }, { unique: true });
    
    // Company indexes
    await safeCreateIndex('companies', { name: 1 }, { unique: true });
    
    // OTP verification indexes
    await safeCreateIndex('otpVerifications', { userId: 1 });
    await safeCreateIndex('otpVerifications', { expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    console.log('Database indexes set up successfully');
  } catch (error) {
    console.error('Error during index setup process:', error);
    // This is not a fatal error, we can continue without indexes
  }
}

// Extract database name from URI or use default
const extractDbName = () => {
  try {
    // Try to extract DB name from the URI
    const dbFromUri = uri.split('/').pop()?.split('?')[0];
    // If we found a valid name, use it, otherwise default to 'jobPortal'
    return dbFromUri || 'jobPortal';
  } catch (error) {
    console.warn('Could not extract DB name from URI, using default');
    return 'jobPortal';
  }
};

// Get database and collections
export const db = client.db(extractDbName());

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