import { useState } from "react";
import { useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface JobFiltersProps {
  initialFilters?: {
    jobType?: string[];
    experienceLevel?: string[];
    salary?: number[];
  };
}

const JobFilters = ({ initialFilters }: JobFiltersProps) => {
  const [, setLocation] = useLocation();
  
  const [jobTypes, setJobTypes] = useState<string[]>(initialFilters?.jobType || []);
  const [experienceLevels, setExperienceLevels] = useState<string[]>(initialFilters?.experienceLevel || []);
  const [salaryRange, setSalaryRange] = useState<number[]>(initialFilters?.salary || [0, 200000]);
  
  const handleJobTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setJobTypes([...jobTypes, type]);
    } else {
      setJobTypes(jobTypes.filter(t => t !== type));
    }
  };
  
  const handleExperienceLevelChange = (level: string, checked: boolean) => {
    if (checked) {
      setExperienceLevels([...experienceLevels, level]);
    } else {
      setExperienceLevels(experienceLevels.filter(l => l !== level));
    }
  };
  
  const handleSalaryChange = (value: number[]) => {
    setSalaryRange(value);
  };
  
  const handleApplyFilters = () => {
    const queryParams = new URLSearchParams(window.location.search);
    
    // Update or remove job type filter
    if (jobTypes.length > 0) {
      queryParams.set('type', jobTypes.join(','));
    } else {
      queryParams.delete('type');
    }
    
    // Update or remove experience level filter
    if (experienceLevels.length > 0) {
      queryParams.set('experience', experienceLevels.join(','));
    } else {
      queryParams.delete('experience');
    }
    
    // Update or remove salary range filter
    if (salaryRange[0] > 0 || salaryRange[1] < 200000) {
      queryParams.set('minSalary', salaryRange[0].toString());
      queryParams.set('maxSalary', salaryRange[1].toString());
    } else {
      queryParams.delete('minSalary');
      queryParams.delete('maxSalary');
    }
    
    const queryString = queryParams.toString();
    setLocation(`/jobs${queryString ? `?${queryString}` : ""}`);
  };
  
  const handleResetFilters = () => {
    setJobTypes([]);
    setExperienceLevels([]);
    setSalaryRange([0, 200000]);
    
    // Remove filter parameters from URL, keep search and location if present
    const queryParams = new URLSearchParams(window.location.search);
    const search = queryParams.get('search');
    const location = queryParams.get('location');
    
    queryParams.delete('type');
    queryParams.delete('experience');
    queryParams.delete('minSalary');
    queryParams.delete('maxSalary');
    
    if (search) queryParams.set('search', search);
    if (location) queryParams.set('location', location);
    
    const queryString = queryParams.toString();
    setLocation(`/jobs${queryString ? `?${queryString}` : ""}`);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Job Type</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-full-time" 
                  checked={jobTypes.includes('full-time')}
                  onCheckedChange={(checked) => 
                    handleJobTypeChange('full-time', checked === true)
                  }
                />
                <Label htmlFor="filter-full-time">Full-time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-part-time" 
                  checked={jobTypes.includes('part-time')}
                  onCheckedChange={(checked) => 
                    handleJobTypeChange('part-time', checked === true)
                  }
                />
                <Label htmlFor="filter-part-time">Part-time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-contract" 
                  checked={jobTypes.includes('contract')}
                  onCheckedChange={(checked) => 
                    handleJobTypeChange('contract', checked === true)
                  }
                />
                <Label htmlFor="filter-contract">Contract</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-internship" 
                  checked={jobTypes.includes('internship')}
                  onCheckedChange={(checked) => 
                    handleJobTypeChange('internship', checked === true)
                  }
                />
                <Label htmlFor="filter-internship">Internship</Label>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Experience Level</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-entry" 
                  checked={experienceLevels.includes('entry')}
                  onCheckedChange={(checked) => 
                    handleExperienceLevelChange('entry', checked === true)
                  }
                />
                <Label htmlFor="filter-entry">Entry Level</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-mid" 
                  checked={experienceLevels.includes('mid')}
                  onCheckedChange={(checked) => 
                    handleExperienceLevelChange('mid', checked === true)
                  }
                />
                <Label htmlFor="filter-mid">Mid Level</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-senior" 
                  checked={experienceLevels.includes('senior')}
                  onCheckedChange={(checked) => 
                    handleExperienceLevelChange('senior', checked === true)
                  }
                />
                <Label htmlFor="filter-senior">Senior Level</Label>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Salary Range</h4>
            <div className="mt-2">
              <Slider
                defaultValue={[0, 200000]}
                max={200000}
                step={10000}
                value={salaryRange}
                onValueChange={handleSalaryChange}
                className="mt-6"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>${salaryRange[0].toLocaleString()}</span>
                <span>${salaryRange[1].toLocaleString()}+</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResetFilters}
              className="text-sm text-primary hover:text-primary-600"
            >
              Reset filters
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleApplyFilters}
              className="bg-primary hover:bg-primary-600"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobFilters;
