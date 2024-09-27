"use client"; // Mark as a Client Component for use with hooks

import { FC, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import styles from './map.module.css'; // Import CSS Module

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

const MapWithOverlay: FC = () => {
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [zoom, setZoom] = useState<number>(12);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleSearch = () => {
    // You can implement your search functionality here.
    alert(`Searching for: ${searchQuery}`);
  };
  
  return (
    <div className={styles.mapWrapper}>
      {/* Map Component */}
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

      {/* Overlay Component */}
      <div className={styles.searchBar}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location"
          className={styles.searchInput}
        />
        <button onClick={handleSearch} className={styles.searchButton}>
          Search
        </button>
      </div>
    </div>
  );
};

export default MapWithOverlay;