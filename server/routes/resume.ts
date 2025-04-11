import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '../auth-mongo';
import { resumeUpload, saveBuiltResume, getBuiltResume, saveResumePath, getResumePath, deleteBuiltResume, deleteUploadedResume, hasResume, analyzeResume } from '../utils/resume';
import path from 'path';
import fs from 'fs';
import { BuiltResume } from '@shared/mongodb-types';

const router = express.Router();

// Get user's resume (built or uploaded)
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Check if user has a built resume
    const builtResume = await getBuiltResume(userId);
    
    // Check if user has an uploaded resume
    const resumePath = await getResumePath(userId);
    
    // Format response
    const response = {
      hasResume: !!(builtResume || resumePath),
      hasBuiltResume: !!builtResume,
      hasUploadedResume: !!resumePath,
      builtResume: builtResume,
      resumePath: resumePath,
    };
    
    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Error getting resume:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Build and save resume using form data
router.post('/build', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const resumeData = req.body as BuiltResume;
    
    // Validate resume data
    if (!resumeData || !resumeData.personalInfo || !resumeData.skills) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid resume data. Personal information and skills are required.' 
      });
    }
    
    // Save resume data
    const saved = await saveBuiltResume(userId, resumeData);
    
    if (!saved) {
      return res.status(500).json({ success: false, message: 'Failed to save resume data' });
    }
    
    // Analyze resume and provide feedback
    const analysis = await analyzeResume(resumeData);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Resume built and saved successfully',
      analysis
    });
  } catch (error) {
    console.error('Error building resume:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Upload resume file
router.post('/upload', isAuthenticated, resumeUpload.single('resume'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Get relative path to file (for storage in database)
    const relativePath = path.join('uploads/resumes', path.basename(req.file.path));
    
    // Save file path to user's document
    const saved = await saveResumePath(userId, relativePath);
    
    if (!saved) {
      // If saving to database fails, delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ success: false, message: 'Failed to save resume information' });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Resume uploaded successfully',
      filePath: relativePath
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    
    // If file was uploaded but an error occurred after, delete the file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Serve resume file - requires authentication
router.get('/file/:filename', isAuthenticated, (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../../uploads/resumes', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Resume file not found' });
    }
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving resume file:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete built resume
router.delete('/built', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const deleted = await deleteBuiltResume(userId);
    
    if (!deleted) {
      return res.status(400).json({ success: false, message: 'Failed to delete built resume or resume not found' });
    }
    
    return res.status(200).json({ success: true, message: 'Built resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting built resume:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete uploaded resume
router.delete('/uploaded', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const deleted = await deleteUploadedResume(userId);
    
    if (!deleted) {
      return res.status(400).json({ success: false, message: 'Failed to delete uploaded resume or resume not found' });
    }
    
    return res.status(200).json({ success: true, message: 'Uploaded resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting uploaded resume:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;