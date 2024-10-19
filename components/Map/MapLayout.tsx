"use client"

import { FC, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
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
  lng: -99.1332, // Mexico City coordinates
};

const MapLayout: FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [selectedPlace, setSelectedPlace] = useState<Location | null>(null);
  const [zoom, setZoom] = useState<number>(12);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLocations = async (page: number, append: boolean = false) => {
    try {
      setLoadingMore(true);
      const response = await fetch(
        `/api/search?latitude=${defaultCenter.lat}&longitude=${defaultCenter.lng}&distance=10&page=${page}&perPage=10`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      const data: ApiResponse = await response.json();
      
      if (append) {
        setLocations(prev => [...prev, ...data.locations]);
      } else {
        setLocations(data.locations);
      }
      
      // Check if we've received less than the requested number of items
      // or if we've reached the total number of items
      setHasMore(
        data.locations.length === 10 && 
        (data.page * data.perPage) < data.total
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingMore(false);
      if (!append) setLoading(false);
    }
  };

  // Handle horizontal scroll in LocationsBar
  const handleScroll = useCallback((
    scrollLeft: number, 
    scrollWidth: number, 
    clientWidth: number
  ) => {
    console.log("HANDLE SCROLL FUNCTION: ");
    console.log("scrollLeft: " + scrollLeft);
    console.log("scrollWidth: " + scrollWidth);
    console.log("clientWidth: " + clientWidth);
    // Check if we're near the end of the scroll and should load more
    const scrollThreshold = scrollWidth - (scrollLeft + clientWidth);
    const shouldLoadMore = scrollThreshold < 100; // Load more when within 100px of the end
    console.log("scrollThreshold: " + scrollThreshold);

    if (shouldLoadMore && !loadingMore && hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchLocations(currentPage + 1, true);
    }
  }, [loadingMore, hasMore, currentPage]);

  // Initial load
  useEffect(() => {
    fetchLocations(1);
  }, []);

  const handleMarkerClick = (place: Location) => {
    setSelectedPlace(place);
    // Center the map on the selected place
    setCenter({
      lat: place.latitude,
      lng: place.longitude
    });
    setZoom(14); // Zoom in slightly when a place is selected
  };
  
  const handleCardClose = () => {
    setSelectedPlace(null);
    setZoom(12); // Reset zoom when closing the card
  };

  if (loading) return <Loading />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="relative w-full h-screen">
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY!}>
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
      </LoadScript>

      <LocationsBar
        locations={locations}
        onScroll={handleScroll}
        loading={loadingMore}
      />

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