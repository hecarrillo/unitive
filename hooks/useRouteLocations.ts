import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface RouteLocation {
  locationId: string;
}

export const useRoutes = () => {
  const queryClient = useQueryClient();

  // Query for fetching favorites
  const { data: routeLocations = new Set(), isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await fetch('/api/routes');
      const data: RouteLocation[] = await response.json();
      return new Set(data.map(fav => fav.locationId));
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Mutation for toggling favorites
  const { mutate: toggleRoutes } = useMutation({
    mutationFn: async (locationId: string) => {
      const isRoute = routeLocations.has(locationId);
      const response = await fetch('/api/routes', {
        method: isRoute ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle route');
      }

      return { locationId, isRoute };
    },
    // Optimistic update
    onMutate: async (locationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['routes'] });

      // Snapshot the previous value
      const previousRoutes = queryClient.getQueryData(['routes']);

      // Optimistically update to the new value
      queryClient.setQueryData(['routes'], (old: Set<string>) => {
        const updated = new Set(old);
        if (updated.has(locationId)) {
          updated.delete(locationId);
        } else {
          updated.add(locationId);
        }
        return updated;
      });

      // Return a context object with the snapshotted value
      return { previousRoutes };
    },
    // If mutation fails, use the context returned from onMutate to roll back
    onError: (err, locationId, context) => {
      queryClient.setQueryData(['routes'], context?.previousRoutes);
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });

  const { mutate: clearRoutes } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/routes/clear', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear routes');
      }
    },
    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['routes'] });
      const previousRoutes = queryClient.getQueryData(['routes']);
      
      // Clear all routes
      queryClient.setQueryData(['routes'], new Set());
      
      return { previousRoutes };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['routes'], context?.previousRoutes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });

  return {
    routeLocations,
    toggleRoutes,
    clearRoutes,
    isLoading,
  };
};