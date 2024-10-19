import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, X } from "lucide-react"
import Image from 'next/image';

const LocationCard = ({ location, onClose, onViewDetails }) => {
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
          {location.image ? (
            <Image src={location.image} alt={location.name} className="w-full h-full object-cover rounded-md" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 rounded-md">
              No image available
            </div>
          )}
        </div>
        <p className="text-sm mb-4">{location.summarizedReview || 'No description available.'}</p>
        <Button 
          className="w-full" 
          onClick={() => onViewDetails(location.id, location.name, location.summarizedReview, location.rating)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default LocationCard;