import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerificationProps {
  onComplete?: () => void;
  redirectOnComplete?: boolean;
}

const Verification = ({ onComplete, redirectOnComplete = true }: VerificationProps) => {
  const { user, verifyEmailMutation, verifyPhoneMutation, sendEmailOtpMutation, sendPhoneOtpMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [countdown, setCountdown] = useState<number>(0);
  
  // Initialize countdown timer when component mounts
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendEmailOtp = () => {
    if (!user?.email) {
      toast({
        title: "Email required",
        description: "You need to have an email address set in your profile.",
        variant: "destructive",
      });
      return;
    }
    
    sendEmailOtpMutation.mutate(undefined, {
      onSuccess: () => {
        setCountdown(60); // Start 60 second countdown
      }
    });
  };

  const handleSendPhoneOtp = () => {
    if (!user?.phone) {
      toast({
        title: "Phone number required",
        description: "You need to have a phone number set in your profile.",
        variant: "destructive",
      });
      return;
    }
    
    sendPhoneOtpMutation.mutate(undefined, {
      onSuccess: () => {
        setCountdown(60); // Start 60 second countdown
      }
    });
  };

  const handleVerifyEmail = () => {
    if (!emailOtp) {
      toast({
        title: "OTP required",
        description: "Please enter the verification code sent to your email.",
        variant: "destructive",
      });
      return;
    }
    
    verifyEmailMutation.mutate({ otp: emailOtp }, {
      onSuccess: () => {
        setEmailOtp('');
        if (onComplete && user?.phoneVerified) {
          onComplete();
        } else if (!user?.phoneVerified) {
          setActiveTab('phone');
          toast({
            title: "Email verified",
            description: "Now let's verify your phone number.",
          });
        }
      }
    });
  };

  const handleVerifyPhone = () => {
    if (!phoneOtp) {
      toast({
        title: "OTP required",
        description: "Please enter the verification code sent to your phone.",
        variant: "destructive",
      });
      return;
    }
    
    verifyPhoneMutation.mutate({ otp: phoneOtp }, {
      onSuccess: () => {
        setPhoneOtp('');
        if (onComplete) {
          onComplete();
        }
      }
    });
  };

  // If both email and phone are verified, return null or redirect
  if (user?.emailVerified && user?.phoneVerified) {
    if (onComplete) {
      onComplete();
    }
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verify Your Account</CardTitle>
        <CardDescription>
          To ensure account security, please verify your email and phone number.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'email' | 'phone')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="email" disabled={!user?.email}>
              <Mail className="w-4 h-4 mr-2" /> 
              Email 
              {user?.emailVerified && <Badge variant="outline" className="ml-2 bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>}
            </TabsTrigger>
            <TabsTrigger value="phone" disabled={!user?.phone}>
              <Phone className="w-4 h-4 mr-2" /> 
              Phone
              {user?.phoneVerified && <Badge variant="outline" className="ml-2 bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            {user?.emailVerified ? (
              <div className="flex items-center justify-center py-6">
                <CheckCircle2 className="w-8 h-8 text-green-500 mr-2" />
                <p className="text-lg font-medium">Email verified successfully</p>
              </div>
            ) : (
              <>
                <div className="flex items-center mb-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 mr-1 text-yellow-500" />
                  <p>A verification code will be sent to: <span className="font-medium">{user?.email}</span></p>
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    type="text" 
                    placeholder="Enter 6-digit code" 
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    maxLength={6}
                  />
                  <Button 
                    variant="outline"
                    onClick={handleSendEmailOtp}
                    disabled={sendEmailOtpMutation.isPending || countdown > 0}
                  >
                    {sendEmailOtpMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : countdown > 0 ? (
                      `Resend in ${countdown}s`
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={handleVerifyEmail}
                  disabled={!emailOtp || verifyEmailMutation.isPending}
                >
                  {verifyEmailMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="phone" className="space-y-4">
            {user?.phoneVerified ? (
              <div className="flex items-center justify-center py-6">
                <CheckCircle2 className="w-8 h-8 text-green-500 mr-2" />
                <p className="text-lg font-medium">Phone verified successfully</p>
              </div>
            ) : (
              <>
                <div className="flex items-center mb-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 mr-1 text-yellow-500" />
                  <p>A verification code will be sent to: <span className="font-medium">{user?.phone}</span></p>
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    type="text" 
                    placeholder="Enter 6-digit code" 
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    maxLength={6}
                  />
                  <Button 
                    variant="outline"
                    onClick={handleSendPhoneOtp}
                    disabled={sendPhoneOtpMutation.isPending || countdown > 0}
                  >
                    {sendPhoneOtpMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : countdown > 0 ? (
                      `Resend in ${countdown}s`
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={handleVerifyPhone}
                  disabled={!phoneOtp || verifyPhoneMutation.isPending}
                >
                  {verifyPhoneMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Phone'
                  )}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Having trouble? <a href="/support" className="text-primary hover:underline">Contact support</a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default Verification;