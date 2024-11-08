import React from 'react';
import Image from 'next/image';
import { X, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFavorites } from '@/hooks/useFavorites';
import ReviewSection from './ReviewSection';
import { useSupabase } from '@/app/supabase-provider';

interface LocationData {
  id: string;
  name: string;
  image: string | null;
  summarizedReview: string | null;
  aspectRatings: { aspect: { name: string }; rating: number }[];
  siteReviews: { 
    id: string;
    rating: number; 
    body: string; 
    extractedDate: string;
    userId: string | null;
  }[];
}

interface LocationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
}

const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  isOpen,
  onClose,
  locationId,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [locationData, setLocationData] = React.useState<LocationData>();
  const [userReview, setUserReview] = React.useState<{
    id: string;
    rating: number;
    body: string;
  } | null>(null);
  
  const { favoriteLocations, toggleFavorite } = useFavorites();
  const [optimisticFavorites, setOptimisticFavorites] = React.useState<Set<string>>(new Set());
  const { supabase } = useSupabase();

  const fetchLocationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/location/${locationId}`);
      if (!response.ok) throw new Error('Failed to fetch location details');
      const data = await response.json();
      setLocationData(data);

      // Find user review
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userReview: { id: string; rating: number; body: string } | undefined = data.siteReviews.find((review: { userId: string | null }) => review.userId === user.id);
        if (userReview) {
          setUserReview({
            id: userReview.id,
            rating: userReview.rating,
            body: userReview.body
          });
        } else {
          setUserReview(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setOptimisticFavorites(new Set(favoriteLocations));
  }, [favoriteLocations]);

  React.useEffect(() => {
    if (isOpen && locationId) {
      fetchLocationDetails();
    }
  }, [isOpen, locationId]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setOptimisticFavorites(prev => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });

    await toggleFavorite(locationId);
  };

  const handleReviewSubmitted = () => {
    fetchLocationDetails();
  };

  const renderRatingStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header Controls - Always visible */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={handleFavoriteClick}
          className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          <Star 
            className={`w-5 h-5 ${
              optimisticFavorites.has(locationId)
                ? 'fill-yellow-400 stroke-yellow-400'
                : 'stroke-white'
            }`}
          />
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : error ? (
        <div className="flex-1 p-4 flex items-center justify-center text-red-500">
          {error}
        </div>
      ) : locationData ? (
        <div className="h-full flex flex-col">
          {/* Image Header - Fixed height */}
          <div className="relative h-64 w-full flex-shrink-0">
            {locationData.image ? (
              <Image
                src={locationData.image}
                alt={locationData.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 px-6">
            <div className="py-6 space-y-6">
              {/* Location name and summary */}
              <div>
                <h2 className="text-2xl font-bold mb-2">{locationData.name}</h2>
                <p className="text-gray-600">
                  {locationData.summarizedReview || 'No summary available'}
                </p>
              </div>

              {/* Review Section */}
              <ReviewSection 
                locationId={locationId}
                onReviewSubmitted={handleReviewSubmitted}
                userReview={userReview}
              />

              {/* Aspect ratings */}
              {locationData.aspectRatings?.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Ratings by Aspect</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {locationData.aspectRatings.map((aspect) => (
                      <div
                        key={aspect.aspect.name}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <span className="font-medium">{aspect.aspect.name}</span>
                        <div className="flex">{renderRatingStars(aspect.rating)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {locationData.siteReviews?.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Recent Reviews</h3>
                  <div className="space-y-4">
                    {locationData.siteReviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white border rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex">{renderRatingStars(review.rating)}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(review.extractedDate).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-gray-700">{review.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  );
};

export default LocationDetailModal;