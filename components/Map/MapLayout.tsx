"use client"

import { FC, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

interface LatLng {
  lat: number;
  lng: number;
}
  
const handleMarkerClick = (place) => {
  setSelectedPlace(place);
};

const handleInfoWindowClose = () => {
  setSelectedPlace(null);
};

const handleRedirect = (placeId) => {
  console.log(placeId)
};

const containerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter: LatLng = {
  lat: 19.4326,
  lng: -99.1332, // Mexico City coordinates
};

const places = [
  { id: 1, name: 'Location 1', position: { lat: 40.7128, lng: -74.0060 } },
  { id: 2, name: 'Location 2', position: { lat: 40.7282, lng: -73.7949 } },
  // Add more locations as needed
];

const Map: FC = () => {
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [zoom, setZoom] = useState<number>(12);

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <GoogleMap
          center={center}
          zoom={zoom}
          mapContainerStyle={{ width: '100%', height: '100%' }}
        >
          {places.map(place => (
          <Marker
            key={place.id}
            position={place.position}
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