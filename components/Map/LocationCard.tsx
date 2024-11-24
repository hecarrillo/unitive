import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, X } from "lucide-react"
import Image from 'next/image';

interface Location {
  id: string;
  name: string;
  image: string | null;
  thumbnailImage: string | null;
  latitude: number;
  longitude: number;
  summarizedReview: string | null;
  rating: number | null;
  distance: number;
  aspectRatings: { [key: string]: number };
  type?: string;
}

interface LocationCardProps {
  location: Location;
  onClose?: () => void;
}

const isImageSrcValid = (src: string) => {
  const urlPattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
    "(\\#[-a-z\\d_]*)?$", "i" // fragment locator
  );
  return !!urlPattern.test(src);
};

const LocationCard: React.FC<LocationCardProps> = ({ location, onClose }) => {
  const router = useRouter();
  
  return (
    <Card className="fixed bottom-4 left-4 w-80 shadow-lg">
      <CardHeader className="relative pb-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-2" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardTitle className="pr-8">{location.name}</CardTitle>
        <CardDescription className="flex items-center">
          <Star className="w-4 h-4 mr-1 text-yellow-400" />
          {location.rating ? location.rating.toFixed(1) : 'N/A'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-40 mb-4">
          {location.thumbnailImage && isImageSrcValid(location.thumbnailImage) ? (
            <Image 
              src={location.thumbnailImage} 
              alt={location.name} 
              fill 
              className="w-full h-full object-cover rounded-md" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 rounded-md">
              No image available
            </div>
          )}
        </div>
        <p className="text-sm mb-4">{location.summarizedReview || 'No description available.'}</p>
      </CardContent>
    </Card>
  );
};

export default LocationCard;