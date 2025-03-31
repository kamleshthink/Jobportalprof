import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import JobForm from "@/components/jobs/job-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const JobPostPage = () => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect if user is not an employer or admin
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== "employer" && user.role !== "admin") {
        setLocation("/");
      }
    }
  }, [user, isLoading, setLocation]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Render "pending approval" message if employer account is not approved
  if (user && user.role === "employer" && !user.isApproved) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-yellow-800">Account Pending Approval</h2>
                <p className="mt-2 text-yellow-700">
                  Your employer account is currently pending approval by our administrators.
                  You'll be able to post jobs once your account is approved.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-6" 
                  onClick={() => setLocation("/dashboard")}
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Render job posting form if user is an approved employer or admin
  if (user && (user.role === "employer" || user.role === "admin")) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
            <p className="mt-1 text-sm text-gray-500">
              Fill out the form below to create a new job listing for your company.
            </p>
          </div>
          
          <JobForm />
          
          <div className="mt-10">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium text-gray-900">Tips for writing effective job posts</h3>
                <ul className="mt-4 space-y-3 text-sm text-gray-600">
                  <li className="flex">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Be specific about responsibilities and requirements</span>
                  </li>
                  <li className="flex">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Include information about your company culture</span>
                  </li>
                  <li className="flex">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Be transparent about salary range and benefits</span>
                  </li>
                  <li className="flex">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Clearly state if the position is remote, hybrid, or in-office</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  // Fallback (though this should be covered by the useEffect redirect)
  return null;
};

export default JobPostPage;
