import { useAuth } from "@/hooks/use-auth";
import { Job } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, MapPin, Users, Edit, MoreVertical, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JobListItemProps {
  job: Job;
  applicantsCount?: number;
}

const JobListItem = ({ job, applicantsCount = 0 }: JobListItemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "flagged":
        return <Badge className="bg-red-100 text-red-800">Flagged</Badge>;
      default:
        return null;
    }
  };
  
  const reopenJobMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/jobs/${job.id}`, {
        ...job,
        status: "active",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Job reopened",
        description: "This job listing is now active again.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error reopening job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleReopen = () => {
    reopenJobMutation.mutate();
  };
  
  return (
    <li>
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="sm:flex sm:items-center flex-1 min-w-0">
            <div className="flex-shrink-0 hidden sm:block">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" alt={job.company} />
                <AvatarFallback>{getInitials(job.company)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="sm:ml-4 truncate">
              <div className="flex items-center">
                <h3 className="text-base font-medium text-gray-900 truncate">{job.title}</h3>
                {getStatusBadge(job.status)}
              </div>
              <div className="mt-1 flex flex-wrap text-sm text-gray-500">
                <div className="mr-2 flex items-center">
                  <Clock className="mr-1 h-4 w-4 text-gray-400" />
                  {job.status === "closed" ? 
                    `Closed ${formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}` :
                    `Posted ${formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}`
                  }
                </div>
                <div className="mr-2 flex items-center">
                  <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4 text-gray-400" />
                  {applicantsCount} applicant{applicantsCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
          <div className="ml-5 flex shrink-0">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/jobs/${job.id}/applicants`}>
                  <Users className="mr-1 h-4 w-4" />
                  Applicants
                </Link>
              </Button>
              
              {job.status === "active" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <Link href={`/jobs/${job.id}/edit`}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              )}
              
              {job.status === "closed" && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleReopen}
                  disabled={reopenJobMutation.isPending}
                  className="bg-primary hover:bg-primary-600"
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Repost
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/jobs/${job.id}`}>View Job</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Close Job</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Delete Job</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default JobListItem;
