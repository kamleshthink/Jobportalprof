import jwt from 'jsonwebtoken';
import { collections } from '../mongodb';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  try {
    return await collections.users.findOne({ _id: new ObjectId(userId) });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Validate password
 */
export function validatePassword(password: string): boolean {
  // Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

/**
 * Hash a password (for demonstration purposes using simple encoding)
 * In a real application, use bcrypt or argon2
 */
export function hashPassword(password: string): string {
  // This is a simplified example - in production use bcrypt!
  return Buffer.from(password).toString('base64');
}

/**
 * Compare passwords (for demonstration purposes)
 * In a real application, use bcrypt or argon2
 */
export function comparePasswords(plainPassword: string, hashedPassword: string): boolean {
  const hashedInput = Buffer.from(plainPassword).toString('base64');
  return hashedInput === hashedPassword;
}