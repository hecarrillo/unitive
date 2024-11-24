import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Star, Plus, X } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useRoutes } from '@/hooks/useRouteLocations';
import { useToast } from '@/components/ui/toast';
import { MarqueeText } from '@/components/ui/marquee-text';

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

interface LocationsBarProps {
  locations: Location[];
  onScroll?: (scrollLeft: number, scrollWidth: number, clientWidth: number) => void;
  loading?: boolean;
  onLocationHover?: (locationId: string | null) => void;
  selectedLocationId?: string | null;
  onLocationSelect: (location: Location) => void;
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

const LocationsBar: React.FC<LocationsBarProps> = ({ 
  locations, 
  onScroll, 
  loading, 
  onLocationHover,
  selectedLocationId,
  onLocationSelect 
}) => {
  const { favoriteLocations, toggleFavorite, isLoading: favoritesLoading } = useFavorites();
  const { routeLocations, toggleRoutes, isLoading: routesLoading } = useRoutes();
  const [hoveredCardId, setHoveredCardId] = React.useState<string | null>(null);

  const handleFavoriteClick = async (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation();
    await toggleFavorite(locationId);
  };

  const handleRouteClick = async (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation();
    await toggleRoutes(locationId);
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
                    favoriteLocations.has(location.id)
                      ? 'fill-yellow-400 stroke-yellow-400'
                      : 'stroke-gray-400'
                  }`}
                />
              </button>
              <button 
                onClick={(e) => handleRouteClick(e, location.id)}
                className={`
                  absolute top-11 right-2 px-2 py-1 
                  rounded-full transition-all z-10 
                  bg-white/80 backdrop-blur-sm
                  flex items-center gap-1
                  text-xs font-medium
                  hover:bg-gray-100
                  ${routesLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  ${routeLocations.has(location.id) 
                    ? 'text-blue-500 hover:text-blue-600' 
                    : 'text-gray-500 hover:text-gray-600'
                  }
                `}
                disabled={routesLoading}
              >
                {routeLocations.has(location.id) ? (
                  <>
                    <X className="w-3 h-3" />
                    <span>Remove from route</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    <span>Add to route</span>
                  </>
                )}
              </button>
              <CardContent className="p-3">
                <div className="flex">
                  <div className="w-24 flex-shrink-0 mr-3">
                    <div className="aspect-square rounded-lg overflow-hidden">
                      {location.thumbnailImage && isImageSrcValid(location.thumbnailImage) ? (
                        <Image
                          src={location.thumbnailImage}
                          alt={location.name}
                          width={120}
                          height={120}
                          className="object-cover w-full h-full"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQsJCgkLDY2NDAwNjZBPUA9QTY2QUFCNkY3REVHSUtJS0E3Oz5PRkdLS0v/2wBDAR"
                          placeholder="blur"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse" />                     
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