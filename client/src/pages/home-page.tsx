import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import JobSearch from "@/components/jobs/job-search";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserPlus, Search, Briefcase } from "lucide-react";

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
          <div className="relative">
            <div className="absolute inset-0">
              <div className="h-full w-full object-cover bg-gradient-to-r from-primary-600 to-indigo-700" />
            </div>
            <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Find Your Dream Job Today
              </h1>
              <p className="mt-6 text-xl text-indigo-100 max-w-3xl">
                Connect with thousands of employers and opportunities that match your skills and career goals.
              </p>
              
              <div className="mt-10">
                <JobSearch isHeroSearch={true} />
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
                How It Works
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need in one place
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Whether you're looking for a job or hiring talent, we've got you covered.
              </p>
            </div>

            <div className="mt-10">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                      Create Your Profile
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Sign up and build your professional profile or employer account in minutes.
                  </dd>
                </div>
                
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <Search className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                      Find Opportunities
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Browse thousands of job listings or post your vacancies to reach qualified candidates.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                      Apply or Hire
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Apply to jobs with one click or manage applications from talented candidates.
                  </dd>
                </div>
              </dl>
            </div>
            
            <div className="mt-16 flex justify-center">
              <Button asChild className="bg-primary hover:bg-primary-600">
                <Link href="/auth">Get Started</Link>
              </Button>
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
