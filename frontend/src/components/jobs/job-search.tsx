import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";

interface JobSearchProps {
  className?: string;
  isHeroSearch?: boolean;
}

const JobSearch = ({ className, isHeroSearch = false }: JobSearchProps) => {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const queryParams = new URLSearchParams();
    
    if (searchTerm) {
      queryParams.append("search", searchTerm);
    }
    
    if (locationTerm) {
      queryParams.append("location", locationTerm);
    }
    
    const queryString = queryParams.toString();
    setLocation(`/jobs${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className={`${isHeroSearch ? 'bg-white rounded-lg shadow-xl overflow-hidden' : ''}`}>
        <div className={`${isHeroSearch ? 'px-6 py-8 md:p-10' : ''} sm:flex items-center`}>
          <div className="w-full sm:flex-1 mb-4 sm:mb-0 sm:mr-4">
            <label htmlFor="job-search" className="sr-only">Search for jobs</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                name="job-search"
                id="job-search"
                className={`block w-full pl-10 pr-3 ${isHeroSearch ? 'py-4' : 'py-2'} border border-gray-300 rounded-md`}
                placeholder="Job title, keywords, or company"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full sm:flex-1 mb-4 sm:mb-0 sm:mr-4">
            <label htmlFor="location" className="sr-only">Location</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                name="location"
                id="location"
                className={`block w-full pl-10 pr-3 ${isHeroSearch ? 'py-4' : 'py-2'} border border-gray-300 rounded-md`}
                placeholder="City, state, or remote"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className={`w-full sm:w-auto flex items-center justify-center px-8 ${isHeroSearch ? 'py-4' : 'py-2'} bg-primary hover:bg-primary-600 text-white`}
          >
            Search Jobs
          </Button>
        </div>
      </div>
    </form>
  );
};

export default JobSearch;
