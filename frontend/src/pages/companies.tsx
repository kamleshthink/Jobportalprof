import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Star, Search, ChevronRight } from "lucide-react";

interface Company {
  id: number;
  name: string;
  logo: string;
  rating: number;
  reviews: number;
  industry: string[];
  type: string;
  founded?: number;
  size?: string;
}

interface CompanyFilterProps {
  title: string;
  options: {
    id: string;
    label: string;
    count?: number;
  }[];
  onChange: (selected: string[]) => void;
}

const CompanyFilter = ({ title, options, onChange }: CompanyFilterProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleChange = (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter(item => item !== id)
      : [...selected, id];
    
    setSelected(newSelected);
    onChange(newSelected);
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center">
            <Checkbox 
              id={option.id} 
              checked={selected.includes(option.id)}
              onCheckedChange={() => handleChange(option.id)}
            />
            <label 
              htmlFor={option.id} 
              className="ml-2 text-sm text-gray-700 flex-1"
            >
              {option.label}
            </label>
            {option.count !== undefined && (
              <span className="text-xs text-gray-500">({option.count})</span>
            )}
          </div>
        ))}
      </div>
      {selected.length > 0 && (
        <Button 
          variant="link" 
          className="text-xs p-0 h-auto mt-2" 
          onClick={() => {
            setSelected([]);
            onChange([]);
          }}
        >
          Clear all
        </Button>
      )}
    </div>
  );
};

