import { useState } from "react";
import { Link } from "wouter";
import { Bookmark, Clock, MapPin, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Job } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: Job;
  isDashboardView?: boolean;
}

const JobCard = ({ job, isDashboardView = false }: JobCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  
  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/apply`, { coverLetter: "" });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application submitted",
        description: "Your application has been successfully submitted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleApply = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
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
    
    applyMutation.mutate(job.id);
  };

  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Toggle saved state (this would be connected to an API in a real implementation)
    setIsSaved(!isSaved);
    
    toast({
      title: isSaved ? "Job removed from saved jobs" : "Job saved",
      description: isSaved ? "The job has been removed from your saved jobs" : "The job has been added to your saved jobs",
    });
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <Link href={`/jobs/${job.id}`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <h3 className="text-lg font-medium text-primary-600 truncate">{job.title}</h3>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <Building className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span>{job.company}</span>
              </div>
            </div>
            <div className="ml-2 flex-shrink-0 flex">
              {job.status === 'new' && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  New
                </Badge>
              )}
              {job.type === 'remote' && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Remote
                </Badge>
              )}
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {job.requirements?.split(',').slice(0, 3).map((req, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                  {req.trim()}
                </Badge>
              ))}
              {job.experienceLevel && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                  {job.experienceLevel === 'entry' ? 'Entry Level' :
                   job.experienceLevel === 'mid' ? 'Mid Level' :
                   job.experienceLevel === 'senior' ? 'Senior Level' : 'Executive Level'}
                </Badge>
              )}
            </div>
          </div>
          
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
            {job.description}
          </p>
          
          <div className="mt-4 sm:flex sm:justify-between items-center">
            <div className="sm:flex text-sm text-gray-500">
              <div className="flex items-center">
                <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span>{job.location}</span>
              </div>
              {job.salary && (
                <div className="mt-2 flex items-center sm:mt-0 sm:ml-6">
                  <span className="mr-1.5 text-gray-400">$</span>
                  <span>{job.salary}</span>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
              <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
              <span>
                {job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : 'Recently'}
              </span>
            </div>
          </div>
          
          {!isDashboardView && (
            <div className="mt-4 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                className={isSaved ? "text-primary border-primary" : "text-gray-700 border-gray-300"} 
                onClick={handleSave}
              >
                <Bookmark className="mr-2 h-4 w-4" />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleApply}
                disabled={applyMutation.isPending}
                className="bg-primary hover:bg-primary-600"
              >
                Apply Now
              </Button>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};

export default JobCard;
