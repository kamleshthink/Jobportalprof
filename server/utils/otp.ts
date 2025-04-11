import nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import { ObjectId } from 'mongodb';
import { collections } from '../mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Save OTP to database
export async function saveOTP(userId: string | ObjectId, email: string, phone: string | null, otp: string): Promise<boolean> {
  const type = phone ? 'phone' : 'email';
  userId = typeof userId === 'string' ? new ObjectId(userId) : userId;
  try {
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    // Delete any existing OTPs for this user and type
    await collections.otpVerifications.deleteMany({ 
      userId, 
      type 
    });
    
    // Save new OTP
    await collections.otpVerifications.insertOne({
      _id: new ObjectId(),
      userId,
      otp,
      type,
      expiresAt,
      createdAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error saving OTP:', error);
    return false;
  }
}

// Verify OTP from database
export async function verifyOTP(userId: string | ObjectId, otp: string, type?: 'email' | 'phone'): Promise<boolean> {
  userId = typeof userId === 'string' ? new ObjectId(userId) : userId;
  try {
    const otpRecord = await collections.otpVerifications.findOne({
      userId,
      otp,
      type
    });
    
    if (!otpRecord) {
      return false;
    }
    
    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      // Delete expired OTP
      await collections.otpVerifications.deleteOne({ _id: otpRecord._id });
      return false;
    }
    
    // Delete used OTP
    await collections.otpVerifications.deleteOne({ _id: otpRecord._id });
    
    // Update user verification status
    if (type === 'email') {
      await collections.users.updateOne(
        { _id: userId },
        { $set: { emailVerified: true } }
      );
    } else if (type === 'phone') {
      await collections.users.updateOne(
        { _id: userId },
        { $set: { phoneVerified: true } }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

// Send OTP via email
export async function sendEmailOTP(email: string, otp: string): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    const mailOptions = {
      from: `"Job Portal" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #4a5568; text-align: center;">Email Verification</h2>
          <p style="color: #718096; font-size: 16px;">Thank you for registering with our Job Portal. To complete your registration, please use the verification code below:</p>
          <div style="background-color: #f7fafc; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #2d3748;">${otp}</span>
          </div>
          <p style="color: #718096; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #718096; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email OTP:', error);
    return false;
  }
}

// Send OTP via SMS
export async function sendSMSOTP(phone: string, otp: string): Promise<boolean> {
  try {
    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.error('Twilio credentials not configured');
      return false;
    }
    
    const client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    await client.messages.create({
      body: `Your Job Portal verification code is: ${otp}. It will expire in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    
    return true;
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    return false;
  }
}

// Resend OTP
export async function resendOTP(userId: ObjectId, contact: string, type: 'email' | 'phone'): Promise<boolean> {
  try {
    const otp = generateOTP();
    const email = type === 'email' ? contact : '';
    const phone = type === 'phone' ? contact : null;
    const saved = await saveOTP(userId, email, phone, otp);
    
    if (!saved) {
      return false;
    }
    
    if (type === 'email') {
      return await sendEmailOTP(contact, otp);
    } else {
      return await sendSMSOTP(contact, otp);
    }
  } catch (error) {
    console.error('Error resending OTP:', error);
    return false;
  }
}