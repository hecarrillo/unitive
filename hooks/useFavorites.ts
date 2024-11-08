// hooks/useFavorites.ts
import { useState, useEffect } from 'react';

export const useFavorites = () => {
  const [favoriteLocations, setFavoriteLocations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      const data = await response.json();
      setFavoriteLocations(new Set(data.map((fav: { locationId: string }) => fav.locationId)));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (locationId: string) => {
    const isFavorite = favoriteLocations.has(locationId);
    
    try {
      const response = await fetch('/api/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationId }),
      });

      if (response.ok) {
        setFavoriteLocations(prev => {
          const next = new Set(prev);
          if (isFavorite) {
            next.delete(locationId);
          } else {
            next.add(locationId);
          }
          return next;
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return {
    favoriteLocations,
    toggleFavorite,
    isLoading,
  };
};