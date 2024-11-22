// lib/map-utils.ts

// Define Mexico City bounds
export const CDMX_BOUNDS = {
    north: 19.5928,
    south: 19.1887,
    east: -98.9508,
    west: -99.3248
  };
  
  export const fitMapToMexicoCity = (map: google.maps.Map): void => {
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(CDMX_BOUNDS.south, CDMX_BOUNDS.west),
      new google.maps.LatLng(CDMX_BOUNDS.north, CDMX_BOUNDS.east)
    );
    
    map.fitBounds(bounds);
    
    // Add a listener to prevent too much zoom out
    google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      if (map.getZoom()! > 11) {
        map.setZoom(11);
      }
    });
  };
  
  export const shouldZoomToCity = (mode: 'normal' | 'route' | 'favorites', isSearching: boolean): boolean => {
    return mode === 'favorites' || isSearching;
  };