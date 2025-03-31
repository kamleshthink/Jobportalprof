import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { User, Job } from "@shared/schema";
import StatsCard from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  AlertTriangle, 
  Briefcase, 
  BarChart3,
  Download,
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  pendingApprovals: number;
  flaggedJobs: number;
  applicationsToday: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch admin statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });
  
  // Fetch pending employer approvals
  const { data: pendingEmployers, isLoading: isLoadingEmployers } = useQuery<User[]>({
    queryKey: ["/api/admin/pending-approvals"],
  });
  
  // Fetch flagged jobs
  const { data: flaggedJobs, isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/admin/flagged-jobs"],
  });
  
  // Approve employer mutation
  const approveEmployerMutation = useMutation({
    mutationFn: async ({ userId, approved }: { userId: number, approved: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/approve`, { approved });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Employer updated",
        description: "The employer status has been updated successfully.",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating employer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update job status mutation
  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/admin/jobs/${jobId}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Job status updated",
        description: "The job status has been updated successfully.",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/flagged-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating job status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleApproveEmployer = (userId: number) => {
    approveEmployerMutation.mutate({ userId, approved: true });
  };
  
  const handleRejectEmployer = (userId: number) => {
    approveEmployerMutation.mutate({ userId, approved: false });
  };
  
  const handleApproveJob = (jobId: number) => {
    updateJobStatusMutation.mutate({ jobId, status: 'active' });
  };
  
  const handleRemoveJob = (jobId: number) => {
    updateJobStatusMutation.mutate({ jobId, status: 'closed' });
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  if (!user || user.role !== 'admin') {
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button className="bg-primary hover:bg-primary-600">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={isLoadingStats ? "-" : stats?.totalUsers || 0}
            icon={<Users />}
            linkText="View all"
            linkHref="/admin/users"
            iconBgColor="bg-primary-100"
            iconColor="text-primary-600"
          />
          
          <StatsCard
            title="Pending Approvals"
            value={isLoadingStats ? "-" : stats?.pendingApprovals || 0}
            icon={<AlertTriangle />}
            linkText="Review"
            linkHref="/admin/approvals"
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
          />
          
          <StatsCard
            title="Active Jobs"
            value={isLoadingStats ? "-" : stats?.totalJobs || 0}
            icon={<Briefcase />}
            linkText="View all"
            linkHref="/admin/jobs"
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />
          
          <StatsCard
            title="Applications Today"
            value={isLoadingStats ? "-" : stats?.applicationsToday || 0}
            icon={<BarChart3 />}
            linkText="View analytics"
            linkHref="/admin/analytics"
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
        </div>
        
        {/* Main content grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Employer Signups */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">
                Recent Employer Signups
              </CardTitle>
              {!isLoadingEmployers && pendingEmployers && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {pendingEmployers.length} Pending
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingEmployers ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !pendingEmployers || pendingEmployers.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">All caught up!</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No pending employer approvals at the moment.
                  </p>
                </div>
              ) : (
                <>
                  <div className="border-t border-gray-200">
                    <div className="overflow-hidden overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Company
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingEmployers.slice(0, 3).map((employer) => (
                            <tr key={employer.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src="" alt={employer.company || employer.name} />
                                    <AvatarFallback>{getInitials(employer.company || employer.name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {employer.company || "N/A"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {employer.company ? "Employer" : "Unknown"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{employer.name}</div>
                                <div className="text-sm text-gray-500">{employer.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-primary hover:bg-primary-600" 
                                    onClick={() => handleApproveEmployer(employer.id)}
                                    disabled={approveEmployerMutation.isPending}
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    asChild
                                  >
                                    <Link href={`/admin/users/${employer.id}`}>
                                      <Eye className="mr-1 h-3 w-3" />
                                      Review
                                    </Link>
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleRejectEmployer(employer.id)}
                                    disabled={approveEmployerMutation.isPending}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <Link href="/admin/approvals">
                      <Button variant="outline">
                        View All
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Flagged Job Listings */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">
                Flagged Job Listings
              </CardTitle>
              {!isLoadingJobs && flaggedJobs && (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {flaggedJobs.length} Flagged
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingJobs ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !flaggedJobs || flaggedJobs.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">All clear!</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No flagged job postings to review.
                  </p>
                </div>
              ) : (
                <>
                  <div className="border-t border-gray-200">
                    <div className="overflow-hidden overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Job Title
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Company
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reason
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {flaggedJobs.slice(0, 3).map((job) => (
                            <tr key={job.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{job.title}</div>
                                <div className="text-sm text-gray-500">
                                  {job.createdAt && new Date(job.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{job.company.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {job.company}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant="outline" className="bg-red-100 text-red-800">
                                  Suspicious Content
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-primary hover:bg-primary-600" 
                                    onClick={() => handleApproveJob(job.id)}
                                    disabled={updateJobStatusMutation.isPending}
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    asChild
                                  >
                                    <Link href={`/jobs/${job.id}`}>
                                      <Eye className="mr-1 h-3 w-3" />
                                      Review
                                    </Link>
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleRemoveJob(job.id)}
                                    disabled={updateJobStatusMutation.isPending}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <Link href="/admin/flagged-jobs">
                      <Button variant="outline">
                        View All
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8 bg-blue-100">
                      <AvatarFallback className="text-blue-600">U</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">New user registration:</span> Jane Smith (jane@example.com)
                    </p>
                    <p className="text-xs text-gray-500">10 minutes ago</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8 bg-green-100">
                      <AvatarFallback className="text-green-600">J</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">New job posting:</span> Senior Developer at Tech Solutions Inc.
                    </p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8 bg-yellow-100">
                      <AvatarFallback className="text-yellow-600">A</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Application submitted:</span> User #1235 applied to Marketing Manager position
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8 bg-red-100">
                      <AvatarFallback className="text-red-600">F</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Job flagged:</span> Job posting #8765 was flagged for inappropriate content
                    </p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </li>
              </ul>
              
              <div className="mt-4 text-center">
                <Link href="/admin/activity">
                  <Button variant="link" className="text-primary hover:text-primary-600">
                    View all activity
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

export default AdminDashboard;
