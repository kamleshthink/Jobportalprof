import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { ObjectId } from 'mongodb';
import { BuiltResume } from '@shared/mongodb-types';
import { collections } from '../mongodb';

// Set up storage for resume uploads
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename: timestamp + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  }
});

// File filter to ensure only PDF, DOCX, and DOC files are uploaded
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedFileTypes = ['.pdf', '.docx', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, and DOC files are allowed'));
  }
};

// Configure multer for resume uploads
export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
  }
});

// Function to save built resume to user's document
export async function saveBuiltResume(userId: ObjectId, resumeData: BuiltResume): Promise<boolean> {
  try {
    // Update user document with built resume data
    const result = await collections.users.updateOne(
      { _id: userId },
      { 
        $set: { 
          builtResume: resumeData,
          hasResume: true 
        } 
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error saving built resume:', error);
    return false;
  }
}

// Function to get user's built resume
export async function getBuiltResume(userId: ObjectId): Promise<BuiltResume | null> {
  try {
    const user = await collections.users.findOne(
      { _id: userId },
      { projection: { builtResume: 1 } }
    );
    
    return user?.builtResume || null;
  } catch (error) {
    console.error('Error getting built resume:', error);
    return null;
  }
}

// Function to update uploaded resume path in user's document
export async function saveResumePath(userId: ObjectId, filePath: string): Promise<boolean> {
  try {
    // Update user document with resume file path
    const result = await collections.users.updateOne(
      { _id: userId },
      { 
        $set: { 
          resumePath: filePath,
          hasResume: true 
        } 
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error saving resume path:', error);
    return false;
  }
}

// Function to get user's uploaded resume path
export async function getResumePath(userId: ObjectId): Promise<string | null> {
  try {
    const user = await collections.users.findOne(
      { _id: userId },
      { projection: { resumePath: 1 } }
    );
    
    return user?.resumePath || null;
  } catch (error) {
    console.error('Error getting resume path:', error);
    return null;
  }
}

// Function to delete user's built resume
export async function deleteBuiltResume(userId: ObjectId): Promise<boolean> {
  try {
    // Check if user has an uploaded resume
    const user = await collections.users.findOne(
      { _id: userId },
      { projection: { resumePath: 1, builtResume: 1 } }
    );
    
    if (!user) {
      return false;
    }
    
    // Update user document to remove built resume
    const updateData = user.resumePath 
      ? { $unset: { builtResume: 1 } }  // Keep hasResume true if uploaded resume exists
      : { $unset: { builtResume: 1 }, $set: { hasResume: false } };
      
    const result = await collections.users.updateOne(
      { _id: userId },
      updateData
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error deleting built resume:', error);
    return false;
  }
}

// Function to delete user's uploaded resume
export async function deleteUploadedResume(userId: ObjectId): Promise<boolean> {
  try {
    // Get user document to find resume path
    const user = await collections.users.findOne(
      { _id: userId },
      { projection: { resumePath: 1, builtResume: 1 } }
    );
    
    if (!user || !user.resumePath) {
      return false;
    }
    
    // Delete file from disk
    const filePath = path.join(__dirname, '../../', user.resumePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Update user document to remove resume path
    const updateData = user.builtResume 
      ? { $unset: { resumePath: 1 } }  // Keep hasResume true if built resume exists
      : { $unset: { resumePath: 1 }, $set: { hasResume: false } };
      
    const result = await collections.users.updateOne(
      { _id: userId },
      updateData
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error deleting uploaded resume:', error);
    return false;
  }
}

// Function to check if user has any resume (built or uploaded)
export async function hasResume(userId: ObjectId): Promise<boolean> {
  try {
    const user = await collections.users.findOne(
      { _id: userId },
      { projection: { hasResume: 1 } }
    );
    
    return user?.hasResume || false;
  } catch (error) {
    console.error('Error checking resume status:', error);
    return false;
  }
}

// Function to analyze resume content (can be expanded with AI integration)
export async function analyzeResume(resumeData: BuiltResume): Promise<any> {
  // For now, return basic analytics about the resume
  // This can be expanded with AI integration for deeper analysis
  
  const result = {
    completeness: calculateCompleteness(resumeData),
    educationCount: resumeData.education.length,
    experienceCount: resumeData.experience.length,
    skillsCount: resumeData.skills.length,
    certificationCount: resumeData.certifications?.length || 0,
    suggestedImprovements: generateSuggestions(resumeData)
  };
  
  return result;
}

// Helper function to calculate resume completeness percentage
function calculateCompleteness(resumeData: BuiltResume): number {
  let totalFields = 0;
  let completedFields = 0;
  
  // Check personal info
  const personalInfoFields = ['name', 'email', 'phone', 'address', 'linkedIn', 'website', 'summary'];
  totalFields += personalInfoFields.length;
  personalInfoFields.forEach(field => {
    if (resumeData.personalInfo[field as keyof typeof resumeData.personalInfo]) {
      completedFields++;
    }
  });
  
  // Check experience (at least one)
  totalFields += 1;
  if (resumeData.experience.length > 0) {
    completedFields += 1;
  }
  
  // Check education (at least one)
  totalFields += 1;
  if (resumeData.education.length > 0) {
    completedFields += 1;
  }
  
  // Check skills (at least three)
  totalFields += 1;
  if (resumeData.skills.length >= 3) {
    completedFields += 1;
  }
  
  // Check certifications (optional)
  totalFields += 1;
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    completedFields += 1;
  }
  
  // Check languages (optional)
  totalFields += 1;
  if (resumeData.languages && resumeData.languages.length > 0) {
    completedFields += 1;
  }
  
  return Math.round((completedFields / totalFields) * 100);
}

// Helper function to generate improvement suggestions
function generateSuggestions(resumeData: BuiltResume): string[] {
  const suggestions: string[] = [];
  
  // Check personal info
  if (!resumeData.personalInfo.summary) {
    suggestions.push('Add a professional summary to highlight your key qualifications');
  }
  
  if (!resumeData.personalInfo.linkedIn) {
    suggestions.push('Include your LinkedIn profile for professional networking');
  }
  
  // Check experience
  if (resumeData.experience.length === 0) {
    suggestions.push('Add your work experience to showcase your professional background');
  } else if (resumeData.experience.length < 2) {
    suggestions.push('Consider adding more work experiences to strengthen your resume');
  }
  
  // Check quantifiable achievements in experience
  let hasQuantifiableAchievements = false;
  for (const exp of resumeData.experience) {
    if (/increased|decreased|improved|achieved|generated|reduced|[\d%$]/.test(exp.description)) {
      hasQuantifiableAchievements = true;
      break;
    }
  }
  if (!hasQuantifiableAchievements && resumeData.experience.length > 0) {
    suggestions.push('Include quantifiable achievements in your work experience (e.g., "Increased sales by 20%")');
  }
  
  // Check education
  if (resumeData.education.length === 0) {
    suggestions.push('Add your educational background to complete your resume');
  }
  
  // Check skills
  if (resumeData.skills.length < 5) {
    suggestions.push('Add more skills to highlight your professional capabilities (aim for at least 5)');
  }
  
  // Check certifications
  if (!resumeData.certifications || resumeData.certifications.length === 0) {
    suggestions.push('Consider adding relevant certifications to strengthen your qualifications');
  }
  
  // Check languages
  if (!resumeData.languages || resumeData.languages.length === 0) {
    suggestions.push('Adding language proficiencies can make your resume stand out, especially for international roles');
  }
  
  return suggestions;
}