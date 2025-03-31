import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, MapPin, Users, Calendar, Building, ExternalLink, Briefcase } from "lucide-react";
import JobCard from "@/components/jobs/job-card";
import { Job } from "@shared/schema";

interface CompanyReview {
  id: number;
  user: string;
  rating: number;
  title: string;
  pros: string;
  cons: string;
  date: string;
}

interface CompanyDetail {
  id: number;
  name: string;
  logo: string;
  coverImage?: string;
  description: string;
  website: string;
  headquarters: string;
  founded: number;
  industry: string[];
  employeeCount: string;
  rating: number;
  reviews: CompanyReview[];
  reviewsCount: number;
  jobs: Job[];
  about: string;
  benefits: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

const RatingStar = ({ filled }: { filled: boolean }) => (
  <Star 
    className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} 
    fill={filled ? 'currentColor' : 'none'}
  />
);

const CompanyRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <RatingStar key={star} filled={rating >= star} />
      ))}
      <span className="ml-2 text-lg font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

const ReviewCard = ({ review }: { review: CompanyReview }) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">{review.title}</h3>
            <div className="flex items-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <RatingStar key={star} filled={review.rating >= star} />
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {review.date}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-green-600 mb-2">Pros</h4>
            <p className="text-sm text-gray-700">{review.pros}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-2">Cons</h4>
            <p className="text-sm text-gray-700">{review.cons}</p>
          </div>
        </div>
        
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <span>Posted by {review.user}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const companyId = parseInt(id);
  
  const { data: company, isLoading } = useQuery<CompanyDetail>({
    queryKey: [`/api/companies/${companyId}`],
    queryFn: async () => {
      // This would be replaced with an actual API call
      // For now, just return mock data
      return {
        id: companyId,
        name: "Acme Technologies",
        logo: "/assets/company-logo.png",
        coverImage: "/assets/company-cover.jpg",
        description: "Leading technology solutions provider with global presence",
        website: "https://www.acmetech.com",
        headquarters: "Bangalore, India",
        founded: 2005,
        industry: ["IT Services & Consulting", "Software Development"],
        employeeCount: "1000-5000",
        rating: 4.2,
        reviewsCount: 235,
        about: "Acme Technologies is a global leader in providing innovative technology solutions across various industries. Founded in 2005, we have grown to become one of the most respected companies in our field, with offices in 15 countries and over 3,000 employees worldwide. Our mission is to empower businesses through technology and help them achieve their full potential.",
        benefits: [
          "Comprehensive health insurance",
          "Flexible work hours",
          "Remote work options",
          "Professional development budget",
          "Generous paid time off",
          "Employee stock options"
        ],
        socialLinks: {
          linkedin: "https://www.linkedin.com/company/acmetech",
          twitter: "https://twitter.com/acmetech",
          facebook: "https://facebook.com/acmetech"
        },
        reviews: [
          {
            id: 1,
            user: "Senior Software Engineer",
            rating: 4,
            title: "Great work culture with growth opportunities",
            pros: "Good work-life balance, talented colleagues, opportunity to work on cutting-edge technologies, generous benefits package.",
            cons: "Sometimes communication between departments could be better. Project deadlines can be tight occasionally.",
            date: "July 15, 2024"
          },
          {
            id: 2,
            user: "Product Manager",
            rating: 5,
            title: "Best company I've worked for",
            pros: "Excellent leadership, clear vision, good compensation, embraces remote work, and invests in employee growth.",
            cons: "Some processes could be more streamlined, occasional growing pains as the company expands.",
            date: "June 3, 2024"
          },
          {
            id: 3,
            user: "UX Designer",
            rating: 3,
            title: "Mixed experience overall",
            pros: "Creative freedom, good design team, competitive salary, nice office environment.",
            cons: "High workload at times, some design decisions overridden by business needs, limited advancement opportunities in design track.",
            date: "May 12, 2024"
          }
        ],
        jobs: [
          {
            id: 1,
            title: "Senior Full Stack Developer",
            company: "Acme Technologies",
            description: "We're looking for an experienced Full Stack Developer to join our growing team...",
            location: "Bangalore",
            type: "full-time",
            salary: "₹20L - ₹30L per annum",
            requirements: "5+ years of experience with React, Node.js, and cloud platforms",
            experienceLevel: "senior",
            postedBy: 1,
            status: "active",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            title: "Product Manager",
            company: "Acme Technologies",
            description: "Join our product team to help define and drive our product roadmap...",
            location: "Bangalore (Remote)",
            type: "full-time",
            salary: "₹18L - ₹28L per annum",
            requirements: "3+ years of product management experience in tech",
            experienceLevel: "mid",
            postedBy: 1,
            status: "active",
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
            deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
          },
          {
            id: 3,
            title: "DevOps Engineer",
            company: "Acme Technologies",
            description: "We're looking for a DevOps Engineer to help us scale our infrastructure...",
            location: "Bangalore",
            type: "full-time",
            salary: "₹15L - ₹25L per annum",
            requirements: "Experience with AWS, Kubernetes, CI/CD pipelines",
            experienceLevel: "mid",
            postedBy: 1,
            status: "active",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        ]
      };
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Company not found</h1>
        <p className="text-gray-600 mb-6">The company you're looking for doesn't exist or has been removed.</p>
        <Link href="/companies">
          <Button>Back to Companies</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Company Header */}
      <div className="relative bg-gradient-to-r from-blue-900 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center p-2">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="max-w-full max-h-full" />
              ) : (
                <Building className="w-12 h-12 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <p className="text-blue-200 mt-2">{company.description}</p>
              
              <div className="mt-4">
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-1" />
                    <span>{company.headquarters}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-1" />
                    <span>{company.employeeCount} employees</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-1" />
                    <span>Founded {company.founded}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                {company.industry.map((ind, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-blue-700 text-white">
                    {ind}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div>
                <CompanyRating rating={company.rating} />
                <div className="text-center text-sm mt-1">{company.reviewsCount} reviews</div>
              </div>
              
              <a href={company.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-800">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Website
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Company Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="jobs">Jobs ({company.jobs.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({company.reviewsCount})</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4">About {company.name}</h2>
            <div className="prose max-w-none">
              <p>{company.about}</p>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Company Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex">
                  <div className="w-24 flex-shrink-0 font-medium">Website</div>
                  <div>
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="w-24 flex-shrink-0 font-medium">Industry</div>
                  <div>{company.industry.join(", ")}</div>
                </div>
                
                <div className="flex">
                  <div className="w-24 flex-shrink-0 font-medium">Founded</div>
                  <div>{company.founded}</div>
                </div>
                
                <div className="flex">
                  <div className="w-24 flex-shrink-0 font-medium">Size</div>
                  <div>{company.employeeCount} employees</div>
                </div>
                
                <div className="flex">
                  <div className="w-24 flex-shrink-0 font-medium">Location</div>
                  <div>{company.headquarters}</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="jobs" className="space-y-4">
            {company.jobs.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No open positions</h3>
                  <p className="text-gray-500 mt-2">
                    This company doesn't have any active job postings at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              company.jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Employee Reviews</h2>
                  <p className="text-gray-500 mt-1">
                    {company.reviewsCount} reviews for {company.name}
                  </p>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <Button>Write a Review</Button>
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-center">
                  <div className="text-4xl font-bold mr-4">{company.rating.toFixed(1)}</div>
                  <div>
                    <CompanyRating rating={company.rating} />
                    <p className="text-sm text-gray-500 mt-1">Based on {company.reviewsCount} reviews</p>
                  </div>
                </div>
              </div>
            </div>
            
            {company.reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </TabsContent>
          
          <TabsContent value="benefits" className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-6">Employee Benefits</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {company.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <div className="mt-1 mr-3 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-800">{benefit}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CompanyDetails;