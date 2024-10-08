"use client"

import { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import Loading from '../utils/Loading'

interface LatLng {
  lat: number;
  lng: number;
}

interface Location {
  id: string;
  name: string;
  image: string | null;
  latitude: number;
  longitude: number;
  summarizedReview: string | null;
  rating: number | null;
  distance: number;
  aspectRatings: { [key: string]: number };
}

interface ApiResponse {
  locations: Location[];
  page: number;
  perPage: number;
  total: number;
}

const defaultCenter: LatLng = {
  lat: 19.4326,
  lng: -99.1332, // Mexico City coordinates
};

const places = [
  { id: 1, name: 'Location 1', position: { lat: 40.7128, lng: -74.0060 } },
  { id: 2, name: 'Location 2', position: { lat: 40.7282, lng: -73.7949 } }  ,
  // Add more locations as needed
];


const Map: FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [zoom, setZoom] = useState<number>(12);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/search?latitude=19.4326&longitude=-99.1332&distance=10&page=1&perPage=20');
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        const data: ApiResponse = await response.json();
        setLocations(data.locations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleMarkerClick = (place) => {
    setSelectedPlace(place);
  };
  
  const handleInfoWindowClose = () => {
    setSelectedPlace(null);
  };
  
  const handleRedirect = (placeId) => {
    router.push(`/location?id=${placeId}`);
  };

  if (loading) return <Loading/>;
  if (error) return <div>Error: {error}</div>;

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <GoogleMap
          center={center}
          zoom={zoom}
          mapContainerStyle={{ width: '100%', height: '100%' }}
        >
          {locations.map(place => (
          <Marker
            key={place.id}
            position={{lat: place.latitude, lng: place.longitude}}
            onClick={() => handleMarkerClick(place)}
          />
        ))}

        {selectedPlace && (
          <InfoWindow
            position={selectedPlace.position}
            onCloseClick={handleInfoWindowClose}
          >
            <div>
              <h2>{selectedPlace.name}</h2>
              <button onClick={() => handleRedirect(selectedPlace.id)}>
                View Details
              </button>
            </div>
          </InfoWindow>
        )}
        </GoogleMap>
      </LoadScript>
  );
};

export default Map;