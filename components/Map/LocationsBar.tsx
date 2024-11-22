import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Star, Route } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useRouteLocations } from '@/hooks/useRouteLocations';
import { useToast } from '@/components/ui/toast';
import {MarqueeText} from '@/components/ui/marquee-text';

interface Location {
  id: string;
  name: string;
  image: string | null;
  latitude: number;
  longitude: number;
  summarizedReview: string | null;
  rating: number | null;
  distance: number;
  aspectRatings: { [key: string]: number };
  type?: string;
}

interface LocationsBarProps {
  locations: Location[];
  onScroll?: (scrollLeft: number, scrollWidth: number, clientWidth: number) => void;
  loading?: boolean;
  onLocationHover?: (locationId: string | null) => void;
  selectedLocationId?: string | null;
  onLocationSelect: (location: Location) => void;
}

const LocationsBar: React.FC<LocationsBarProps> = ({ 
  locations, 
  onScroll, 
  loading, 
  onLocationHover,
  selectedLocationId,
  onLocationSelect 
}) => {
  const { favoriteLocations, toggleFavorite, isLoading: favoritesLoading } = useFavorites();
  const [optimisticFavorites, setOptimisticFavorites] = React.useState<Set<string>>(new Set());
  const { routeLocations, toggleRouteLocation, isLoading: routesLoading, refreshRoute } = useRouteLocations();
  const [hoveredCardId, setHoveredCardId] = React.useState<string | null>(null);
  const [optimisticRoutes, setOptimisticRoutes] = React.useState<Set<string>>(new Set());
  const { toast } = useToast();

  React.useEffect(() => {
    setOptimisticFavorites(new Set(favoriteLocations));
  }, [favoriteLocations]);
  React.useEffect(() => {
    setOptimisticRoutes(new Set(routeLocations));
  }, [routeLocations]);

  const handleFavoriteClick = async (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation();
    
    setOptimisticFavorites(prev => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });

    await toggleFavorite(locationId);
  };

  const handleRouteClick = async (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation();
    
    if (routesLoading) {
      return;
    }

    try {
      // Update optimistic state first
      const isAdding = !optimisticRoutes.has(locationId);
      setOptimisticRoutes(prev => {
        const next = new Set(prev);
        if (next.has(locationId)) {
          next.delete(locationId);
        } else {
          next.add(locationId);
        }
        return next;
      });

      await toggleRouteLocation(locationId);
      const location = locations.find(loc => loc.id === locationId);
      
      toast({
        title: isAdding ? "Added to route" : "Removed from route",
        description: location?.name,
        duration: 2000,
      });

      // Ensure route data is fresh
      await refreshRoute();
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticRoutes(new Set(routeLocations));
      toast({
        title: "Error updating route",
        description: "Please try again",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleCardHover = (locationId: string | null) => {
    setHoveredCardId(locationId);
    onLocationHover?.(locationId);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4">
          {locations.map((location) => (
            <Card 
              key={location.id} 
              className={`
                w-80 flex-shrink-0 bg-white transition-all duration-300 
                hover:shadow-lg cursor-pointer relative
                ${selectedLocationId === location.id 
                  ? 'ring-2 ring-green-600 shadow-lg' 
                  : 'shadow hover:shadow-xl'
                }
              `}
              onMouseEnter={() => handleCardHover(location.id)}
              onMouseLeave={() => handleCardHover(null)}
              onClick={() => onLocationSelect(location)}
            >
              <button 
                onClick={(e) => handleFavoriteClick(e, location.id)}
                className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors z-10 bg-white/80 backdrop-blur-sm"
              >
                <Star 
                  className={`w-5 h-5 ${
                    optimisticFavorites.has(location.id)
                      ? 'fill-yellow-400 stroke-yellow-400'
                      : 'stroke-gray-400'
                  }`}
                />
              </button>
              <div className="absolute top-11 right-2 z-10">
                <button 
                  onClick={(e) => handleRouteClick(e, location.id)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors bg-white/80 backdrop-blur-sm"
                  //disabled={routesLoading}
                >
                  <Route 
                    className={`w-5 h-5 ${
                      optimisticRoutes.has(location.id)
                        ? 'fill-blue-400 stroke-blue-400'
                        : 'stroke-gray-400'
                    } ${routesLoading ? 'opacity-50' : ''}`}
                  />
                </button>
              </div>
              <CardContent className="p-3">
                <div className="flex">
                  <div className="w-24 flex-shrink-0 mr-3">
                    <div className="aspect-square rounded-lg overflow-hidden">
                      {location.image ? (
                        <Image
                          src={location.image}
                          alt={location.name}
                          width={120}
                          height={120}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm">
                          No image
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg leading-tight mb-1 pr-8">
                      <MarqueeText 
                        text={location.name} 
                        isCardHovered={hoveredCardId === location.id}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-1 truncate">{location.type}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {location.summarizedReview || 'No review available'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {loading && (
            <div className="flex items-center justify-center w-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" className="bg-transparent" />
      </ScrollArea>
    </div>
  );
};

export default LocationsBar;