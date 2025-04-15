import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface ServiceCardProps {
  title: string;
  price: number;
  category: string;
  deliveryTime: string;
  rating: number;
  reviewCount: number;
  sellerName: string;
  sellerAvatar: string;
  sellerLevel: string;
  thumbnailUrl: string;
  featured?: boolean;
  onClick?: () => void;
}

export function ServiceCard({
  title,
  price,
  category,
  deliveryTime,
  rating,
  reviewCount,
  sellerName,
  sellerAvatar,
  sellerLevel,
  thumbnailUrl,
  featured = false,
  onClick,
}: ServiceCardProps) {
  return (
    <Card className={`overflow-hidden h-full flex flex-col ${featured ? 'border-primary shadow-md' : ''}`}>
      <div className="relative">
        {featured && (
          <Badge className="absolute top-2 left-2 z-10 bg-primary text-white">
            Featured
          </Badge>
        )}
        <div className="h-40 overflow-hidden">
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      </div>
      
      <CardHeader className="p-4 pb-0">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
          <div className="flex items-center">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
          </div>
        </div>
        <CardTitle className="text-base font-semibold line-clamp-2 mb-2">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="flex items-center mt-2 mb-4">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={sellerAvatar} alt={sellerName} />
            <AvatarFallback>{sellerName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{sellerName}</p>
            <p className="text-xs text-gray-500">{sellerLevel}</p>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mb-2">
          Delivery in {deliveryTime}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Starting at</p>
          <p className="text-lg font-bold">₹{price.toLocaleString()}</p>
        </div>
        <Button 
          variant="default" 
          size="sm"
          onClick={onClick}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}