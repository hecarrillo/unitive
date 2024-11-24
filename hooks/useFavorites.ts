// hooks/useFavorites.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface FavoriteLocation {
  locationId: string;
}

export const useFavorites = () => {
  const queryClient = useQueryClient();

  // Query for fetching favorites
  const { data: favoriteLocations = new Set(), isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await fetch('/api/favorites');
      const data: FavoriteLocation[] = await response.json();
      return new Set(data.map(fav => fav.locationId));
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Mutation for toggling favorites
  const { mutate: toggleFavorite } = useMutation({
    mutationFn: async (locationId: string) => {
      const isFavorite = favoriteLocations.has(locationId);
      const response = await fetch('/api/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      return { locationId, isFavorite };
    },
    // Optimistic update
    onMutate: async (locationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      // Snapshot the previous value
      const previousFavorites = queryClient.getQueryData(['favorites']);

      // Optimistically update to the new value
      queryClient.setQueryData(['favorites'], (old: Set<string>) => {
        const updated = new Set(old);
        if (updated.has(locationId)) {
          updated.delete(locationId);
        } else {
          updated.add(locationId);
        }
        return updated;
      });

      // Return a context object with the snapshotted value
      return { previousFavorites };
    },
    // If mutation fails, use the context returned from onMutate to roll back
    onError: (err, locationId, context) => {
      queryClient.setQueryData(['favorites'], context?.previousFavorites);
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return {
    favoriteLocations,
    toggleFavorite,
    isLoading,
  };
};