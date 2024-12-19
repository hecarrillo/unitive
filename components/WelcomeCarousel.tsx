import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MapPin, Route, Heart, Star } from 'lucide-react';

interface WelcomeCarouselProps {
  userId: string;
}

const WelcomeCarousel: React.FC<WelcomeCarouselProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Check if this specific user has seen the welcome carousel
    const hasSeenWelcome = localStorage.getItem(`hasSeenWelcome_${userId}`);
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, [userId]);

  const handleClose = () => {
    localStorage.setItem(`hasSeenWelcome_${userId}`, 'true');
    setIsOpen(false);
  };

  const slides = [
    {
      title: "Welcome to Unitive",
      description: "Your ultimate guide to discovering the best locations throughout Mexico City. Find hidden gems, popular spots, and create your perfect itinerary.",
      icon: <MapPin className="w-12 h-12 text-green-600" />
    },
    {
      title: "Discover Amazing Places",
      description: "Search and filter through hundreds of locations, read reviews, and get detailed information about opening hours, accessibility, and more.",
      icon: <Star className="w-12 h-12 text-yellow-500" />
    },
    {
      title: "Create Custom Routes",
      description: "Plan your visit by creating custom walking routes between your favorite locations. We'll help you optimize your journey through the city.",
      icon: <Route className="w-12 h-12 text-blue-500" />
    },
    {
      title: "Save Your Favorites",
      description: "Keep track of the places you love by adding them to your favorites. Build your personal collection of must-visit locations.",
      icon: <Heart className="w-12 h-12 text-red-500" />
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
      setIsOpen(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <div className="relative px-4 py-6">
          <div className="flex flex-col items-center text-center">
            {slides[currentSlide].icon}
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              {slides[currentSlide].title}
            </h2>
            <p className="mt-4 text-gray-600">
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentSlide === index ? 'bg-green-600' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={prevSlide}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {currentSlide === slides.length - 1 ? (
              <Button
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                onClick={handleClose}
              >
                Get Started
              </Button>
            ) : (
              <Button
                className="flex items-center gap-2"
                onClick={nextSlide}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeCarousel;