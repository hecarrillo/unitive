// pages/location/[id].js
"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import Loading from '../../components/utils/Loading'

function LocationDetails() {
  const searchParams = useSearchParams();
  const id = parseInt(searchParams?.get('id')!);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return; // Wait for the id to be available

    const fetchLocationData = async () => {
      try {
        // In a real application, you would fetch data from an API
        // For this example, we'll simulate an API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        // Simulated data
        const data = {
          id: id,
          name: `Location ${id}`,
          description: `This is the detailed description for Location ${id}.`,
          address: '123 Example Street, City, Country',
          rating: 2,
          review: 'very good',
          keywords: ['good', 'xd'],
          image: 'https://es.wikipedia.org/wiki/Palacio_de_Bellas_Artes_(Ciudad_de_M%C3%A9xico)#/media/Archivo:Bellas_Artes_01.jpg'
          // Add more details as needed
        };
        
        setLocationData(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch location data');
        setLoading(false);
      }
    };

    fetchLocationData();
  }, [id]);

  if (loading) return <Loading/>;
  if (error) return <div>{error}</div>;
  if (!locationData) return <div>No data found for this location.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl">
        <div className="relative h-64 w-full">
          <img
            src={locationData.image}
            alt={locationData.name}
            className="w-full h-full object-cover rounded-t-lg"
          />
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{locationData.name}</h1>
          <div className="flex items-center mb-4">
            <div className="flex mr-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(locationData.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold">{locationData.rating}</span>
          </div>
          <p className="text-gray-700 mb-6">{locationData.review}</p>
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
        </div>
      </div>
    </div>
  );
};

export default LocationDetails;