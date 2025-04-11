import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Job } from "@shared/schema";
import StatsCard from "@/components/dashboard/stats-card";
import JobListItem from "@/components/dashboard/job-list-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Briefcase,
  Users,
  BarChart2,
  PlusCircle,
  Loader2
} from "lucide-react";

const EmployerDashboard = () => {
  const { user } = useAuth();
  
  // Fetch employer jobs
  const { data: jobs, isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/employer/jobs"],
  });
  
  // Fetch employer statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<{
    activeListings: number;
    totalApplicants: number;
    listingViews: number;
  }>({
    queryKey: ["/api/employer/stats"],
  });
  
  // Mock data for charts - in a real app, this would come from the API
  const applicantsData = [
    { name: 'Jan', value: 12 },
    { name: 'Feb', value: 19 },
    { name: 'Mar', value: 15 },
    { name: 'Apr', value: 18 },
    { name: 'May', value: 25 },
    { name: 'Jun', value: 22 },
  ];
  
  if (!user || user.role !== 'employer') {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Approval check removed as requested
  
  return (
    <div className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
          <div className="mt-4 md:mt-0">
            <Link href="/post-job">
              <Button className="bg-primary hover:bg-primary-600">
                <PlusCircle className="mr-2 h-4 w-4" />
                Post New Job
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Active Listings"
            value={isLoadingStats ? "-" : stats?.activeListings || 0}
            icon={<Briefcase />}
            linkText="View all"
            linkHref="/employer/jobs"
            iconBgColor="bg-primary-100"
            iconColor="text-primary-600"
          />
          
          <StatsCard
            title="Total Applicants"
            value={isLoadingStats ? "-" : stats?.totalApplicants || 0}
            icon={<Users />}
            linkText="Review all"
            linkHref="/employer/applications"
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />
          
          <StatsCard
            title="Listing Views"
            value={isLoadingStats ? "-" : stats?.listingViews || 0}
            icon={<BarChart2 />}
            linkText="View analytics"
            linkHref="/employer/analytics"
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
        </div>
        
        {/* Job Listings */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Job Listings</h2>
          
          {isLoadingJobs ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No jobs posted yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start posting jobs to attract top talent for your company.
                  </p>
                  <Link href="/post-job">
                    <Button className="mt-6 bg-primary hover:bg-primary-600">
                      Post Your First Job
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-gray-200">
                {jobs.map(job => (
                  <JobListItem 
                    key={job.id} 
                    job={job} 
                    applicantsCount={10} // This would come from the API in a real implementation
                  />
                ))}
              </ul>
            </Card>
          )}
        </div>
        
        {/* Analytics */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Applicant Trends</h2>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={applicantsData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tips & Resources */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tips for Employers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Writing Effective Job Descriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Clear, detailed job descriptions attract more qualified candidates. Be specific about requirements,
                  responsibilities, and company culture.
                </p>
                <Link href="/resources/job-descriptions">
                  <Button variant="link" className="px-0 mt-2 text-primary hover:text-primary-600">
                    Learn more
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Screening Candidates Efficiently</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Develop a structured evaluation process to quickly identify the most promising candidates
                  from your applicant pool.
                </p>
                <Link href="/resources/candidate-screening">
                  <Button variant="link" className="px-0 mt-2 text-primary hover:text-primary-600">
                    Learn more
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
