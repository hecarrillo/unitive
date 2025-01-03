"use client"

import { FC, useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, useLoadScript, DirectionsRenderer } from '@react-google-maps/api';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useRoutes } from '@/hooks/useRouteLocations';
import LocationDetailModal from './LocationDetailModal';
import Loading from '../utils/Loading';
import LocationsBar from './LocationsBar';
import SearchHeader from './SearchHeader';
import { PersonStanding } from 'lucide-react';
import { fitMapToMexicoCity, shouldZoomToCity } from '@/lib/map-utils';
import { NoResultsToast } from './NoResultsToast';
import { useToast } from '@/components/ui/toast';

interface LatLng {
  lat: number;
  lng: number;
} 

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
  openingHours: string[] | "N/A";
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

const getMarkerIcon = (
  isHovered: boolean, 
  isSelected: boolean, 
  order?: string, 
  rating?: number | null  // Explicitly allow null
) => {
  let baseColor = '#00a600'; // default green
  if (rating !== null && rating !== undefined) {
    if (rating < 2.5) {
      baseColor = '#ef4444'; // red for low ratings
    } else if (rating >= 2.5 && rating <= 4) {
      baseColor = '#eab308'; // yellow for medium ratings
    } else {
      baseColor = '#22c55e'; // green for high ratings
    }
  }

  if (order !== undefined) {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: isHovered || order === 'D' ? '#ef4444' : '#22c55e',
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#ffffff',
      scale: 15,
      labelOrigin: new google.maps.Point(0, 0)
    };
  }
  
  return {
    path: "M 12,2 C 8.1340068,2 5,5.1340068 5,9 c 0,5.25 7,13 7,13 0,0 7,-7.75 7,-13 0,-3.8659932 -3.134007,-7 -7,-7 z",
    fillColor: isHovered ? '#ef4444' : baseColor,
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: isHovered ? '#dc2626' : '#274E13',
    scale: isHovered ? 2 : (isSelected ? 1.8 : 1.5),
    anchor: new google.maps.Point(12, 23)
  };
};
  
const LOAD_FAVORITES_EVENT = 'LOAD_FAVORITES_MAP';
const LOAD_ROUTES_EVENT = 'LOAD_ROUTES_EVENT';

