import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";

interface PricingPlan {
  id: string;
  title: string;
  popular?: boolean;
  price: number;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  freeTrialText?: string;
}

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  period: string;
  popular?: boolean;
  buttonText: string;
  buttonLink: string;
}

const PremiumServiceCard = ({ service }: { service: ServiceCard }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {service.popular && (
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1">
              RECOMMENDED
            </div>
          )}
          
          {service.popular === false && (
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1">
              MOST POPULAR
            </div>
          )}
          
          {service.id === "ai-interview" && (
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1">
              Free Trial
            </div>
          )}
          
          <div className="px-6 pt-6 pb-8">
            <div className="flex justify-center mb-4">
              <img 
                src={service.imageUrl} 
                alt={service.title} 
                className="w-28 h-28 object-contain"
              />
            </div>
            
            <h3 className="text-base font-bold text-center uppercase mb-1">{service.title}</h3>
            <p className="text-sm text-center text-gray-700 mb-4">{service.description}</p>
            
            <div className="text-center mb-6">
              <div className="flex justify-center items-baseline">
                <span className="text-lg font-bold">₹</span>
                <span className="text-2xl font-bold">{service.price}</span>
              </div>
              {service.period && (
                <span className="text-sm text-gray-600">for {service.period}</span>
              )}
            </div>
            
            <Link href={service.buttonLink}>
              <Button className="w-full">{service.buttonText}</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ResumeServiceCard = ({ 
  title, 
  description, 
  buttonText,
  price,
  priceText,
  imageUrl 
}: { 
  title: string; 
  description: string; 
  buttonText: string;
  price?: string;
  priceText?: string;
  imageUrl: string;
}) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6 flex items-center gap-6">
          <div className="flex-shrink-0">
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-32 h-32 object-contain"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-sm text-gray-700 mb-4">{description}</p>
            
            {price && priceText && (
              <div className="mb-3">
                <span className="text-sm">Starts from</span>
                <div className="font-medium">{price} {priceText}</div>
              </div>
            )}
            
            <Button variant="outline">{buttonText}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SubscriptionCard = ({ title, benefits, price, period, buttonText }: { 
  title: string;
  benefits: string[];
  price: string;
  period: string;
  buttonText: string;
}) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <img 
              src="/assets/subscription.png" 
              alt="Subscription" 
              className="w-24 h-24 object-contain"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium uppercase text-gray-700 mb-2">KEY BENEFITS</h4>
              <ul className="space-y-1">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-blue-500 mr-2" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">Subscription starts from</div>
                <div className="font-medium">{price} {period}</div>
              </div>
              
              <Button variant="outline">{buttonText}</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Services = () => {
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'annual'>('monthly');
  
  const premiumServices: ServiceCard[] = [
    {
      id: "resume-display",
      title: "RESUME DISPLAY",
      description: "Increase your Profile Visibility to recruiters upto 3 times.",
      imageUrl: "/assets/resume-display.png",
      price: 890,
      period: "3 Months",
      popular: false,
      buttonText: "KNOW MORE",
      buttonLink: "/services/resume-display"
    },
    {
      id: "priority-applicant",
      title: "PRIORITY APPLICANT",
      description: "Be a Priority Applicant & increase your chance of getting a call.",
      imageUrl: "/assets/priority-applicant.png",
      price: 971,
      period: "3 Months",
      popular: true,
      buttonText: "KNOW MORE",
      buttonLink: "/services/priority-applicant"
    },
    {
      id: "ai-interview",
      title: "AI MOCK INTERVIEW",
      description: "Personalised AI driven mock interviews for your profile",
      imageUrl: "/assets/ai-interview.png",
      price: 296,
      period: "3 Months",
      buttonText: "KNOW MORE",
      buttonLink: "/services/ai-interview"
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="bg-indigo-900 rounded-lg p-8 mb-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Move ahead in career, faster
            </h1>
            <p className="text-lg text-indigo-200 mb-6">
              with our paid services
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="secondary">Explore Services</Button>
              <Button variant="outline" className="bg-transparent text-white hover:bg-indigo-800 hover:text-white">
                Learn More
              </Button>
            </div>
          </div>
        </div>
        
        {/* Premium Services */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Premium Services</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {premiumServices.map(service => (
              <PremiumServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
        
        {/* Resume Writing */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">RESUME WRITING</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <ResumeServiceCard
              title="Standout from the crowd with our professionally written Resume by expert"
              description="Resume that highlights your strengths and showcase your experience"
              buttonText="KNOW MORE"
              price="₹1653"
              priceText="Only"
              imageUrl="/assets/resume-writing.png"
            />
            
            <ResumeServiceCard
              title="ONLINE RESUME MAKER"
              description="Create a job-winning resume with our simple resume maker"
              buttonText="Create Resume"
              imageUrl="/assets/resume-maker.png"
            />
          </div>
        </div>
        
        {/* Subscription Plans */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscribe to our Monthly Job Search Plan</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <SubscriptionCard
              title="Subscribe to our Monthly Job Search Plan"
              benefits={[
                "Rank higher in Recruiter Searches",
                "Priority Access to Jobs",
                "Send message to Recruiter anytime"
              ]}
              price="₹890"
              period="Per month"
              buttonText="KNOW MORE"
            />
          </div>
        </div>
        
        {/* Support Call Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-16">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="mr-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">TALK TO US</p>
                <p className="text-lg font-bold">18001025557</p>
                <p className="text-xs text-gray-500">Toll Free</p>
              </div>
            </div>
            
            <Button variant="outline">CALL ME BACK</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;