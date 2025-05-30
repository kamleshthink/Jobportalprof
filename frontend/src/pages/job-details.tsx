import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Job } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Briefcase,
  Building,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Share2,
  Bookmark,
  AlertCircle,
  CheckCircle
} from "lucide-react";

const JobDetails = () => {
  const params = useParams<{ id: string }>();
  const jobId = parseInt(params.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  
  // Fetch job details
  const { data: job, isLoading, error } = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
  });
  
  // Application mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/apply`, { coverLetter });
      return await res.json();
    },
    onSuccess: () => {
      setApplicationSuccess(true);
      setApplying(false);
      toast({
        title: "Application submitted",
        description: "Your application has been successfully submitted!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: (error: Error) => {
      setApplying(false);
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleApply = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to apply for this job",
        variant: "destructive",
      });
      return;
    }
    
    if (user.role !== "jobseeker") {
      toast({
        title: "Action not allowed",
        description: "Only job seekers can apply for jobs",
        variant: "destructive",
      });
      return;
    }
    
    setApplying(true);
  };
  
  const submitApplication = () => {
    applyMutation.mutate();
  };
  
  const handleSaveJob = () => {
    toast({
      title: "Job saved",
      description: "This job has been added to your saved jobs",
    });
  };
  
  const handleShareJob = () => {
    // Copy the current URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    
    toast({
      title: "Link copied",
      description: "Job link has been copied to clipboard",
    });
  };
  
  // Format job requirements as list
  const formatRequirements = (requirementsString?: string) => {
    if (!requirementsString) return [];
    return requirementsString.split(',').map(req => req.trim());
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load job details. Please try again later.
          </AlertDescription>
        </Alert>
        
        <div className="mt-6 text-center">
          <Link href="/jobs">
            <Button className="bg-primary hover:bg-primary-600">
              Back to Jobs
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Apply Success Alert */}
        {applicationSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
              Your application has been submitted. You can track its status in your dashboard.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Job Card */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">{job.title}</CardTitle>
                <CardDescription className="mt-1 flex items-center text-base">
                  <Building className="mr-1 h-4 w-4 text-gray-500" />
                  {job.company}
                </CardDescription>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveJob}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareJob}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                <span>{job.location}</span>
              </div>
              
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 text-gray-400 mr-2" />
                <span>
                  {job.type === 'full-time' ? 'Full-time' : 
                   job.type === 'part-time' ? 'Part-time' : 
                   job.type === 'contract' ? 'Contract' : 
                   job.type === 'internship' ? 'Internship' : job.type}
                </span>
              </div>
              
              {job.salary && (
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                  <span>{job.salary}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <span>Posted {job.createdAt && format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
              </div>
              
              {job.deadline && (
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <span>Apply before {format(new Date(job.deadline), 'MMM dd, yyyy')}</span>
                </div>
              )}
              
              {job.experienceLevel && (
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>
                    {job.experienceLevel === 'entry' ? 'Entry Level' : 
                     job.experienceLevel === 'mid' ? 'Mid Level' : 
                     job.experienceLevel === 'senior' ? 'Senior Level' : 
                     job.experienceLevel === 'executive' ? 'Executive Level' : job.experienceLevel}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {formatRequirements(job.requirements).map((req, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                  {req}
                </Badge>
              ))}
            </div>
            
            <Separator className="my-6" />
            
            <div className="prose max-w-none">
              <h3 className="text-lg font-medium text-gray-900">Job Description</h3>
              <div className="mt-2 whitespace-pre-line">
                {job.description}
              </div>
              
              {formatRequirements(job.requirements).length > 0 && (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mt-6">Requirements</h3>
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    {formatRequirements(job.requirements).map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            
            <div className="mt-8 flex justify-center">
              {job.status === 'active' && !applicationSuccess ? (
                <Dialog open={applying} onOpenChange={setApplying}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      className="bg-primary hover:bg-primary-600 w-full md:w-auto"
                      onClick={handleApply}
                    >
                      Apply for this position
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Apply for {job.title}</DialogTitle>
                      <DialogDescription>
                        Submit your application for this position at {job.company}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="cover-letter" className="text-sm font-medium">
                          Cover Letter (Optional)
                        </label>
                        <Textarea
                          id="cover-letter"
                          placeholder="Tell the employer why you're a good fit for this position..."
                          rows={8}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setApplying(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={submitApplication}
                        disabled={applyMutation.isPending}
                        className="bg-primary hover:bg-primary-600"
                      >
                        {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : job.status === 'active' && applicationSuccess ? (
                <Link href="/dashboard">
                  <Button className="bg-green-600 hover:bg-green-700">
                    View your applications
                  </Button>
                </Link>
              ) : (
                <Button disabled className="cursor-not-allowed">
                  This job is no longer accepting applications
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">About {job.company}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {job.company.charAt(0)}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">{job.company}</h3>
                <div className="flex mt-1 space-x-4">
                  <Link href={`/companies/${encodeURIComponent(job.company)}`} className="text-primary hover:text-primary-600 text-sm font-medium">
                    View company profile
                  </Link>
                  <Link href={`/companies/${encodeURIComponent(job.company)}/jobs`} className="text-primary hover:text-primary-600 text-sm font-medium">
                    View all jobs
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Similar Jobs - placeholder for future implementation */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Jobs</h2>
          <p className="text-center py-8 text-gray-500">
            Similar job recommendations will appear here as they become available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