const MapLayout: FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
    libraries: ["places", "geometry"]
  });

  const [currentMode, setCurrentMode] = useState<'normal' | 'route' | 'favorites'>('normal');
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);  const [loading, setLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [selectedPlace, setSelectedPlace] = useState<Location | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(14);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previousZoom, setPreviousZoom] = useState<number>(12);
  const { favoriteLocations, toggleFavorite, isLoading: favoritesLoading } = useFavorites();
  const { routeLocations, toggleRoutes, isLoading: routesLoading, clearRoutes } = useRoutes();
  const [previousCenter, setPreviousCenter] = useState<LatLng>(defaultCenter);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasMovedMap, setHasMovedMap] = useState(false);
  const [isLoadingNewArea, setIsLoadingNewArea] = useState(false);
  const { toast } = useToast();
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
  const [noResultsFound, setNoResultsFound] = useState<{
    show: boolean;
    searchTerm?: string;
    filters?: {
      categories?: number[];
      aspects?: number[];
      radius?: number;
      isOpenNow?: boolean;
    };
  }>({
    show: false
  });

  const loadFavoriteLocations = useCallback(async () => {
    try {
      setCurrentMode('favorites');
      setIsLoadingNewArea(true);
      setLoading(true);
  
      const favoriteIds = Array.from(favoriteLocations);
  
      if (favoriteIds.length === 0) {
        console.log('No favorite locations found');
        setLocations([]);
        setHasMore(false);
        return;
      }
  
      const locResponse = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationIds: favoriteIds })
      });
      
      if (!locResponse.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      const locationData = await locResponse.json();
  
      const processedLocations: Location [] = locationData;
  
      setLocations(processedLocations);
      setHasMore(false);
  
      // Map fitting functions
      const fitMapToLocations = (locations: Location[]) => {
        if (!mapInstance || locations.length === 0) return;
  
        const bounds = new google.maps.LatLngBounds();
        locations.forEach((location) => {
          if (location.latitude && location.longitude) {
            bounds.extend({ 
              lat: location.latitude, 
              lng: location.longitude 
            });
          }
        });
        
        mapInstance.fitBounds(bounds);
        
        // Adjust zoom for single location
        if (locations.length === 1) {
          mapInstance.setZoom(14);
        }
      };
  
      if (mapInstance) {
        // First fit to Mexico City
        fitMapToMexicoCity(mapInstance);
        
        // Then fit to locations after delay
        if (processedLocations.length > 0) {
          setTimeout(() => {
            fitMapToLocations(processedLocations);
          }, 1000);
        }
      }
  
      // Reset other states
      setActiveFilters(null);
      setCurrentSearchArea(null);
      setHasMovedMap(false);
  
    } catch (error) {
      console.error('Error in loadFavoriteLocations:', error);
      setError('Failed to load favorite locations');
    } finally {
      setLoading(false);
      setIsLoadingNewArea(false);
    }
  }, [
    favoriteLocations, 
    mapInstance, 
    setLocations, 
    setHasMore, 
    setLoading, 
    setActiveFilters, 
    setCurrentSearchArea, 
    setHasMovedMap, 
    setError
  ]);

  const loadRouteLocations = useCallback(async () => {
    try {
      setCurrentMode('route');
      setIsLoadingNewArea(true);
      setLoading(true);
      setIsCalculatingRoute(true);
      setDirectionsResult(null);
  
      const routeIds = Array.from(routeLocations);
  
      if (routeIds.length === 0) {
        setLocations([]);
        setHasMore(false);
        toast({
          title: "No locations in the route",
          description: "Please add any location to your touristic route to start creating one.",
          variant: "destructive"
        });
        return;
      }
  
      const locResponse = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationIds: routeIds })
      });
      
      if (!locResponse.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      const locationData: Location[] = await locResponse.json();
  
      const processedLocations: Location[] = locationData;
  
      setLocations(processedLocations);
  
      // Calculate route
      if (processedLocations.length > 1) {
        const directionsService = new google.maps.DirectionsService();
        
        try {
          // If only one location, no need for route calculation
          if (processedLocations.length === 1 && !userLocation) {
            setDirectionsResult(null);
          } else {
            // Determine the start point - use user location if available
            const startPoint = userLocation 
              ? new google.maps.LatLng(userLocation.lat, userLocation.lng)
              : new google.maps.LatLng(
                  processedLocations[0].latitude,
                  processedLocations[0].longitude
                );
            
            // Adjust waypoints and destination based on start point
            const waypoints = userLocation 
              ? processedLocations.map(location => ({
                  location: new google.maps.LatLng(location.latitude, location.longitude),
                  stopover: true
                }))
              : processedLocations.slice(1, -1).map(location => ({
                  location: new google.maps.LatLng(location.latitude, location.longitude),
                  stopover: true
                }));
  
            // Last location is the destination
            const lastLocation = processedLocations[processedLocations.length - 1];
            const destination = new google.maps.LatLng(
              lastLocation.latitude,
              lastLocation.longitude
            );
            console.log(startPoint);
            console.log(userLocation);
            
            const routeOptions = {
              origin: startPoint,
              destination: destination,
              waypoints: waypoints,
              optimizeWaypoints: true,
              travelMode: google.maps.TravelMode.WALKING,
            };
  
            const result = await directionsService.route(routeOptions);
            setDirectionsResult(result);
          }
          
          // Fit bounds to show all locations
          if (mapInstance) {
            const bounds = new google.maps.LatLngBounds();
            
            // Add user location to bounds if available
            if (userLocation) {
              bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng));
            }
            
            processedLocations.forEach((location) => {
              bounds.extend({ 
                lat: location.latitude, 
                lng: location.longitude 
              });
            });
            
            mapInstance.fitBounds(bounds);
            if (processedLocations.length === 1 && !userLocation) {
              mapInstance.setZoom(14);
            }
          }
        } catch (routeError) {
          console.error('Error calculating route:', routeError);
          setError('Failed to calculate route. The locations might be too far apart for walking.');
        }
      }
  
      setHasMore(false);
      setActiveFilters(null);
      setCurrentSearchArea(null);
      setHasMovedMap(false);
  
    } catch (error) {
      console.error('Error loading route locations:', error);
      setError('Failed to load route locations');
      setDirectionsResult(null);
    } finally {
      setLoading(false);
      setIsLoadingNewArea(false);
      setIsCalculatingRoute(false);
    }
  }, [
    routeLocations, 
    mapInstance, 
    userLocation,
    setLocations, 
    setHasMore, 
    setLoading, 
    setActiveFilters, 
    setCurrentSearchArea, 
    setHasMovedMap, 
    setError
  ]);
  
  const handleReturnToMyLocation = useCallback(() => {
    if (!mapInstance || !userLocation) return;
    
    mapInstance.panTo(userLocation);
    mapInstance.setZoom(15); // or whatever your preferred default zoom is
  }, [mapInstance, userLocation]);  

  const handleFiltersChange = useCallback(async (filters: {
    searchTerm: string;
    categoryIds: number[];
    aspectIds: number[];
    radius: number | null;
    isOpenNow: boolean;
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
  
    if (filters.radius !== null) {
      searchParams.append('distance', filters.radius.toString());
    }
  
    // Add isOpenNow parameter
    if (filters.isOpenNow) {
      searchParams.append('isOpenNow', 'true');
    }
  
    try {
      const response = await fetch(`/api/search?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch locations');
      
      const data: ApiResponse = await response.json();
      const processedLocations = data.locations;
  
      // Reset no results state before checking
      setNoResultsFound({ show: false });
  
      // If no locations found, set no results state
      if (processedLocations.length === 0) {
        setNoResultsFound({
          show: true,
          searchTerm: filters.searchTerm,
          filters: {
            categories: filters.categoryIds,
            aspects: filters.aspectIds,
            radius: filters.radius || undefined,
            isOpenNow: filters.isOpenNow
          }
        });
      }
  
      setLocations(processedLocations);
      setHasMore(data.page * data.perPage < data.total);
      setCurrentPage(1);
      
      // After locations are loaded, fit bounds to show all locations
      if (processedLocations.length > 0) {
        setTimeout(() => {
          const bounds = new google.maps.LatLngBounds();
          processedLocations.forEach((location) => {
            bounds.extend({ 
              lat: location.latitude, 
              lng: location.longitude 
            });
          });
          mapInstance.fitBounds(bounds);
          
          // Ensure we don't zoom in too much for single locations
          if (processedLocations.length === 1) {
            mapInstance.setZoom(14);
          }
        }, 1000); // 1 second delay for smooth transition
      }
      
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
  
  const fetchLocationsInArea: (center: LatLng, distance: number, page?: number) => Promise<void> = useCallback(async (center: LatLng, distance: number, page: number = 1) => {
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

      if (isInitialLoad) {
        setLocations(data.locations);
        setInitialDataLoaded(true); // Add this line
      } else {
        setLocations(prev => [...prev, ...data.locations]);
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
  } , []);

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
  }, [fetchLocationsInArea]);


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
  }, [loadingMore, hasMore, currentSearchArea, currentPage, fetchLocationsInArea]);

  // Handle map instance
  const onLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMapInstance(null);
  }, []);

  useEffect(() => {
      const handleLoadFavorites = () => {
          loadFavoriteLocations();
      };

      window.addEventListener(LOAD_FAVORITES_EVENT, handleLoadFavorites);

      return () => {
          window.removeEventListener(LOAD_FAVORITES_EVENT, handleLoadFavorites);
      };
  }, [loadFavoriteLocations]);

  useEffect(() => {
    const handleLoadRoute = () => {
        loadRouteLocations();
    };

    window.addEventListener(LOAD_ROUTES_EVENT, handleLoadRoute);

    return () => {
        window.removeEventListener(LOAD_ROUTES_EVENT, handleLoadRoute);
    };
  }, [loadRouteLocations]);

  const returnToNormalMode = useCallback(async () => {
    setCurrentMode('normal');
    setDirectionsResult(null); // Clear any existing route
    setLocations([]); // Clear locations
    setHasMore(true);
    
    // Return to user's location or default location and load nearby places
    if (userLocation) {
      await fetchLocationsInArea(userLocation, 5);
    } else {
      await fetchLocationsInArea(defaultCenter, 5);
    }
  }, [userLocation, fetchLocationsInArea]);

  // Reset map when pathname or search params change
  useEffect(() => {
    if (mapInstance) {
      mapInstance.setZoom(14);
      mapInstance.setCenter(userLocation ? new google.maps.LatLng(userLocation.lat, userLocation.lng) : defaultCenter);
      setSelectedPlace(null);
    }
  }, [pathname, searchParams, mapInstance, userLocation]);

  useEffect(() => {
    if (locations.length > 0) {
      setHasMovedMap(false);
    }
  }, [locations]);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Add this effect to handle initial map bounds
  useEffect(() => {
    if (mapInstance && shouldZoomToCity(currentMode, Boolean(activeFilters?.searchTerm))) {
      fitMapToMexicoCity(mapInstance);
    }
  }, [mapInstance, currentMode, activeFilters?.searchTerm]);

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
    setZoom(16);
    
    // Push a new history entry when opening the modal
    window.history.pushState({ modal: true }, '');
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
}, [mapInstance, activeFilters, fetchLocationsInArea]);

  // Also update the handleLocationSelect function since it also opens the modal:
  const handleLocationSelect = (location: Location) => {
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
    setZoom(16);
    
    // Push a new history entry when opening the modal
    window.history.pushState({ modal: true }, '');
  };

  // Update the handleModalClose function:
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

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isModalOpen) {
        handleModalClose();
      }
    };
  
    window.addEventListener('popstate', handlePopState);
  
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isModalOpen]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <Loading />;
  if (loading && !initialDataLoaded) return <Loading />;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {
        !isModalOpen && currentMode === 'normal' &&
          <SearchHeader 
            onFiltersChange={handleFiltersChange}
            initialRadius={currentSearchArea?.distance ?? 5}
          />
      }
      <NoResultsToast
          show={noResultsFound.show}
          searchTerm={noResultsFound.searchTerm}
          filters={{
            categories: noResultsFound.filters?.categories,
            aspects: noResultsFound.filters?.aspects,
            radius: noResultsFound.filters?.radius,
            isOpenNow: noResultsFound.filters?.isOpenNow
          }}
        />
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
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy', 
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
          {directionsResult && (
            <DirectionsRenderer
              directions={directionsResult}
              options={{
                suppressMarkers: true, // We'll handle markers ourselves
                polylineOptions: {
                  strokeColor: '#22c55e',
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                }
              }}
            />
          )}

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
              label={currentMode === 'route' ? {
                text: 'S',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              } : undefined}
            />
          )}

          {/* Location Markers */}
          {locations.map((place, index) => {
            const isHovered = hoveredPlace === place.id;
            const isSelected = selectedPlace?.id === place.id;
            let markerOrder: string | undefined;
            
            if (currentMode === 'route' && (locations.length > 1 || userLocation)) {
              if (index === 0 && !userLocation) {
                markerOrder = 'S';
              } else if (index === locations.length - 1) {
                markerOrder = 'D';
              }
            }

            return (
              <Marker
                key={place.id}
                position={{lat: place.latitude, lng: place.longitude}}
                onClick={() => handleMarkerClick(place)}
                animation={isSelected ? google.maps.Animation.BOUNCE : undefined}
                icon={getMarkerIcon(isHovered, isSelected, markerOrder, place.rating)}
                label={markerOrder !== undefined ? {
                  text: markerOrder.toString(),
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px'
                } : undefined}
              />
            );
          })}
        </GoogleMap>

        {/* Map Controls Overlay */}
        <div className="absolute top-32 left-4 flex flex-col gap-8 z-[60]"> 
          {/* Show 'Return to Normal Mode' when in route or favorites mode */}
          {(currentMode === 'route' || currentMode === 'favorites') && (
            <Button
              className="bg-white text-black hover:text-black shadow-lg hover:shadow-xl border flex items-center gap-2"
              onClick={returnToNormalMode}
            >
              <RefreshCw className="w-4 h-4" />
              Return to Normal Mode
            </Button>
          )}
          {/* Button to clear all route locations */}
          {currentMode === 'route' && (
            <Button
              className="bg-white text-black hover:text-black shadow-lg hover:shadow-xl border flex items-center gap-2"
              onClick={async () => {
                await clearRoutes();
                returnToNormalMode();
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Clear Route
            </Button>
          )}

          {/* Show 'Load places in this area' only in normal mode */}
          {currentMode === 'normal' && hasMovedMap && (
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
        <div className="absolute top-20 right-4 z-[60]">
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