import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { collections, toObjectId } from '../mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Setup Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// Only import and create Twilio client if credentials are available
let twilioClient: any = null;

// Initialize Twilio client function without await
const initTwilioClient = () => {
  if (accountSid && authToken) {
    // Use promise-based import instead of await
    import('twilio')
      .then(twilioModule => {
        // The default export from twilio is the constructor
        const TwilioClient = twilioModule.default;
        twilioClient = new TwilioClient(accountSid, authToken);
        console.log('Twilio client initialized successfully');
      })
      .catch(error => {
        console.error('Failed to initialize Twilio client:', error);
      });
  } else {
    console.warn('Twilio credentials not found. SMS services will not be available.');
  }
};

// Call the initialization function
initTwilioClient();
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

// Initialize email transporter
let transporter: nodemailer.Transporter | null = null;
try {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Verify email transport
    transporter.verify((error) => {
      if (error) {
        console.error('Error verifying email transport:', error);
      } else {
        console.log('Email transport is ready to send messages');
      }
    });
  } else {
    console.warn('Email credentials not found. Email services will not be available.');
  }
} catch (error) {
  console.error('Failed to initialize email transport:', error);
}

// Function to generate a 6-digit OTP
export const generateOTP = (): string => {
  // Generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to save OTP to database
export const saveOTP = async (userId: string, otp: string, type: 'email' | 'phone'): Promise<boolean> => {
  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    // Delete any existing OTPs for this user and type
    await collections.otpVerifications.deleteMany({
      userId: toObjectId(userId),
      type
    });

    // Insert new OTP
    await collections.otpVerifications.insertOne({
      _id: new ObjectId(),
      userId: toObjectId(userId),
      otp,
      type,
      expiresAt,
      createdAt: new Date()
    });

    return true;
  } catch (error) {
    console.error(`Error saving ${type} OTP:`, error);
    return false;
  }
};

// Function to verify OTP
export const verifyOTP = async (userId: string, otp: string, type: 'email' | 'phone'): Promise<boolean> => {
  try {
    // Find OTP in database
    const otpRecord = await collections.otpVerifications.findOne({
      userId: toObjectId(userId),
      otp,
      type,
      expiresAt: { $gt: new Date() } // Not expired
    });

    if (!otpRecord) {
      return false;
    }

    // Delete the OTP after verification
    await collections.otpVerifications.deleteOne({ _id: otpRecord._id });

    // Update user verification status
    const updateField = type === 'email' ? 'emailVerified' : 'phoneVerified';
    await collections.users.updateOne(
      { _id: toObjectId(userId) },
      { $set: { [updateField]: true } }
    );

    return true;
  } catch (error) {
    console.error(`Error verifying ${type} OTP:`, error);
    return false;
  }
};

// Function to send OTP via email
export const sendEmailOTP = async (userId: string, email: string, otp: string): Promise<boolean> => {
  try {
    // Check if email transporter is available
    if (!transporter) {
      console.error('Email transporter not configured');
      // Save OTP to database anyway so we can verify it in development
      await saveOTP(userId, otp, 'email');
      return false;
    }
    
    const mailOptions = {
      from: `"JobPortal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification Code',
      text: `Your verification code is: ${otp}\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p style="font-size: 16px; color: #555;">Thank you for registering with JobPortal. Please use the following code to verify your email address:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 4px;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #777;">This code will expire in 10 minutes. If you did not request this verification, please ignore this email.</p>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} JobPortal. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter!.sendMail(mailOptions);
    await saveOTP(userId, otp, 'email');
    return true;
  } catch (error) {
    console.error('Error sending email OTP:', error);
    // Save OTP to database anyway so we can verify it in development
    await saveOTP(userId, otp, 'email');
    return false;
  }
};

// Function to send OTP via SMS
export const sendSmsOTP = async (userId: string, phoneNumber: string, otp: string): Promise<boolean> => {
  try {
    // Check if Twilio client is available
    if (!twilioClient || !twilioPhoneNumber) {
      console.error('Twilio client or phone number not configured');
      // Save OTP to database anyway so we can verify it
      await saveOTP(userId, otp, 'phone');
      return false;
    }

    // Make sure phone number is in E.164 format
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedPhone = `+${phoneNumber}`;
    }

    // Send SMS
    await twilioClient.messages.create({
      body: `Your JobPortal verification code is: ${otp}. This code will expire in 10 minutes.`,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    // Save OTP to database
    await saveOTP(userId, otp, 'phone');
    return true;
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    // Save OTP to database anyway so we can verify it in development
    await saveOTP(userId, otp, 'phone');
    return false;
  }
};