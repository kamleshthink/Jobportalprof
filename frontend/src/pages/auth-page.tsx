import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  insertUserSchema, 
  loginSchema, 
  InsertUser, 
  LoginData 
} from "@shared/schema";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Mail, Lock, User } from "lucide-react";

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

const AuthPage = () => {
  const [location, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "jobseeker",
      location: "",
      company: "",
      bio: "",
      skills: [],
    },
  });

  const onLoginSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterData) => {
    // Remove confirmPassword as it's not part of the InsertUser type
    const { confirmPassword, ...userData } = data;
    
    // Convert skills string to array if provided
    const formattedData: InsertUser = {
      ...userData,
      skills: data.skills ? data.skills : []
    };

    registerMutation.mutate(formattedData);
  };

  const isEmployer = registerForm.watch("role") === "employer";
  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-[calc(100vh-16rem)] bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Left side - Auth forms */}
          <div className="lg:pr-8">
            <Card className="mx-auto max-w-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Welcome to JobPortal</CardTitle>
                <CardDescription className="text-center">
                  Sign in to your account or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  {/* Login Tab */}
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <User className="h-5 w-5" />
                                  </span>
                                  <Input 
                                    placeholder="Enter your username" 
                                    className="pl-10" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <Lock className="h-5 w-5" />
                                  </span>
                                  <Input 
                                    type="password" 
                                    placeholder="Enter your password" 
                                    className="pl-10"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center">
                            <Checkbox id="remember-me" />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                              Remember me
                            </label>
                          </div>
                          <div className="text-sm">
                            <a href="#" className="font-medium text-primary hover:text-primary-800">
                              Forgot password?
                            </a>
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary-600 mt-6"
                          disabled={isPending}
                        >
                          {isPending ? "Signing in..." : "Sign in"}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <Separator />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <Button variant="outline" className="w-full">
                          <svg className="h-5 w-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                            <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                            <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                            <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
                          </svg>
                          Google
                        </Button>
                        <Button variant="outline" className="w-full">
                          <svg className="h-5 w-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22.2234 0H1.77187C0.792187 0 0 0.773438 0 1.72969V22.2656C0 23.2219 0.792187 24 1.77187 24H12.8156V14.7188H9.69844V11.0844H12.8156V8.41406C12.8156 5.31563 14.7125 3.625 17.4766 3.625C18.8016 3.625 19.9406 3.72656 20.2734 3.77344V7.00469L18.3516 7.00625C16.8516 7.00625 16.5391 7.72187 16.5391 8.77344V11.0844H20.1469L19.6766 14.7188H16.5391V24H22.2234C23.2031 24 24 23.2219 24 22.2703V1.72969C24 0.773438 23.2031 0 22.2234 0Z" fill="#3b5998"/>
                          </svg>
                          Facebook
                        </Button>
                      </div>
                    </div>
                    
                    <p className="mt-8 text-center text-sm text-gray-600">
                      Don't have an account?{' '}
                      <Button 
                        variant="link" 
                        className="font-medium text-primary hover:text-primary-800 p-0"
                        onClick={() => setActiveTab("register")}
                      >
                        Sign up now
                      </Button>
                    </p>
                  </TabsContent>
                  
                  {/* Register Tab */}
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>I want to</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="jobseeker">Find a job</SelectItem>
                                  <SelectItem value="employer">Hire talent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                      <User className="h-5 w-5" />
                                    </span>
                                    <Input 
                                      placeholder="John Doe" 
                                      className="pl-10" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="johndoe" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <Mail className="h-5 w-5" />
                                  </span>
                                  <Input 
                                    type="email" 
                                    placeholder="john@example.com" 
                                    className="pl-10" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                      <Lock className="h-5 w-5" />
                                    </span>
                                    <Input 
                                      type="password" 
                                      placeholder="••••••" 
                                      className="pl-10" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="••••••" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={registerForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="San Francisco, CA" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {isEmployer && (
                          <FormField
                            control={registerForm.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                      <Briefcase className="h-5 w-5" />
                                    </span>
                                    <Input 
                                      placeholder="Acme Inc." 
                                      className="pl-10" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  {isEmployer && "Your account will require approval before posting jobs."}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        {!isEmployer && (
                          <FormField
                            control={registerForm.control}
                            name="skills"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Skills</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="React, JavaScript, Node.js (comma separated)" 
                                    {...field}
                                    onChange={(e) => {
                                      const skillsArray = e.target.value.split(',').map(skill => skill.trim());
                                      field.onChange(skillsArray);
                                    }}
                                    value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="flex items-center mt-4">
                          <Checkbox id="terms" />
                          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                            I agree to the{' '}
                            <a href="#" className="font-medium text-primary hover:text-primary-800">
                              Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="#" className="font-medium text-primary hover:text-primary-800">
                              Privacy Policy
                            </a>
                          </label>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary-600 mt-6"
                          disabled={isPending}
                        >
                          {isPending ? "Creating account..." : "Create account"}
                        </Button>
                      </form>
                    </Form>
                    
                    <p className="mt-8 text-center text-sm text-gray-600">
                      Already have an account?{' '}
                      <Button 
                        variant="link" 
                        className="font-medium text-primary hover:text-primary-800 p-0"
                        onClick={() => setActiveTab("login")}
                      >
                        Sign in
                      </Button>
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Right side - Hero content */}
          <div className="mt-10 lg:mt-0 lg:col-start-2 lg:row-start-1">
            <div className="bg-primary-600 text-white rounded-lg overflow-hidden shadow-xl">
              <div className="px-8 py-12">
                <h2 className="text-3xl font-extrabold">Find the perfect job match for your skills</h2>
                <p className="mt-4 text-lg">
                  Connect with top employers and discover opportunities that align with your career goals.
                </p>
                
                <div className="mt-10 space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium">Thousands of jobs</h3>
                      <p className="mt-1 text-base opacity-80">
                        Browse through thousands of opportunities across various industries.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium">Easy application process</h3>
                      <p className="mt-1 text-base opacity-80">
                        Apply with just a few clicks and track your application status.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium">Personalized job alerts</h3>
                      <p className="mt-1 text-base opacity-80">
                        Get notified when new positions matching your preferences are posted.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-12 bg-primary-700 rounded-lg p-6">
                  <p className="italic text-primary-100">
                    "JobPortal helped me land my dream job within weeks. The platform made it easy to find positions that matched my skills and experience."
                  </p>
                  <div className="mt-4 flex items-center">
                    <div className="flex-shrink-0">
                      <span className="inline-block h-10 w-10 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-bold">
                        S
                      </span>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium">Sarah Johnson</h4>
                      <p className="text-sm text-primary-200">Software Engineer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
