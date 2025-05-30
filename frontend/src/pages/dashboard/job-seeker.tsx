import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Application, Job } from "@shared/schema";
import JobCard from "@/components/jobs/job-card";
import StatsCard from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { 
  UserIcon, 
  FileText, 
  BookmarkIcon, 
  CheckCircle,
  Clock, 
  Building,
  MapPin,
  Loader2
} from "lucide-react";

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  
  // Fetch job seeker's applications
  const { data: applications, isLoading: isLoadingApplications } = useQuery<(Application & { job: Job })[]>({
    queryKey: ["/api/applications"],
  });
  
  // Fetch recommended jobs based on the job seeker's profile
  const { data: recommendedJobs, isLoading: isLoadingRecommended } = useQuery<Job[]>({
    queryKey: ["/api/jobs?recommended=true"],
  });
  
  // Count applications by status
  const getApplicationCounts = () => {
    if (!applications) return { total: 0, pending: 0, reviewed: 0, interviewed: 0 };
    
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      reviewed: applications.filter(app => app.status === 'reviewed').length,
      interviewed: applications.filter(app => ['interviewed', 'accepted', 'rejected'].includes(app.status)).length,
    };
  };
  
  const applicationCounts = getApplicationCounts();
  
  // Get application status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-800">Reviewed</Badge>;
      case 'interviewed':
        return <Badge className="bg-purple-100 text-purple-800">Interviewed</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return null;
    }
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
          <div className="mt-4 md:mt-0">
            <Link href="/profile">
              <Button className="bg-primary hover:bg-primary-600">
                <UserIcon className="mr-2 h-4 w-4" />
                Update Profile
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Applications"
            value={applicationCounts.total}
            icon={<FileText />}
            linkText="View all"
            linkHref="/dashboard/applications"
            iconBgColor="bg-primary-100"
            iconColor="text-primary-600"
          />
          
          <StatsCard
            title="Interviews"
            value={applicationCounts.interviewed}
            icon={<CheckCircle />}
            linkText="View all"
            linkHref="/dashboard/applications?status=interviewed"
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          
          <StatsCard
            title="Saved Jobs"
            value="0"
            icon={<BookmarkIcon />}
            linkText="View all"
            linkHref="/dashboard/saved-jobs"
            iconBgColor="bg-indigo-100"
            iconColor="text-indigo-600"
          />
        </div>
        
        {/* Applications and Recommended Jobs Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="applications">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="applications">Your Applications</TabsTrigger>
              <TabsTrigger value="recommended">Recommended Jobs</TabsTrigger>
            </TabsList>
            
            {/* Applications Tab */}
            <TabsContent value="applications" className="mt-6">
              {isLoadingApplications ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !applications || applications.length === 0 ? (
                <Card>
                  <CardContent className="py-10">
                    <div className="text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No applications yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Start applying to jobs to track your applications here.
                      </p>
                      <Link href="/jobs">
                        <Button className="mt-6 bg-primary hover:bg-primary-600">
                          Browse Jobs
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y divide-gray-200">
                      {applications.slice(0, 5).map((application) => (
                        <li key={application.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Link href={`/jobs/${application.jobId}`}>
                                <h3 className="text-lg font-medium text-primary-600 hover:text-primary-800">
                                  {application.job.title}
                                </h3>
                              </Link>
                              <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-1">
                                <div className="flex items-center">
                                  <Building className="mr-1 h-4 w-4 text-gray-400" />
                                  {application.job.company}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                                  {application.job.location}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="mr-1 h-4 w-4 text-gray-400" />
                                  {application.appliedAt 
                                    ? `Applied ${formatDistanceToNow(new Date(application.appliedAt))}`
                                    : 'Applied recently'}
                                </div>
                              </div>
                            </div>
                            <div>
                              {getStatusBadge(application.status)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    
                    {applications.length > 5 && (
                      <div className="mt-6 text-center">
                        <Link href="/dashboard/applications">
                          <Button variant="outline">View all applications</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Recommended Jobs Tab */}
            <TabsContent value="recommended" className="mt-6">
              {isLoadingRecommended ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !recommendedJobs || recommendedJobs.length === 0 ? (
                <Card>
                  <CardContent className="py-10">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No recommendations yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Complete your profile to get personalized job recommendations.
                      </p>
                      <Link href="/profile">
                        <Button className="mt-6 bg-primary hover:bg-primary-600">
                          Complete Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(recommendedJobs) && recommendedJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Profile Completion Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <span className="ml-4 text-sm font-medium">70%</span>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Basic Information</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Skills Added</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Resume Not Uploaded</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Professional Bio Not Added</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Link href="/profile">
                  <Button variant="outline" className="w-full">
                    Complete Your Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
