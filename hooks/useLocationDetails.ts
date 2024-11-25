// hooks/useLocationDetails.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/app/supabase-provider';

export interface LocationData {
  id: string;
  name: string;
  image: string | null;
  thumbnailImage: string | null;
  summarizedReview: string | null;
  aspectRatings: { aspect: { name: string }; rating: number }[];
  siteReviews: { 
    id: string;
    rating: number; 
    body: string; 
    extractedDate: string;
    userId: string | null;
  }[];
  openingHours: string[] | "N/A";
}

export function useLocationDetails(locationId: string) {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['location', locationId],
    queryFn: async () => {
      const response = await fetch(`/api/location/${locationId}`);
      if (!response.ok) throw new Error('Failed to fetch location details');
      const data: LocationData = await response.json();

      // Get user review if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userReview = data.siteReviews.find(review => review.userId === user.id);
        return {
          ...data,
          userReview: userReview ? {
            id: userReview.id,
            rating: userReview.rating,
            body: userReview.body
          } : null
        };
      }

      return { ...data, userReview: null };
    },
    enabled: !!locationId,
  });

  const invalidateLocationData = () => {
    queryClient.invalidateQueries({ queryKey: ['location', locationId] });
  };

  return {
    locationData: data,
    isLoading,
    error,
    invalidateLocationData
  };
}