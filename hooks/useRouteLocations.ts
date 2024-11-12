import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export const useRouteLocations = () => {
  const [routeLocations, setRouteLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchRouteLocations = useCallback(async () => {
    try {
      const response = await fetch('/api/routes');
      if (!response.ok) throw new Error('Failed to fetch route locations');
      const data = await response.json();
      setRouteLocations(data.map((route: { locationId: string }) => route.locationId));
    } catch (error) {
      console.error('Error fetching route locations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleRouteLocation = async (locationId: string) => {
    setIsLoading(true);
    try {
      if (routeLocations.includes(locationId)) {
        // Remove from route
        const response = await fetch('/api/routes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId }),
        });

        if (!response.ok) throw new Error('Failed to remove from route');
      } else {
        // Add to route
        const response = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId }),
        });

        if (!response.ok) throw new Error('Failed to add to route');
      }

      // Update local state immediately
      setRouteLocations(prev => 
        prev.includes(locationId) 
          ? prev.filter(id => id !== locationId)
          : [...prev, locationId]
      );

      // Fetch updated route locations
      await fetchRouteLocations();
      router.refresh();
    } catch (error) {
      console.error('Error toggling route location:', error);
      // Revert local state on error
      await fetchRouteLocations();
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRouteLocations();
  }, [fetchRouteLocations]);

  return {
    routeLocations,
    toggleRouteLocation,
    isLoading,
    hasRoute: routeLocations.length >= 2,
    refreshRoute: fetchRouteLocations
  };
};