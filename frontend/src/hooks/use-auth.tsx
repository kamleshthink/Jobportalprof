import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User, InsertUser, LoginData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { sendVerificationOTP, verifyOTP } from "@/utils/api";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
  verifyEmailMutation: UseMutationResult<any, Error, {otp: string}>;
  verifyPhoneMutation: UseMutationResult<any, Error, {otp: string}>;
  sendEmailOtpMutation: UseMutationResult<any, Error, void>;
  sendPhoneOtpMutation: UseMutationResult<any, Error, void>;
  socialLogin: (provider: 'google' | 'facebook') => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      
      let message = `Welcome to JobPortal, ${user.name}!`;
      if (user.role === 'employer') {
        message += " Your account is pending approval by an administrator.";
      }
      
      toast({
        title: "Registration successful",
        description: message,
      });
      
      // Redirect based on user role
      if (user.role === 'jobseeker') {
        setLocation("/dashboard");
      } else if (user.role === 'employer') {
        setLocation("/employer/dashboard");
      } else if (user.role === 'admin') {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify email mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async (data: {otp: string}) => {
      return await verifyOTP('email', data.otp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Email verified",
        description: "Your email has been successfully verified.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Email verification failed",
        description: error.message || "Invalid or expired OTP",
        variant: "destructive",
      });
    }
  });

  // Verify phone mutation
  const verifyPhoneMutation = useMutation({
    mutationFn: async (data: {otp: string}) => {
      return await verifyOTP('phone', data.otp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Phone verified",
        description: "Your phone has been successfully verified.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Phone verification failed",
        description: error.message || "Invalid or expired OTP",
        variant: "destructive",
      });
    }
  });

  // Send email OTP mutation
  const sendEmailOtpMutation = useMutation({
    mutationFn: async () => {
      return await sendVerificationOTP('email');
    },
    onSuccess: () => {
      toast({
        title: "OTP sent",
        description: "A verification code has been sent to your email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Unable to send email OTP",
        variant: "destructive",
      });
    }
  });

  // Send phone OTP mutation
  const sendPhoneOtpMutation = useMutation({
    mutationFn: async () => {
      return await sendVerificationOTP('phone');
    },
    onSuccess: () => {
      toast({
        title: "OTP sent",
        description: "A verification code has been sent to your phone.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Unable to send phone OTP",
        variant: "destructive",
      });
    }
  });

  // Social login handler
  const socialLogin = (provider: 'google' | 'facebook') => {
    window.location.href = `/auth/${provider}`;
  };

  // Check for token in URL (for social login callback)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    
    if (token) {
      // Store token in localStorage or handle as needed for your auth flow
      localStorage.setItem('auth_token', token);
      
      // Remove token from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Login successful",
        description: "You've been successfully logged in.",
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        verifyEmailMutation,
        verifyPhoneMutation,
        sendEmailOtpMutation,
        sendPhoneOtpMutation,
        socialLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
