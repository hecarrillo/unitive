"use client"

import { FC, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface LatLng {
  lat: number;
  lng: number;
}

const containerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter: LatLng = {
  lat: 19.4326,
  lng: -99.1332, // Mexico City coordinates
};

const Map: FC = () => {
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [zoom, setZoom] = useState<number>(12);

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
      >
        {/* Example Marker */}
        <Marker position={defaultCenter} />
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;