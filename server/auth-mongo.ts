import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { ObjectId } from 'mongodb';
import { collections, connectToMongoDB } from "./mongodb";
import { comparePasswords, hashPassword, generateToken } from "./utils/auth";
import { generateOTP, saveOTP, sendEmailOTP, sendSmsOTP, verifyOTP } from "./utils/otp";

// Define types for our MongoDB user
interface MongoUser {
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
  builtResume?: any;
  hasResume?: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  phone?: string;
  isApproved: boolean;
  createdAt: Date;
  preferredWorkMode?: 'remote' | 'hybrid' | 'onsite';
  googleId?: string;
  facebookId?: string;
}

declare global {
  namespace Express {
    interface User extends MongoUser {}
  }
}

export async function setupAuth(app: Express) {
  // Connect to MongoDB
  await connectToMongoDB();

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Try to find the user by username or email
        const user = await collections.users.findOne({
          $or: [
            { username },
            { email: username } // Allow login with email too
          ]
        });

        if (!user || !user.password) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const passwordValid = comparePasswords(password, user.password);
        if (!passwordValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Google Strategy (if credentials are available)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await collections.users.findOne({ googleId: profile.id });

            if (!user) {
              // Create a new user if not exists
              const email = profile.emails?.[0]?.value;
              if (!email) {
                return done(new Error("Email not provided by Google"));
              }

              // Check if email is already in use
              const existingUser = await collections.users.findOne({ email });
              if (existingUser) {
                // Link this Google account to the existing user
                await collections.users.updateOne(
                  { _id: existingUser._id },
                  { $set: { googleId: profile.id, emailVerified: true } }
                );
                user = await collections.users.findOne({ _id: existingUser._id });
              } else {
                // Create a completely new user
                const result = await collections.users.insertOne({
                  username: email.split('@')[0] + Date.now().toString().slice(-4),
                  email,
                  name: profile.displayName || email.split('@')[0],
                  role: 'jobseeker',
                  googleId: profile.id,
                  emailVerified: true,
                  phoneVerified: false,
                  isApproved: true,
                  createdAt: new Date(),
                  skills: []
                });

                user = await collections.users.findOne({ _id: result.insertedId });
              }
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Facebook Strategy (if credentials are available)
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/auth/facebook/callback",
          profileFields: ["id", "emails", "name"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await collections.users.findOne({ facebookId: profile.id });

            if (!user) {
              // Create a new user if not exists
              const email = profile.emails?.[0]?.value;
              if (!email) {
                return done(new Error("Email not provided by Facebook"));
              }

              // Check if email is already in use
              const existingUser = await collections.users.findOne({ email });
              if (existingUser) {
                // Link this Facebook account to the existing user
                await collections.users.updateOne(
                  { _id: existingUser._id },
                  { $set: { facebookId: profile.id, emailVerified: true } }
                );
                user = await collections.users.findOne({ _id: existingUser._id });
              } else {
                // Create a completely new user
                const result = await collections.users.insertOne({
                  username: email.split('@')[0] + Date.now().toString().slice(-4),
                  email,
                  name: profile.displayName || email.split('@')[0],
                  role: 'jobseeker',
                  facebookId: profile.id,
                  emailVerified: true,
                  phoneVerified: false,
                  isApproved: true,
                  createdAt: new Date(),
                  skills: []
                });

                user = await collections.users.findOne({ _id: result.insertedId });
              }
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await collections.users.findOne({ _id: new ObjectId(id) });
      done(null, user || undefined);
    } catch (error) {
      done(error);
    }
  });

  // Authentication Routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, name, role = 'jobseeker' } = req.body;

      // Check if user already exists
      const existingUser = await collections.users.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username or email already exists" });
      }

      // Hash the password
      const hashedPassword = hashPassword(password);

      // Create a new user
      const result = await collections.users.insertOne({
        username,
        email,
        password: hashedPassword,
        name,
        role,
        emailVerified: false,
        phoneVerified: false,
        isApproved: true, // Auto-approve all users including employers
        createdAt: new Date(),
        skills: []
      });

      if (!result.acknowledged) {
        return res.status(500).json({ message: "Error creating user" });
      }

      // Generate and send OTP for email verification
      const user = await collections.users.findOne({ _id: result.insertedId });
      if (user) {
        // Generate and send email verification
        const otp = generateOTP();
        await saveOTP(user._id.toString(), otp, 'email');
        await sendEmailOTP(user._id.toString(), email, otp);

        req.login(user, (err) => {
          if (err) return next(err);
          
          // Generate JWT token
          const token = generateToken(user._id.toString());
          
          // Return user info with token
          const { password, ...userWithoutPassword } = user;
          res.status(201).json({ 
            user: userWithoutPassword,
            token,
            requireVerification: true 
          });
        });
      } else {
        res.status(500).json({ message: "Error retrieving user after creation" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message || "Authentication failed" });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Generate JWT token
        const token = generateToken(user._id.toString());
        
        // Return user info with token
        const { password, ...userWithoutPassword } = user;
        res.status(200).json({ 
          user: userWithoutPassword,
          token,
          requireVerification: !user.emailVerified 
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // OTP Verification Routes
  app.post("/api/verify-email", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { otp } = req.body;
      const userId = req.user._id.toString();

      const isVerified = await verifyOTP(userId, otp, 'email');
      if (!isVerified) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Update user document to mark email as verified
      await collections.users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { emailVerified: true } }
      );

      res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/verify-phone", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { otp } = req.body;
      const userId = req.user._id.toString();

      const isVerified = await verifyOTP(userId, otp, 'phone');
      if (!isVerified) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Update user document to mark phone as verified
      await collections.users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { phoneVerified: true } }
      );

      res.status(200).json({ message: "Phone verified successfully" });
    } catch (error) {
      console.error('Error verifying phone:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/resend-otp", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user._id.toString();
      const { type } = req.body; // 'email' or 'phone'

      const otp = generateOTP();

      if (type === 'email') {
        await saveOTP(userId, otp, 'email');
        await sendEmailOTP(userId, req.user.email, otp);
      } else if (type === 'phone' && req.user.phone) {
        await saveOTP(userId, otp, 'phone');
        await sendSmsOTP(userId, req.user.phone, otp);
      } else {
        return res.status(400).json({ message: "Invalid verification type" });
      }

      res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error('Error resending OTP:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Google auth routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/auth" }), (req, res) => {
      // Generate JWT token
      const token = generateToken(req.user._id.toString());
      // Redirect to frontend with token
      res.redirect(`/?token=${token}`);
    });
  }

  // Facebook auth routes
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));

    app.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/auth" }), (req, res) => {
      // Generate JWT token
      const token = generateToken(req.user._id.toString());
      // Redirect to frontend with token
      res.redirect(`/?token=${token}`);
    });
  }
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

// Middleware to check if user has required role
export function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}