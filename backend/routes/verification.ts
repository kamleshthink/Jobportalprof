import express, { Request, Response } from 'express';
import { isAuthenticated } from '../auth-mongo';
import { generateOTP, sendEmailOTP, sendSmsOTP, verifyOTP } from '../utils/otp';
import { collections } from '../mongodb';

const router = express.Router();

// Send email verification OTP
router.post('/send-email-otp', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { email } = req.user;

    if (!email) {
      return res.status(400).json({ success: false, message: 'No email associated with this account' });
    }

    const otp = generateOTP();
    const sent = await sendEmailOTP(userId, email, otp);

    if (sent) {
      return res.status(200).json({ success: true, message: 'Email verification code sent successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send email verification code' });
    }
  } catch (error) {
    console.error('Error sending email OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Send phone verification OTP
router.post('/send-phone-otp', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { phone } = req.user;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'No phone number associated with this account' });
    }

    const otp = generateOTP();
    const sent = await sendSmsOTP(userId, phone, otp);

    if (sent) {
      return res.status(200).json({ success: true, message: 'Phone verification code sent successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send phone verification code' });
    }
  } catch (error) {
    console.error('Error sending phone OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Combined endpoint to resend OTP (either email or phone)
router.post('/resend-otp', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { type } = req.body; // 'email' or 'phone'

    if (!type || (type !== 'email' && type !== 'phone')) {
      return res.status(400).json({ success: false, message: 'Invalid verification type' });
    }

    const otp = generateOTP();
    let success = false;

    if (type === 'email') {
      const { email } = req.user;
      if (!email) {
        return res.status(400).json({ success: false, message: 'No email associated with this account' });
      }
      success = await sendEmailOTP(userId, email, otp);
    } else {
      const { phone } = req.user;
      if (!phone) {
        return res.status(400).json({ success: false, message: 'No phone number associated with this account' });
      }
      success = await sendSmsOTP(userId, phone, otp);
    }

    if (success) {
      return res.status(200).json({ 
        success: true, 
        message: `${type === 'email' ? 'Email' : 'Phone'} verification code sent successfully` 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: `Failed to send ${type === 'email' ? 'email' : 'phone'} verification code` 
      });
    }
  } catch (error) {
    console.error('Error resending OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Verify email OTP
router.post('/verify-email', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const verified = await verifyOTP(userId, otp, 'email');

    if (verified) {
      return res.status(200).json({ success: true, message: 'Email verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Verify phone OTP
router.post('/verify-phone', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const verified = await verifyOTP(userId, otp, 'phone');

    if (verified) {
      return res.status(200).json({ success: true, message: 'Phone verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }
  } catch (error) {
    console.error('Error verifying phone:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update phone number
router.post('/update-phone', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Update user's phone number
    await collections.users.updateOne(
      { _id: req.user._id },
      { 
        $set: { 
          phone,
          phoneVerified: false
        } 
      }
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Phone number updated successfully. Please verify your new phone number.' 
    });
  } catch (error) {
    console.error('Error updating phone number:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;