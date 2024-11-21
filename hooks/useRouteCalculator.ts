// hooks/useRouteCalculator.ts
import { useState, useCallback } from 'react';

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
  
interface RouteStop {
  location: Location;
  order: number;
}

export const useRouteCalculator = () => {
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = useCallback(async (
    locations: Location[],
    userLocation: google.maps.LatLng | null
  ) => {
    if (!locations.length) return;
    setIsCalculating(true);
    setError(null);

    try {
      const directionsService = new google.maps.DirectionsService();
      
      // Start from user location or first location
      const origin = userLocation || new google.maps.LatLng(
        locations[0].latitude,
        locations[0].longitude
      );

      // Create waypoints from locations
      const waypoints = locations.map(location => ({
        location: new google.maps.LatLng(location.latitude, location.longitude),
        stopover: true
      }));

      const result = await directionsService.route({
        origin,
        destination: origin, // Return to start point
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.WALKING,
      });

      // Create ordered stops based on optimized route
      const orderedStops = result.routes[0].waypoint_order.map((index, order) => ({
        location: locations[index],
        order: order + 1
      }));

      setRouteStops(orderedStops);
      setDirections(result);
    } catch (err) {
      setError('Failed to calculate route');
      console.error('Route calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return {
    routeStops,
    directions,
    isCalculating,
    error,
    calculateRoute
  };
};