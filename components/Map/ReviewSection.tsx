import React, { useState, useEffect } from 'react';
import { Star, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useSupabase } from '@/app/supabase-provider';

interface ReviewSectionProps {
    locationId: string;
    onReviewSubmitted: () => void;
    userReview?: {
      id: string;
      rating: number;
      body: string;
    } | null;
  }

const ReviewSection: React.FC<ReviewSectionProps> = ({ 
  locationId, 
  onReviewSubmitted,
  userReview: initialUserReview 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hasVisited, setHasVisited] = useState<boolean | null>(initialUserReview ? true : null);
  const [rating, setRating] = useState<number>(initialUserReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState(initialUserReview?.body || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReview, setUserReview] = useState(initialUserReview);
  
  const { supabase } = useSupabase();
  const { toast } = useToast();

  const handleSubmitReview = async () => {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast({
        title: "Error",
        description: "You must be logged in to leave a review",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    if (review.length < 10) {
      toast({
        title: "Error",
        description: "Review must be at least 10 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          rating,
          body: review,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const newReview = await response.json();
      setUserReview(newReview);
      setIsEditing(false);

      toast({
        title: "Success",
        description: "Your review has been submitted",
      });
      onReviewSubmitted();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete a review",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${userReview.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete review');
      }

      setUserReview(null);
      setHasVisited(null);
      setRating(0);
      setReview('');
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Your review has been deleted",
      });
      onReviewSubmitted();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkAuth = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast({
        title: "Login Required",
        description: "Please login to leave a review",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleVisitedClick = async (visited: boolean) => {
    if (!visited || await checkAuth()) {
      setHasVisited(visited);
      if (visited) {
        setIsEditing(true);
      }
    }
  };

  const renderRatingStars = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((index) => (
          <Star
            key={index}
            className={`w-6 h-6 ${interactive ? 'cursor-pointer' : ''} transition-colors ${
              index <= (interactive ? (hoverRating || rating) : rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
            {...(interactive ? {
              onMouseEnter: () => setHoverRating(index),
              onMouseLeave: () => setHoverRating(0),
              onClick: () => setRating(index)
            } : {})}
          />
        ))}
      </div>
    );
  };

  if (!hasVisited && hasVisited !== null) {
    return null;
  }

  return (
    <div className="border-t border-b py-4">
      {hasVisited === null ? (
        <div className="text-center">
          <p className="mb-4 text-gray-700">Have you visited this place?</p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handleVisitedClick(true)}
              variant="default"
            >
              Yes, I have!
            </Button>
            <Button
              onClick={() => handleVisitedClick(false)}
              variant="outline"
            >
              Not yet
            </Button>
          </div>
        </div>
      ) : userReview && !isEditing ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Review</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleDeleteReview}
                variant="destructive"
                size="sm"
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
          
          {/* Display Rating */}
          {renderRatingStars(userReview.rating)}

          {/* Display Review */}
          <p className="text-gray-700 mt-2">{userReview.body}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {userReview ? 'Edit Your Review' : 'Leave a Review'}
          </h3>
          
          {/* Rating Stars */}
          {renderRatingStars(rating, true)}

          {/* Review Text */}
          <Textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience (minimum 10 characters)..."
            className="w-full min-h-[100px] resize-y"
          />

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-2">
            {isEditing && (
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setRating(userReview?.rating || 0);
                  setReview(userReview?.body || '');
                }}
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmitting || rating === 0 || review.length < 10}
            >
              {isSubmitting ? 'Submitting...' : (userReview ? 'Update Review' : 'Submit Review')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;