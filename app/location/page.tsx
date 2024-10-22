"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Star } from 'lucide-react';
import Image from 'next/image';

interface LocationData {
  id: string;
  name: string;
  description: string;
  address: string;
  rating: number;
  review: string;
  keywords: string[];
  image: string;
}

function LocationDetails() {
  const searchParams = useSearchParams();
  
  // Get and validate all required parameters
  const locationData: LocationData = {
    id: searchParams?.get('id') || '',
    name: searchParams?.get('name') || '',
    description: searchParams?.get('description') || '',
    address: searchParams?.get('address') || '',
    rating: (() => {
      const ratingParam = searchParams?.get('rating');
      if (!ratingParam) return 0;
      const parsed = parseInt(ratingParam);
      return isNaN(parsed) ? 0 : parsed;
    })(),
    review: searchParams?.get('review') || '',
    keywords: searchParams?.get('keywords')?.split(',').filter(Boolean) || [],
    image: searchParams?.get('image') || ''
  };

  // Check if we have the minimum required data
  if (!locationData.id || !locationData.name) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-lg text-gray-700">
            Missing required location information.
          </p>
        </div>
      </div>
    );
  }

  // Function to check if image URL is valid
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    // Check if the URL is not "null", "undefined", or empty after trimming
    if (url.trim().toLowerCase() === 'null' || url.trim().toLowerCase() === 'undefined') return false;
    // Additional checks for valid URL format could be added here
    return url.trim().length > 0;
  };

  const NoImagePlaceholder = () => (
    <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-500">
      <svg 
        className="w-16 h-16 mb-2" 
        fill="none" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="text-sm">No image available</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl">
        <div className="relative h-64 w-full">
          {isValidImageUrl(locationData.image) ? (
            <Image
              src={locationData.image}
              alt={locationData.name}
              fill
              className="object-cover rounded-t-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => {
                // If image fails to load, replace with NoImagePlaceholder
                const target = e.target as HTMLElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.appendChild(document.createElement('div')).outerHTML = 
                    '<div class="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-500">' +
                    '<svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>' +
                    '</svg>' +
                    '<p class="text-sm">Image failed to load</p></div>';
                }
              }}
            />
          ) : (
            <NoImagePlaceholder />
          )}
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{locationData.name}</h1>
          {locationData.address && (
            <p className="text-gray-600 mb-4">{locationData.address}</p>
          )}
          <div className="flex items-center mb-4">
            <div className="flex mr-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < locationData.rating 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold">{locationData.rating}</span>
          </div>
          {locationData.description && (
            <p className="text-gray-700 mb-4">{locationData.description}</p>
          )}
          {locationData.review && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Review</h2>
              <p className="text-gray-700">{locationData.review}</p>
            </div>
          )}
          {locationData.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {locationData.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocationDetails;