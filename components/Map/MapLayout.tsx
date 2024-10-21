"use client"

import { FC, useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, useLoadScript } from '@react-google-maps/api';
import { usePathname, useSearchParams } from 'next/navigation';
import Loading from '../utils/Loading';
import LocationCard from './LocationCard';
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

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

const MapLayout: FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Use useLoadScript hook instead of LoadScript component
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
  });

  const [loading, setLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [selectedPlace, setSelectedPlace] = useState<Location | null>(null);
  const [zoom, setZoom] = useState<number>(12);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const fetchLocationsWithImages = async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const locationResponse = await fetch(
        `/api/search?latitude=${defaultCenter.lat}&longitude=${defaultCenter.lng}&distance=3&page=${page}&perPage=10`
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
    const shouldLoadMore = scrollThreshold < 100;

    if (shouldLoadMore && !loadingMore && hasMore) {
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
    setCenter({
      lat: place.latitude,
      lng: place.longitude
    });
    setZoom(14);
  };
  
  const handleCardClose = () => {
    setSelectedPlace(null);
    setZoom(12);
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <Loading />;
  if (loading || !initialDataLoaded) return <Loading />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="relative w-full h-screen">
      <GoogleMap
        center={center}
        zoom={zoom}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {locations.map(place => (
          <Marker
            key={place.id}
            position={{lat: place.latitude, lng: place.longitude}}
            onClick={() => handleMarkerClick(place)}
            animation={selectedPlace?.id === place.id ? 
              google.maps.Animation.BOUNCE : undefined}
          />
        ))}
      </GoogleMap>

      {initialDataLoaded && locations.length > 0 && (
        <LocationsBar
          locations={locations}
          onScroll={handleScroll}
          loading={loadingMore}
        />
      )}

      {selectedPlace && (
        <LocationCard
          location={selectedPlace}
          onClose={handleCardClose}
        />
      )}
    </div>
  );
};

export default MapLayout;