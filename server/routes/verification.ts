import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '../auth-mongo';
import { collections, toObjectId } from '../mongodb';
import { generateOTP, sendEmailOTP, sendSMSOTP, verifyOTP, resendOTP } from '../utils/otp';

const router = express.Router();

// Send email verification OTP
router.post('/email/send', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Find user's email
    const user = await collections.users.findOne({ _id: userId });
    if (!user || !user.email) {
      return res.status(400).json({ success: false, message: 'User email not found' });
    }
    
    // Save OTP to database
    await collections.otpVerifications.insertOne({
      _id: new ObjectId(),
      userId: userId,
      otp,
      type: 'email',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      createdAt: new Date()
    });
    
    // Send OTP via email
    const emailSent = await sendEmailOTP(user.email, otp);
    
    if (!emailSent) {
      return res.status(500).json({ success: false, message: 'Failed to send email OTP' });
    }
    
    return res.status(200).json({ success: true, message: 'Email verification OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email verification OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Verify email OTP
router.post('/email/verify', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    
    // Verify OTP
    const isValid = await verifyOTP(userId, otp, 'email');
    
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    // Update user's emailVerified status
    await collections.users.updateOne(
      { _id: userId },
      { $set: { emailVerified: true } }
    );
    
    return res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Send phone verification OTP
router.post('/phone/send', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Find user's phone number
    const user = await collections.users.findOne({ _id: userId });
    if (!user || !user.phone) {
      return res.status(400).json({ success: false, message: 'User phone number not found' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Save OTP to database
    await collections.otpVerifications.insertOne({
      _id: new ObjectId(),
      userId: userId,
      otp,
      type: 'phone',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      createdAt: new Date()
    });
    
    // Send OTP via SMS
    const smsSent = await sendSMSOTP(user.phone, otp);
    
    if (!smsSent) {
      return res.status(500).json({ success: false, message: 'Failed to send SMS OTP' });
    }
    
    return res.status(200).json({ success: true, message: 'Phone verification OTP sent successfully' });
  } catch (error) {
    console.error('Error sending phone verification OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Verify phone OTP
router.post('/phone/verify', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    
    // Verify OTP
    const isValid = await verifyOTP(userId, otp, 'phone');
    
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    // Update user's phoneVerified status
    await collections.users.updateOne(
      { _id: userId },
      { $set: { phoneVerified: true } }
    );
    
    return res.status(200).json({ success: true, message: 'Phone verified successfully' });
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Resend OTP (for either email or phone)
router.post('/resend', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { type } = req.body;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    if (!type || (type !== 'email' && type !== 'phone')) {
      return res.status(400).json({ success: false, message: 'Valid type (email or phone) is required' });
    }
    
    // Find user
    const user = await collections.users.findOne({ _id: userId });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }
    
    const contact = type === 'email' ? user.email : user.phone;
    if (!contact) {
      return res.status(400).json({ success: false, message: `User ${type} not found` });
    }
    
    // Generate and send OTP
    const resent = await resendOTP(userId, contact, type);
    
    if (!resent) {
      return res.status(500).json({ success: false, message: `Failed to resend ${type} OTP` });
    }
    
    return res.status(200).json({ success: true, message: `${type.charAt(0).toUpperCase() + type.slice(1)} verification OTP resent successfully` });
  } catch (error) {
    console.error('Error resending OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;