const CompanyCard = ({ company }: { company: Company }) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <Link href={`/companies/${company.id}`}>
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
              ) : (
                <div className="text-lg font-bold text-gray-400">{company.name.charAt(0)}</div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900 truncate">{company.name}</h3>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-2" />
              </div>
              
              <div className="flex items-center mt-1">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  <span className="ml-1 text-sm font-medium">{company.rating.toFixed(1)}</span>
                </div>
                <span className="mx-2 text-xs text-gray-500">{company.reviews} reviews</span>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                {company.type && <span className="px-2 py-1 bg-gray-100 rounded-full">{company.type}</span>}
                {company.industry.map((ind, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 rounded-full">{ind}</span>
                ))}
                {company.founded && <span className="px-2 py-1 bg-gray-100 rounded-full">Founded: {company.founded}</span>}
                {company.size && <span className="px-2 py-1 bg-gray-100 rounded-full">{company.size}</span>}
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

const CompanyTypeFilter = ({ onChange }: { onChange: (selected: string[]) => void }) => {
  return (
    <CompanyFilter
      title="Company type"
      options={[
        { id: "corporate", label: "Corporate", count: 4300 },
        { id: "foreign-mnc", label: "Foreign MNC", count: 1475 },
        { id: "indian-mnc", label: "Indian MNC", count: 615 },
        { id: "startup", label: "Startup", count: 605 },
      ]}
      onChange={onChange}
    />
  );
};

const LocationFilter = ({ onChange }: { onChange: (selected: string[]) => void }) => {
  return (
    <CompanyFilter
      title="Location"
      options={[
        { id: "bangalore", label: "Bengaluru", count: 3372 },
        { id: "delhi-ncr", label: "Delhi / NCR", count: 5264 },
        { id: "mumbai", label: "Mumbai (All Areas)", count: 2846 },
        { id: "hyderabad", label: "Hyderabad", count: 2375 },
      ]}
      onChange={onChange}
    />
  );
};

const IndustryFilter = ({ onChange }: { onChange: (selected: string[]) => void }) => {
  return (
    <CompanyFilter
      title="Industry"
      options={[
        { id: "it-services", label: "IT Services & Consulting", count: 2324 },
        { id: "software-product", label: "Software Product", count: 480 },
        { id: "education", label: "Education / Training", count: 268 },
        { id: "medical", label: "Medical Services / Hospital", count: 265 },
      ]}
      onChange={onChange}
    />
  );
};

const ExperienceFilter = ({ onChange }: { onChange: (selected: string[]) => void }) => {
  return (
    <CompanyFilter
      title="Experience"
      options={[
        { id: "experienced", label: "Experienced", count: 8281 },
        { id: "entry-level", label: "Entry Level", count: 2186 },
      ]}
      onChange={onChange}
    />
  );
};

const CompanyCategoryButton = ({ 
  category,
  count,
  onClick
}: { 
  category: string; 
  count: string;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-medium text-gray-900">{category}</h3>
      <div className="mt-2 text-sm text-primary font-medium">
        {count} <ChevronRight className="w-4 h-4 ml-1 inline" />
      </div>
    </button>
  );
};

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [companyTypes, setCompanyTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [experience, setExperience] = useState<string[]>([]);

  // Mock fetch companies (replace with actual API call)
  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies", { search: searchTerm, types: companyTypes, locations, industries, experience }],
    queryFn: async () => {
      // This would be replaced with an actual API call
      // For now, just return mock data
      return [
        {
          id: 1,
          name: "Acme Formulation",
          logo: "",
          rating: 3.9,
          reviews: 150, 
          industry: ["Pharmaceutical & Life Sciences"],
          type: "Corporate",
          founded: 2004
        },
        {
          id: 2,
          name: "Digit Insurance",
          logo: "",
          rating: 3.9,
          reviews: 1240,
          industry: ["Internet", "Unicorn"],
          type: "Startup",
          founded: 2016
        },
        {
          id: 3,
          name: "RPM Global Business",
          logo: "",
          rating: 4.2,
          reviews: 2,
          industry: ["Chemicals"],
          type: "Corporate",
          founded: 1947
        },
        {
          id: 4,
          name: "Huntsman International",
          logo: "",
          rating: 4.3,
          reviews: 228,
          industry: ["Chemicals"],
          type: "Corporate",
          founded: 1970
        },
        {
          id: 5,
          name: "Becton Dickinson",
          logo: "",
          rating: 4.0,
          reviews: 502,
          industry: ["Medical Devices & Equipment"],
          type: "Foreign MNC",
        },
        {
          id: 6,
          name: "Legacy Health",
          logo: "",
          rating: 3.8,
          reviews: 54,
          industry: ["Medical Services / Hospital"],
          type: "Corporate",
          founded: 2004
        },
        {
          id: 7,
          name: "Xalted Information Systems",
          logo: "",
          rating: 3.6,
          reviews: 7,
          industry: ["IT Services & Consulting"],
          type: "Corporate",
        },
        {
          id: 8,
          name: "Jtsi Technologies India",
          logo: "",
          rating: 4.1,
          reviews: 20,
          industry: ["IT Services & Consulting"],
          type: "Corporate",
        },
      ];
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Top companies hiring now</h1>
        
        {/* Company Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
          <CompanyCategoryButton category="MNCs" count="2.1k+ Companies" onClick={() => {}} />
          <CompanyCategoryButton category="Internet" count="245 Companies" onClick={() => {}} />
          <CompanyCategoryButton category="Manufacturing" count="958 Companies" onClick={() => {}} />
          <CompanyCategoryButton category="Fortune 500" count="115 Companies" onClick={() => {}} />
          <CompanyCategoryButton category="Product" count="1.1k+ Companies" onClick={() => {}} />
        </div>
        
        <div className="lg:flex lg:gap-8">
          {/* Filters sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-6">
              <h2 className="font-bold text-lg mb-4">All Filters</h2>
              
              <LocationFilter onChange={setLocations} />
              <IndustryFilter onChange={setIndustries} />
              <ExperienceFilter onChange={setExperience} />
              <CompanyTypeFilter onChange={setCompanyTypes} />
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            {/* Search Box */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search for companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !companies || companies.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">No companies found</h3>
                <p className="mt-2 text-sm text-gray-500">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600 mb-4">
                  Showing {companies.length} companies
                </div>
                
                <div className="space-y-4">
                  {companies.map((company) => (
                    <CompanyCard key={company.id} company={company} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Companies;