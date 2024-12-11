import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Star, Route, Flag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFavorites } from '@/hooks/useFavorites';
import { useRoutes } from '@/hooks/useRouteLocations';
import ReviewSection from './ReviewSection';
import ReportSection from './ReportSection';
import { useLocationDetails } from '@/hooks/useLocationDetails';
import { OpeningHours } from '../ui/opening-hours';
import { AIBadge } from '@/components/ui/ai-badge';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useToast } from '@/components/ui/toast';
import { useSupabase } from '@/app/supabase-provider';

interface LocationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
}

const isImageSrcValid = (src: string) => {
  const urlPattern = new RegExp(
    "^(https?:\\/\\/)?" +
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" +
    "((\\d{1,3}\\.){3}\\d{1,3}))" +
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
    "(\\?[;&a-z\\d%_.~+=-]*)?" +
    "(\\#[-a-z\\d_]*)?$", "i"
  );
  return !!urlPattern.test(src);
};

const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  isOpen,
  onClose,
  locationId,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es'>('en');
  const [isReporting, setIsReporting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const { locationData, isLoading, error, invalidateLocationData } = useLocationDetails(locationId);
  const { favoriteLocations, toggleFavorite } = useFavorites();
  const { routeLocations, toggleRoutes } = useRoutes();
  const { toast } = useToast();
  const { supabase } = useSupabase();

  const [userReport, setUserReport] = useState<{id: string, body: string} | null>(null);
  
  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReporting(true);
  };

  const handleReportClose = () => {
    setIsReporting(false);
  };

  const handleReportSubmitted = () => {
    invalidateLocationData();
    setIsReporting(false);
  };

  // Fetch existing report when modal opens
  useEffect(() => {
    const fetchUserReport = async () => {
      if (!isOpen) return;

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;

        const response = await fetch(`/api/reports?userId=${user.id}`);
        const reports = await response.json();
        
        // Assuming the first report is the user's report
        if (reports.length > 0) {
          setUserReport({
            id: reports[0].id,
            body: reports[0].body
          });
          setHasReported(true)
        }
      } catch (error) {
        console.error('Error fetching user report:', error);
      }
    };

    fetchUserReport();
  }, [isOpen, locationId]);

  const getSummary = () => {
    if (!locationData) {
      return 'No summary available';
    }
    
    if (selectedLanguage === 'es') {
      return locationData.summarizedReviewEs || 'No hay resumen disponible';
    }
    
    return locationData.summarizedReview || 'No summary available';
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const isFavorite = favoriteLocations.has(locationId);
    await toggleFavorite(locationId);
    
    // Show toast notification
    toast({
      title: isFavorite ? "Removed from Favorites" : "Added to Favorites",
      description: `${locationData?.name || 'Location'} ${isFavorite ? 'has been removed from' : 'is now in'} your favorites.`,
      variant: isFavorite ? "destructive" : "default"
    });
  };

  const handleRouteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const isInRoute = routeLocations.has(locationId);
    await toggleRoutes(locationId);
    
    // Show toast notification
    toast({
      title: isInRoute ? "Removed from Route" : "Added to Route",
      description: `${locationData?.name || 'Location'} ${isInRoute ? 'has been removed from' : 'is now in'} your touristic route.`,
      variant: isInRoute ? "destructive" : "default"
    });
  };

  const handleReviewSubmitted = () => {
    invalidateLocationData();
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
              favoriteLocations.has(locationId)
                ? 'fill-yellow-400 stroke-yellow-400'
                : 'stroke-white'
            }`}
          />
        </button>
        <button
          onClick={handleRouteClick}
          className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          <Route 
            className={`w-5 h-5 ${
              routeLocations.has(locationId)
                ? 'fill-white-400 stroke-blue-400'
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

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : error ? (
        <div className="flex-1 p-4 flex items-center justify-center text-red-500">
          {error.message}
        </div>
      ) : locationData ? (
        <div className="h-full flex flex-col">
          {/* Image Header - Fixed height */}
          <div className="relative h-64 w-full flex-shrink-0">
            {locationData.image && isImageSrcValid(locationData.image) ? (
              <Image
                src={locationData.image}
                alt={locationData.name}
                fill
                className="object-cover"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQsJCgkLDY2NDAwNjZBPUA9QTY2QUFCNkY3REVHSUtJS0E3Oz5PRkdLS0v/2wBDAR"
                placeholder="blur"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse" />
            )}
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 px-6">
            <div className="py-6 space-y-6">
              {/* Location name and summary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold">{locationData.name}</h2>
                  <button 
                    onClick={handleReportClick}
                    disabled={hasReported}
                    className={`
                      p-1 rounded-full 
                      ${hasReported 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-red-500 hover:bg-red-50 hover:text-red-600'}
                    `}
                    title={hasReported ? 'Already reported' : 'Report location'}
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                </div>
              </div>
                {/* Add ReportSection */}
                {isReporting && (
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={handleReportClose}
                  >
                    <div 
                      className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ReportSection 
                        locationId={locationId}
                        onReportSubmitted={handleReportSubmitted}
                        onClose={handleReportClose}
                      />
                    </div>
                  </div>
                )}
                <div className="relative p-4 mb-2">
                  {/* Rainbow gradient border */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-500 via-yellow-500 to-cyan-500 p-[1px]">
                    <div className="h-full w-full bg-white rounded-lg" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2">
                      <LanguageSelector
                        currentLanguage={selectedLanguage}
                        onLanguageChange={setSelectedLanguage}
                      />
                      <AIBadge />
                    </div>
                    <p className="text-gray-600">
                      {getSummary()}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 italic">
                      {selectedLanguage === 'es' 
                        ? 'Este resumen fue generado por IA basado en las reseñas de Google Maps y TripAdvisor'
                        : 'This summary was generated by AI based on reviews from Google Maps and TripAdvisor'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              <OpeningHours 
                hours={locationData.openingHours}
              />

              {/* Review Section */}
              <ReviewSection 
                locationId={locationId}
                onReviewSubmitted={handleReviewSubmitted}
                userReview={locationData?.userReview}
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