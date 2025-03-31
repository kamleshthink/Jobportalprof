import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import JobSearch from "@/components/jobs/job-search";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Building, 
  Briefcase, 
  Search, 
  GraduationCap, 
  HeartHandshake, 
  Code, 
  PieChart, 
  MapPin, 
  Banknote, 
  Clock, 
  Star 
} from "lucide-react";
import { Building2 } from "lucide-react";

const popularSearches = [
  "Software Engineer", "Data Scientist", "Product Manager", 
  "Business Analyst", "Digital Marketing", "UI/UX Designer"
];

const jobCategories = [
  { 
    name: "Information Technology", 
    icon: <Code className="h-8 w-8 text-blue-600" />,
    jobs: "24,156 Jobs"
  },
  { 
    name: "Business Development", 
    icon: <PieChart className="h-8 w-8 text-green-600" />,
    jobs: "18,423 Jobs"
  },
  { 
    name: "Finance", 
    icon: <Banknote className="h-8 w-8 text-yellow-600" />,
    jobs: "12,890 Jobs"
  },
  { 
    name: "Education", 
    icon: <GraduationCap className="h-8 w-8 text-purple-600" />,
    jobs: "9,674 Jobs"
  },
  { 
    name: "Human Resources", 
    icon: <HeartHandshake className="h-8 w-8 text-pink-600" />,
    jobs: "7,321 Jobs"
  },
  { 
    name: "Remote Work", 
    icon: <Building className="h-8 w-8 text-gray-600" />,
    jobs: "15,782 Jobs"
  }
];

const topCompanies = [
  { name: "Google", icon: <Building2 className="h-6 w-6" />, color: "text-red-500" },
  { name: "Microsoft", icon: <Building2 className="h-6 w-6" />, color: "text-blue-500" },
  { name: "Amazon", icon: <Building2 className="h-6 w-6" />, color: "text-yellow-500" },
  { name: "Apple", icon: <Building2 className="h-6 w-6" />, color: "text-gray-500" },
  { name: "Meta", icon: <Building2 className="h-6 w-6" />, color: "text-blue-600" },
  { name: "IBM", icon: <Building2 className="h-6 w-6" />, color: "text-blue-800" },
  { name: "Netflix", icon: <Building2 className="h-6 w-6" />, color: "text-red-600" },
  { name: "Adobe", icon: <Building2 className="h-6 w-6" />, color: "text-red-800" }
];

const featuredJobs = [
  {
    title: "Senior Software Engineer",
    company: "Google",
    location: "Bangalore",
    salary: "₹30L - ₹45L",
    type: "Full-time",
    experience: "5-8 years",
    logo: <Building2 className="h-10 w-10 text-red-500" />,
    skills: ["Java", "Spring Boot", "React", "AWS"]
  },
  {
    title: "Data Scientist",
    company: "Microsoft",
    location: "Hyderabad",
    salary: "₹20L - ₹35L",
    type: "Full-time",
    experience: "3-5 years",
    logo: <Building2 className="h-10 w-10 text-blue-500" />,
    skills: ["Python", "R", "Machine Learning", "SQL"]
  },
  {
    title: "Product Manager",
    company: "Amazon",
    location: "Mumbai",
    salary: "₹25L - ₹40L",
    type: "Full-time",
    experience: "4-7 years",
    logo: <Building2 className="h-10 w-10 text-yellow-600" />,
    skills: ["Product Development", "Agile", "User Research"]
  }
];

const HomePage = () => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect logged-in users to their appropriate dashboard
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "employer") {
        setLocation("/employer/dashboard");
      } else if (user.role === "admin") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, isLoading, setLocation]);
  
  // Guest home page
  if (!user) {
    return (
      <>
        {/* Hero Section */}
        <section className="bg-white">
          <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="max-w-5xl mx-auto text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
                  Find Your <span className="text-blue-600">Dream Job</span> Here
                </h1>
                <p className="mt-5 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                  Over 1.8 million+ jobs available matching your skills and experience
                </p>
              </div>
              
              <div className="mt-8 max-w-4xl mx-auto">
                <JobSearch isHeroSearch={true} />
                
                {/* Popular Searches */}
                <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
                  <span className="text-gray-500 text-sm font-medium">Popular Searches:</span>
                  {popularSearches.map((search, index) => (
                    <Link
                      key={index}
                      href={`/jobs?search=${encodeURIComponent(search)}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {search}{index < popularSearches.length - 1 ? "," : ""}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Job Categories */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Explore Jobs by Category
              </h2>
              <p className="mt-4 text-gray-600">
                Find opportunities in your specialized field from thousands of listings
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {jobCategories.map((category, index) => (
                <Link href={`/jobs?category=${encodeURIComponent(category.name)}`} key={index}>
                  <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {category.icon}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.jobs}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/jobs">View All Categories</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Featured Jobs */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Featured Jobs
              </h2>
              <p className="mt-4 text-gray-600">
                Premium and exclusive jobs from top employers
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredJobs.map((job, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-shrink-0">
                        {job.logo}
                      </div>
                      <div className="ml-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                          Featured
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-base text-gray-700 mb-4">{job.company}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Banknote className="h-4 w-4 mr-1" />
                        {job.salary}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.experience}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 3 && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          +{job.skills.length - 3}
                        </span>
                      )}
                    </div>
                    
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/jobs/${index + 1}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                <Link href="/jobs">View All Jobs</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Top Companies */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Top Companies Hiring Now
              </h2>
              <p className="mt-4 text-gray-600">
                Discover opportunities with these leading employers
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {topCompanies.map((company, index) => (
                <Link href={`/companies/${company.name.toLowerCase()}`} key={index}>
                  <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-300">
                    <div className={`mb-4 ${company.color}`}>
                      {company.icon}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{company.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <Star className="h-3 w-3 inline-block text-yellow-400 mr-1" />
                      4.5 • {20 + index} open jobs
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/companies">View All Companies</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="py-16 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-6 md:mb-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Ready to Start Your Career Journey?
                </h2>
                <p className="mt-2 text-white text-opacity-90">
                  Join millions of job seekers and employers finding success on our platform
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-white text-blue-600 hover:bg-gray-100 rounded-full">
                  <Link href="/auth">Sign Up as Job Seeker</Link>
                </Button>
                <Button asChild className="bg-blue-700 text-white hover:bg-blue-800 border border-white rounded-full">
                  <Link href="/auth?role=employer">Register as Employer</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }
  
  // Loading state
  return null;
};

export default HomePage;
