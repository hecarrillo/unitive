"use client"

import { FC, useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { usePathname, useSearchParams } from 'next/navigation';
import Loading from '../utils/Loading';
import LocationCard from './LocationCard';
import LocationDetailModal from './LocationDetailModal';
import LocationsBar from './LocationsBar';

interface LatLng {
  lat: number;
  lng: number;
} 

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

interface ApiResponse {
  locations: Location[];
  page: number;
  perPage: number;
  total: number;
}

const defaultCenter: LatLng = {
  lat: 19.4326,
  lng: -99.1332,
};

// const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

const getMarkerIcon = (isHovered: boolean, isSelected: boolean) => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: isHovered ? '#ef4444' : '#00e600',
  fillOpacity: 1,
  strokeWeight: isHovered ? 3 : 1,
  strokeColor: isHovered ? '#ef4444' : '#000000',
  scale: isHovered ? 10 : (isSelected ? 9 : 7),
});
  
const MapLayout: FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!
  });

  const [loading, setLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [selectedPlace, setSelectedPlace] = useState<Location | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(12);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLocationsWithImages = async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const locationResponse = await fetch(
        `/api/search?latitude=${defaultCenter.lat}&longitude=${defaultCenter.lng}&distance=3&page=${page}&perPage=100`
      );
      
      if (!locationResponse.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      const locationData: ApiResponse = await locationResponse.json();
      let newLocations = locationData.locations;
      
      const locationIds = newLocations.filter(location => location.image).map(location => location.id);
      
      if (locationIds.length > 0) {
        try {
          const imageResponse = await fetch('/api/locationImages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ locationIds }),
          });

          if (imageResponse.ok) {
            const images = await imageResponse.json();
            newLocations = newLocations.map(location => ({
              ...location,
              image: images[location.id] || null
            }));
          } else {
            newLocations = newLocations.map(location => ({
              ...location,
              image: null
            }));
          }
        } catch (imageError) {
          console.error('Error fetching images:', imageError);
          newLocations = newLocations.map(location => ({
            ...location,
            image: null
          }));
        }
      }

      if (append) {
        setLocations(prev => [...prev, ...newLocations]);
      } else {
        setLocations(newLocations);
      }

      setHasMore(
        newLocations.length === 10 && 
        (locationData.page * locationData.perPage) < locationData.total
      );

      if (!append) {
        setInitialDataLoaded(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setInitialDataLoaded(true);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleScroll = useCallback((
    scrollLeft: number, 
    scrollWidth: number, 
    clientWidth: number
  ) => {
    const scrollThreshold = scrollWidth - (scrollLeft + clientWidth);
    if (scrollThreshold < 100 && !loadingMore && hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchLocationsWithImages(currentPage + 1, true);
    }
  }, [loadingMore, hasMore, currentPage]);

  // Handle map instance
  const onLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMapInstance(null);
  }, []);

  // Reset map when pathname or search params change
  useEffect(() => {
    if (mapInstance) {
      mapInstance.setZoom(12);
      mapInstance.setCenter(defaultCenter);
      setSelectedPlace(null);
    }
  }, [pathname, searchParams, mapInstance]);

  // Initial data load
  useEffect(() => {
    fetchLocationsWithImages(1);
  }, []);

  const handleMarkerClick = (place: Location) => {
    setSelectedPlace(place);
    setIsModalOpen(true);
    setCenter({
      lat: place.latitude,
      lng: place.longitude,
    });
    setZoom(14);
  };
  
  const handleCardClose = () => {
    setSelectedPlace(null);
    setZoom(12);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPlace(null);
    setZoom(12);
    
    // Reset map container width
    if (mapInstance) {
      const mapDiv = mapInstance.getDiv();
      mapDiv.style.width = '100%';
      mapDiv.style.position = 'relative';
      google.maps.event.trigger(mapInstance, 'resize');
      mapInstance.setCenter(defaultCenter);
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <Loading />;
  if (loading || !initialDataLoaded) return <Loading />;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map Container - Adjusts width based on modal state and screen size */}
      <div 
        className={`
          absolute transition-all duration-300 ease-in-out h-full
          ${isModalOpen 
            ? 'lg:w-1/2 lg:right-0 lg:left-auto w-full hidden lg:block' 
            : 'w-full right-0'
          }
        `}
      >
        <GoogleMap
          center={center}
          zoom={zoom}
          mapContainerStyle={{ 
            width: '100%', 
            height: '100%'
          }}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
          }}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {locations.map(place => {
            const isHovered = hoveredPlace === place.id;
            const isSelected = selectedPlace?.id === place.id;
            
            return (
              <Marker
                key={place.id}
                position={{lat: place.latitude, lng: place.longitude}}
                onClick={() => handleMarkerClick(place)}
                animation={isSelected ? google.maps.Animation.BOUNCE : undefined}
                icon={getMarkerIcon(isHovered, isSelected)}
              />
            );
          })}
        </GoogleMap>
      </div>
  
      {/* Bottom Locations Bar - Adjusts width based on modal state and screen size */}
      {initialDataLoaded && locations.length > 0 && (
        <div 
          className={`
            fixed bottom-0 left-0 z-10
            transition-all duration-300 ease-in-out
            ${isModalOpen ? 'lg:w-1/2' : 'w-full'}
            ${isModalOpen ? 'hidden lg:block' : 'block'}
          `}
        >
          <LocationsBar
            locations={locations}
            onScroll={handleScroll}
            loading={loadingMore}
            onLocationHover={setHoveredPlace}
            selectedLocationId={selectedPlace?.id}
          />
        </div>
      )}
  
      {/* Modal - Full screen on mobile, half screen on desktop */}
      {selectedPlace && isModalOpen && (
        <div 
          className={`
            fixed top-0 left-0 h-full z-20
            transition-all duration-300 ease-in-out
            bg-white shadow-xl
            w-full lg:w-1/2
          `}
        >
          <LocationDetailModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            locationId={selectedPlace.id}
          />
        </div>
      )}
  
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-30">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
      )}
  
      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-30">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg shadow">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLayout;