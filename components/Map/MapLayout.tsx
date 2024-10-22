"use client"

import { FC, useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LocationDetailModal from './LocationDetailModal';
import Loading from '../utils/Loading';
import LocationsBar from './LocationsBar';
import SearchHeader from './SearchHeader';
import { PersonStanding } from 'lucide-react';

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
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
    libraries: ["places", "geometry"]
  });

  const [loading, setLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [selectedPlace, setSelectedPlace] = useState<Location | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(16);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previousZoom, setPreviousZoom] = useState<number>(12);
  const [previousCenter, setPreviousCenter] = useState<LatLng>(defaultCenter);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasMovedMap, setHasMovedMap] = useState(false);
  const [isLoadingNewArea, setIsLoadingNewArea] = useState(false);
  const [currentSearchArea, setCurrentSearchArea] = useState<{
    center: LatLng;
    distance: number;
  } | null>(null);
  const [activeFilters, setActiveFilters] = useState<{
    searchTerm: string;
    categoryIds: number[];
    aspectIds: number[];
    radius: number | null;
  } | null>(null);

  const handleReturnToMyLocation = useCallback(() => {
    if (!mapInstance || !userLocation) return;
    
    mapInstance.panTo(userLocation);
    mapInstance.setZoom(14); // or whatever your preferred default zoom is
  }, [mapInstance, userLocation]);  

  const handleFiltersChange = useCallback(async (filters: {
    searchTerm: string;
    categoryIds: number[];
    aspectIds: number[];
    radius: number | null;
  }) => {
    if (!mapInstance) return;
  
    setIsLoadingNewArea(true);
    const center = mapInstance.getCenter();
    if (!center) return;
  
    const searchParams = new URLSearchParams({
      latitude: center.lat().toString(),
      longitude: center.lng().toString(),
      page: '1',
      perPage: '60'
    });
  
    // Only add radius if it's provided (not null)
    if (filters.radius !== null) {
      searchParams.append('distance', filters.radius.toString());
    }
  
    // Only add non-empty parameters
    if (filters.searchTerm.trim()) {
      searchParams.append('name', filters.searchTerm.trim());
    }
  
    if (filters.categoryIds.length > 0) {
      searchParams.append('categoryIds', filters.categoryIds.join(','));
    }
  
    if (filters.aspectIds.length > 0) {
      searchParams.append('aspectIds', filters.aspectIds.join(','));
    }
  
    try {
      const response = await fetch(`/api/search?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch locations');
      
      const data: ApiResponse = await response.json();
      
      const locationIds = data.locations
        .filter(location => location.image)
        .map(location => location.id);
      
      let processedLocations = data.locations;
      
      if (locationIds.length > 0) {
        const imageResponse = await fetch('/api/locationImages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationIds }),
        });
  
        if (imageResponse.ok) {
          const images = await imageResponse.json();
          processedLocations = processedLocations.map(location => ({
            ...location,
            image: images[location.id] || null
          }));
        }
      }
  
      setLocations(processedLocations);
      setHasMore(data.page * data.perPage < data.total);
      setCurrentPage(1);
      
      // Only update search area if we're using radius-based search
      if (filters.radius !== null) {
        setCurrentSearchArea({ 
          center: { lat: center.lat(), lng: center.lng() }, 
          distance: filters.radius 
        });
      }
      
      setActiveFilters(filters);
      setHasMovedMap(false);
      
    } catch (error) {
      console.error('Error fetching filtered locations:', error);
      setError('Failed to load locations');
    } finally {
      setIsLoadingNewArea(false);
    }
  }, [mapInstance]);
  
  const getUserLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
  
      const userPos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      setUserLocation(userPos);
      setCenter(userPos);
      
      // Initial load of locations around user
      const initialDistance = 5; // 2km initial radius
      setCurrentSearchArea({ center: userPos, distance: initialDistance }); 
      await fetchLocationsInArea(userPos, initialDistance);
    } catch (error) {
      console.error('Error getting location:', error);
      // Fall back to default location and load data there
      const initialDistance = 5;
      setCurrentSearchArea({ center: defaultCenter, distance: initialDistance }); 
      await fetchLocationsInArea(defaultCenter, initialDistance);
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  const fetchLocationsInArea = async (center: LatLng, distance: number, page: number = 1) => {
    try {
      const isInitialLoad = page === 1;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const searchParams = new URLSearchParams({
        latitude: center.lat.toString(),
        longitude: center.lng.toString(),
        distance: distance.toString(),
        page: page.toString(),
        perPage: '60'
      });

      const response = await fetch(`/api/search?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch locations');
      
      const data = await response.json();
      
      // Process locations and fetch images
      const locationIds = data.locations
        .filter((location: Location) => location.image)
        .map((location: Location) => location.id);
      
      let processedLocations = data.locations;
      
      if (locationIds.length > 0) {
        const imageResponse = await fetch('/api/locationImages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationIds }),
        });

        if (imageResponse.ok) {
          const images = await imageResponse.json();
          processedLocations = processedLocations.map((location: Location) => ({
            ...location,
            image: images[location.id] || null
          }));
        }
      }

      if (isInitialLoad) {
        setLocations(processedLocations);
        setInitialDataLoaded(true); // Add this line
      } else {
        setLocations(prev => [...prev, ...processedLocations]);
      }
      
      setHasMore(page * data.perPage < data.total);
      setCurrentSearchArea({ center, distance });
      setCurrentPage(page);
      setHasMovedMap(false);
      
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsLoadingNewArea(false);
    }
  };

  const handleMapIdle = useCallback(() => {
    if (!mapInstance || !currentSearchArea) return;
    
    const center = mapInstance.getCenter();
    if (!center) return;
    
    // Don't show "search this area" if there's a text search active
    if (activeFilters?.searchTerm) {
      setHasMovedMap(false);
      return;
    }
    
    const currentCenter = {
      lat: center.lat(),
      lng: center.lng()
    };
  
    // Calculate distance from last search center
    const R = 6371; // Earth's radius in km
    const dLat = (currentCenter.lat - currentSearchArea.center.lat) * Math.PI / 180;
    const dLon = (currentCenter.lng - currentSearchArea.center.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(currentSearchArea.center.lat * Math.PI / 180) * 
      Math.cos(currentCenter.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const movedDistance = R * c;
  
    const bounds = mapInstance.getBounds();
    if (!bounds) return;
  
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const visibleRadius = google.maps.geometry.spherical.computeDistanceBetween(
      center,
      ne
    ) / 1000;
  
    // If moved more than 30% of the visible radius or 1km (whichever is smaller)
    const threshold = Math.min(visibleRadius * 0.3, 1);
    if (movedDistance > threshold) {
      setHasMovedMap(true);
    } else {
      setHasMovedMap(false);
    }
  }, [mapInstance, currentSearchArea, activeFilters?.searchTerm]);

  const handleScroll = useCallback((
    scrollLeft: number, 
    scrollWidth: number, 
    clientWidth: number
  ) => {
    const scrollThreshold = scrollWidth - (scrollLeft + clientWidth);
    if (scrollThreshold < 100 && !loadingMore && hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchLocationsInArea(currentSearchArea!.center, currentSearchArea!.distance, currentPage + 1);
    }
  }, [loadingMore, hasMore, currentSearchArea, currentPage]);

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
      mapInstance.setZoom(14);
      mapInstance.setCenter(userLocation ? new google.maps.LatLng(userLocation.lat, userLocation.lng) : defaultCenter);
      setSelectedPlace(null);
    }
  }, [pathname, searchParams, mapInstance]);

  useEffect(() => {
    if (locations.length > 0) {
      setHasMovedMap(false);
    }
  }, [locations]);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const handleMarkerClick = (place: Location) => {
    // Store current map state before changing it
    if (mapInstance) {
      setPreviousZoom(mapInstance.getZoom() || 12);
      setPreviousCenter({
        lat: mapInstance.getCenter()?.lat() || defaultCenter.lat,
        lng: mapInstance.getCenter()?.lng() || defaultCenter.lng
      });
    }
    
    setSelectedPlace(place);
    setIsModalOpen(true);
    setCenter({
      lat: place.latitude,
      lng: place.longitude,
    });
    setZoom(16); // Zoom in closer to the selected location
  };

  const handleLoadCurrentArea = useCallback(async () => {
  if (!mapInstance) return;
  
  setIsLoadingNewArea(true);
  const center = mapInstance.getCenter();
  if (!center) return;

  const bounds = mapInstance.getBounds();
  if (!bounds) return;

  // Calculate radius based on visible map area
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const radius = Math.min(
    Math.abs(ne.lat() - sw.lat()) * 111.32 / 2,
    Math.abs(ne.lng() - sw.lng()) * 111.32 * 
      Math.cos(center.lat() * Math.PI / 180) / 2
  );

  // Preserve category and aspect filters, but clear search term
  if (activeFilters) {
    setActiveFilters({
      ...activeFilters,
      searchTerm: '',
      radius: Math.ceil(radius)
    });
  }

  await fetchLocationsInArea(
    { lat: center.lat(), lng: center.lng() },
    Math.ceil(radius)
  );
}, [mapInstance, activeFilters]);

  const handleLocationSelect = (location: Location) => {
    // Store current map state before changing it
    if (mapInstance) {
      setPreviousZoom(mapInstance.getZoom() || 12);
      setPreviousCenter({
        lat: mapInstance.getCenter()?.lat() || defaultCenter.lat,
        lng: mapInstance.getCenter()?.lng() || defaultCenter.lng
      });
    }
  
    setSelectedPlace(location);
    setIsModalOpen(true);
    setCenter({
      lat: location.latitude,
      lng: location.longitude,
    });
    setZoom(16); // Zoom in closer to the selected location
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPlace(null);
    
    // Restore previous map state
    setZoom(previousZoom);
    setCenter(previousCenter);
    
    if (mapInstance) {
      const mapDiv = mapInstance.getDiv();
      mapDiv.style.width = '100%';
      mapDiv.style.position = 'relative';
      google.maps.event.trigger(mapInstance, 'resize');
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <Loading />;
  if (loading && !initialDataLoaded) return <Loading />;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {
        !isModalOpen &&
          <SearchHeader 
            onFiltersChange={handleFiltersChange}
            initialRadius={currentSearchArea?.distance ?? 5}
          />
      }
      
      {/* Map Container - Adjust top padding to account for SearchHeader */}
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
          onIdle={handleMapIdle}
        >
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#2563eb',
              }}
            />
          )}

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
  
      {/* Map Controls Overlay */}
      <div className="absolute top-20 left-4 flex flex-col gap-2 z-[60]"> 
      {hasMovedMap && (
            <Button
              className="bg-white text-black hover:text-black shadow-lg hover:shadow-xl border"
              onClick={handleLoadCurrentArea}
              disabled={isLoadingNewArea}
            >
              {isLoadingNewArea ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Load places in this area
            </Button>
          )}

          {isLoadingLocation && (
            <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting your location...
            </div>
          )}
        </div>
      </div>

      {!isModalOpen && (
        <div className="fixed top-4 right-3 z-[60]">
          <Button
            className="bg-white hover:bg-gray-100 text-black border shadow-lg rounded-full w-12 h-12 p-0 flex items-center justify-center"
            onClick={handleReturnToMyLocation}
            disabled={!userLocation}
            title="Return to my location"
          >
            <PersonStanding 
              className={`w-6 h-6 ${userLocation ? 'text-green-600' : 'text-gray-400'}`}
            />
          </Button>
        </div>
      )}
  
      {/* Bottom Locations Bar - Adjusts width based on modal state and screen size */}
      {initialDataLoaded && locations.length > 0 && !isModalOpen && (
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
            onLocationSelect={handleLocationSelect}
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
  
      {/* Loading States */}
      {(loading || isLoadingNewArea) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-30">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
            <p className="text-green-600 font-medium">
              {loading ? 'Loading locations...' : 'Updating area...'}
            </p>
          </div>
        </div>
      )}
  
      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-30">
          <div className="bg-red-50 text-red-600 px-6 py-4 rounded-lg shadow-lg max-w-md">
            <p className="font-medium mb-2">Error</p>
            <p>{error}</p>
            <Button
              className="mt-4 bg-red-600 hover:bg-red-700 text-white w-full"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLayout;