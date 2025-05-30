import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ServiceCard } from "@/components/services/service-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter } from "lucide-react";

// Mock data for demonstration - in a real app, this would come from the API
const mockServices = [
  {
    id: 1,
    title: "Professional Resume Design - ATS Friendly CV with Modern Templates",
    price: 499,
    category: "Resume Writing",
    deliveryTime: "24 hours",
    rating: 4.9,
    reviewCount: 253,
    sellerName: "ResumeExpert",
    sellerAvatar: "https://randomuser.me/api/portraits/men/1.jpg",
    sellerLevel: "Top Rated",
    thumbnailUrl: "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    featured: true
  },
  {
    id: 2,
    title: "LinkedIn Profile Optimization - Professional Branding and Bio Writing",
    price: 799,
    category: "Career Coaching",
    deliveryTime: "3 days",
    rating: 4.8,
    reviewCount: 187,
    sellerName: "CareerBoost",
    sellerAvatar: "https://randomuser.me/api/portraits/women/2.jpg",
    sellerLevel: "Level 2",
    thumbnailUrl: "https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    id: 3,
    title: "Cover Letter Writing - Customized & Targeted for Your Dream Job",
    price: 599,
    category: "Writing & Translation",
    deliveryTime: "2 days",
    rating: 4.7,
    reviewCount: 129,
    sellerName: "ContentPro",
    sellerAvatar: "https://randomuser.me/api/portraits/men/3.jpg",
    sellerLevel: "Level 1",
    thumbnailUrl: "https://images.unsplash.com/photo-1586282391129-76a6df230234?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    id: 4,
    title: "Job Interview Preparation - Mock Interviews & Personalized Feedback",
    price: 1299,
    category: "Career Coaching",
    deliveryTime: "5 days",
    rating: 4.9,
    reviewCount: 95,
    sellerName: "InterviewAce",
    sellerAvatar: "https://randomuser.me/api/portraits/women/4.jpg",
    sellerLevel: "Top Rated",
    thumbnailUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    featured: true
  },
  {
    id: 5,
    title: "Professional Bio Writing for Company Websites & Profiles",
    price: 849,
    category: "Writing & Translation",
    deliveryTime: "3 days",
    rating: 4.6,
    reviewCount: 78,
    sellerName: "WordSmith",
    sellerAvatar: "https://randomuser.me/api/portraits/men/5.jpg",
    sellerLevel: "Level 2",
    thumbnailUrl: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    id: 6,
    title: "Job Application Review & Optimization for Higher Response Rate",
    price: 699,
    category: "Career Coaching",
    deliveryTime: "2 days",
    rating: 4.7,
    reviewCount: 63,
    sellerName: "HireHelper",
    sellerAvatar: "https://randomuser.me/api/portraits/women/6.jpg",
    sellerLevel: "Level 2",
    thumbnailUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    id: 7,
    title: "Career Change Coaching - Transition Planning & Job Search Strategy",
    price: 2499,
    category: "Career Coaching",
    deliveryTime: "7 days",
    rating: 4.9,
    reviewCount: 42,
    sellerName: "PathFinder",
    sellerAvatar: "https://randomuser.me/api/portraits/men/7.jpg",
    sellerLevel: "Top Rated",
    thumbnailUrl: "https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    id: 8,
    title: "Portfolio Website Design for Job Seekers & Freelancers",
    price: 3999,
    category: "Web Design",
    deliveryTime: "10 days",
    rating: 4.8,
    reviewCount: 37,
    sellerName: "WebWizard",
    sellerAvatar: "https://randomuser.me/api/portraits/women/8.jpg",
    sellerLevel: "Level 2",
    thumbnailUrl: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
];

const categories = [
  "All Categories",
  "Resume Writing",
  "Career Coaching",
  "Writing & Translation",
  "Web Design",
  "Social Media",
  "Marketing",
];

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [deliveryTime, setDeliveryTime] = useState<string[]>([]);
  const [sellerLevel, setSellerLevel] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // In a real app, this would be a query to the API with filters
  // const { data: services, isLoading } = useQuery({
  //   queryKey: ['/api/services', searchTerm, selectedCategory, priceRange, deliveryTime, sellerLevel],
  //   queryFn: () => fetch('/api/services?' + new URLSearchParams({
  //     search: searchTerm,
  //     category: selectedCategory !== 'All Categories' ? selectedCategory : '',
  //     minPrice: priceRange[0].toString(),
  //     maxPrice: priceRange[1].toString(),
  //     delivery: deliveryTime.join(','),
  //     level: sellerLevel.join(',')
  //   })).then(res => res.json())
  // });
  
  // Filter mock data based on selected filters for demo
  const filteredServices = mockServices.filter(service => {
    // Search filter
    if (searchTerm && !service.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (selectedCategory !== "All Categories" && service.category !== selectedCategory) {
      return false;
    }
    
    // Price range filter
    if (service.price < priceRange[0] || service.price > priceRange[1]) {
      return false;
    }
    
    // Delivery time filter
    if (deliveryTime.length > 0) {
      const days = parseInt(service.deliveryTime.split(' ')[0]);
      
      if (deliveryTime.includes("24 hours") && service.deliveryTime !== "24 hours") {
        if (!deliveryTime.includes(service.deliveryTime)) {
          return false;
        }
      } else if (deliveryTime.includes("Up to 3 days") && days > 3) {
        return false;
      } else if (deliveryTime.includes("Up to 7 days") && days > 7) {
        return false;
      }
    }
    
    // Seller level filter
    if (sellerLevel.length > 0 && !sellerLevel.includes(service.sellerLevel)) {
      return false;
    }
    
    return true;
  });

  const handleServiceClick = (serviceId: number) => {
    console.log(`Service ${serviceId} clicked`);
    // In a real app, navigate to service details page
    // navigate(`/services/${serviceId}`);
  };

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Professional Services</h1>
          <p className="mt-2 text-lg text-gray-600">
            Find expert services to boost your career and job search
          </p>
        </div>
        
        {/* Search and filter bar */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                className="pl-10"
                placeholder="Search for services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-gray-100" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Expanded filters */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border">
              <h3 className="font-medium mb-4">Filters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Price Range</h4>
                  <div className="px-2">
                    <Slider
                      defaultValue={[0, 5000]}
                      max={5000}
                      step={100}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>₹{priceRange[0]}</span>
                      <span>₹{priceRange[1]}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Delivery Time</h4>
                  <div className="space-y-2">
                    {["24 hours", "Up to 3 days", "Up to 7 days"].map((option) => (
                      <div key={option} className="flex items-center">
                        <Checkbox 
                          id={`delivery-${option}`}
                          checked={deliveryTime.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDeliveryTime([...deliveryTime, option]);
                            } else {
                              setDeliveryTime(deliveryTime.filter(t => t !== option));
                            }
                          }}
                        />
                        <label htmlFor={`delivery-${option}`} className="ml-2 text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Seller Level</h4>
                  <div className="space-y-2">
                    {["Level 1", "Level 2", "Top Rated"].map((level) => (
                      <div key={level} className="flex items-center">
                        <Checkbox 
                          id={`level-${level}`}
                          checked={sellerLevel.includes(level)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSellerLevel([...sellerLevel, level]);
                            } else {
                              setSellerLevel(sellerLevel.filter(l => l !== level));
                            }
                          }}
                        />
                        <label htmlFor={`level-${level}`} className="ml-2 text-sm">
                          {level}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Tabs defaultValue="trending" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              title={service.title}
              price={service.price}
              category={service.category}
              deliveryTime={service.deliveryTime}
              rating={service.rating}
              reviewCount={service.reviewCount}
              sellerName={service.sellerName}
              sellerAvatar={service.sellerAvatar}
              sellerLevel={service.sellerLevel}
              thumbnailUrl={service.thumbnailUrl}
              featured={service.featured}
              onClick={() => handleServiceClick(service.id)}
            />
          ))}
        </div>
        
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No services found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}