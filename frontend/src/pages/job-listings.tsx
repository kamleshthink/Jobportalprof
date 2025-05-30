import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Job } from "@shared/schema";
import JobCard from "@/components/jobs/job-card";
import JobSearch from "@/components/jobs/job-search";
import JobFilters from "@/components/jobs/job-filters";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

const JobListings = () => {
  const [location, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Parse query parameters from URL
  const parseQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      search: params.get('search') || '',
      location: params.get('location') || '',
      type: params.get('type')?.split(',') || [],
      experience: params.get('experience')?.split(',') || [],
      minSalary: params.get('minSalary') ? parseInt(params.get('minSalary')!) : 0,
      maxSalary: params.get('maxSalary') ? parseInt(params.get('maxSalary')!) : 200000,
      page: params.get('page') ? parseInt(params.get('page')!) : 1,
    };
  };
  
  const queryParams = parseQueryParams();
  
  // Update page when URL changes
  useEffect(() => {
    const params = parseQueryParams();
    setPage(params.page);
  }, [location]);
  
  // Build API query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    
    if (queryParams.search) params.append('search', queryParams.search);
    if (queryParams.location) params.append('location', queryParams.location);
    if (queryParams.type.length > 0) params.append('type', queryParams.type.join(','));
    if (queryParams.experience.length > 0) params.append('experience', queryParams.experience.join(','));
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    return params.toString();
  };
  
  // Fetch jobs with filters
  const { data, isLoading, error } = useQuery<{jobs: Job[], total: number}>({
    queryKey: [`/api/jobs?${buildQueryString()}`],
  });
  
  const handlePageChange = (newPage: number) => {
    // Update URL with the new page parameter
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('page', newPage.toString());
    setLocation(`/jobs?${currentParams.toString()}`);
  };
  
  // Calculate pagination values
  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const showingStart = ((page - 1) * limit) + 1;
  const showingEnd = Math.min(page * limit, data?.total || 0);
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      } else if (page >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('ellipsis');
        for (let i = page - 1; i <= page + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  const topCompanies = [
    { name: "Google", jobs: 42, image: "" },
    { name: "Amazon", jobs: 36, image: "" },
    { name: "Microsoft", jobs: 28, image: "" },
    { name: "Apple", jobs: 24, image: "" },
  ];
  
  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search bar */}
        <div className="mb-8">
          <JobSearch />
        </div>
        
        <div className="lg:flex lg:items-center lg:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Job Listings
            </h2>
            {!isLoading && data && (
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {data.total} jobs found
                </div>
                {queryParams.location && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {queryParams.location}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Filters */}
          <div className="hidden lg:block">
            <JobFilters 
              initialFilters={{
                jobType: queryParams.type,
                experienceLevel: queryParams.experience,
                salary: [queryParams.minSalary, queryParams.maxSalary],
              }} 
            />
            
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Top Companies Hiring</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-gray-200">
                  {topCompanies.map((company, index) => (
                    <li key={index} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <Avatar>
                          <AvatarImage src={company.image} alt={company.name} />
                          <AvatarFallback>{company.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="ml-3 text-sm font-medium text-gray-900">{company.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{company.jobs} jobs</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Jobs List */}
          <div className="mt-6 lg:mt-0 lg:col-span-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900">Error loading jobs</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Please try again later.
                    </p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="mt-4 bg-primary hover:bg-primary-600"
                    >
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : data && data.jobs.length > 0 ? (
              <div>
                <div className="space-y-4">
                  {data.jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <div className="sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{showingStart}</span> to{" "}
                          <span className="font-medium">{showingEnd}</span> of{" "}
                          <span className="font-medium">{data.total}</span> results
                        </p>
                      </div>
                      
                      <Pagination>
                        <PaginationContent>
                          {page > 1 && (
                            <PaginationItem>
                              <PaginationPrevious 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(page - 1);
                                }}
                              />
                            </PaginationItem>
                          )}
                          
                          {getPageNumbers().map((pageNum, i) => (
                            pageNum === 'ellipsis' ? (
                              <PaginationItem key={`ellipsis-${i}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            ) : (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(pageNum as number);
                                  }}
                                  isActive={page === pageNum}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          ))}
                          
                          {page < totalPages && (
                            <PaginationItem>
                              <PaginationNext 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(page + 1);
                                }}
                              />
                            </PaginationItem>
                          )}
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search filters to find more results.
                    </p>
                    <Link href="/jobs">
                      <Button className="mt-4 bg-primary hover:bg-primary-600">
                        Clear filters
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobListings;
