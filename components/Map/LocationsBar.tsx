import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ExternalLink } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  image: string | null;
  summarizedReview: string | null;
  rating: number | null;
}

interface LocationsBarProps {
  locations: Location[];
}

const LocationsBar: React.FC<LocationsBarProps> = ({ locations }) => {
  const router = useRouter();
  const [locationImages, setLocationImages] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const locationIds = locations.filter(location => location.image).map(location => location.id);
        const response = await fetch('/api/locationImages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ locationIds }),
        });

        if (response.ok) {
          const images = await response.json();
          setLocationImages(images);
        } else {
          console.error('Failed to fetch location images', await response.text());
        }
      } catch (error) {
        console.error('Error fetching location images:', error);
      }
    };

    fetchImages();
  }, [locations]);

  const handleReadMore = (location: Location) => {
    router.push(`/location?id=${location.id}&name=${location.name}&review=${location.summarizedReview}&rating=${location.rating}`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4">
          {locations.map((location) => (
            <Card key={location.id} className="w-80 flex-shrink-0 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <CardContent className="p-3">
                <div className="flex">
                  <div className="w-1/3 mr-3">
                    <div className="aspect-square rounded-lg overflow-hidden">
                      {locationImages[location.id] ? (
                        <Image
                          src={locationImages[location.id]}
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
                  <div className="w-2/3">
                    <h3 className="font-bold text-lg leading-tight mb-1">{location.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{location.type}</p>
                    <button
                      onClick={() => handleReadMore(location)}
                      className="text-sm text-green-600 hover:underline flex items-center"
                    >
                      Ver reseña aquí
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </button>
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
        </div>
        <ScrollBar orientation="horizontal" className="bg-transparent" />
      </ScrollArea>
    </div>
  );
};

export default LocationsBar;