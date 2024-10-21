import React, { useState } from 'react';
import { Search, Sliders } from 'lucide-react';

// Define location type
type Location = {
  id: string;
  name: string;
  image: string | null;
  latitude: number;
  longitude: number;
  summarizedReview: string | null;
  rating: number | null;
  distance: number;
  aspectRatings: { [key: string]: number };
  categoryId: number;
  type?: string;
};

interface ApiResponse {
  locations: Location[];
  page: number;
  perPage: number;
  total: number;
}

// Define category mapping
const categoryMap = {
  'natural heritage': 1,
  'scenic lookout': 2,
  'informative/educational': 3,
  'rest': 4,
  'nature': 5,
  'historical events': 6,
  'feeding': 7,
  'religious': 8,
  'flora/fauna': 9,
  'shopping': 10,
  'religious heritage': 11,
  'Religion': 12,
  'Unknown': 13,
  'tourist place - water': 14,
  'sports/leisure': 15,
  'accommodation': 16,
  'events': 17,
  'Flora/Fauna': 18,
  'religion': 19,
  'leisure': 20,
  'scenic_spot': 21,
  'water': 22,
  'tourist place': 23,
  'cultural heritage': 24,
  'scenic viewpoint': 25,
  'urban leisure': 26,
  'accomodation': 27,
  'entertainment': 28,
};

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultCenter = {
    lat: 19.4326,
    lng: -99.1332,
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const matchedCategory = Object.entries(categoryMap).find(([category]) =>
        searchQuery.toLowerCase().includes(category.toLowerCase())
      );
      
      const categoryId = matchedCategory ? matchedCategory[1] : '';
      
      console.log('Fetching locations...'); // Debug log
      const locationResponse = await fetch(
        `/api/search?latitude=${defaultCenter.lat}&longitude=${defaultCenter.lng}&distance=10&categoryId=${categoryId}&page=1&perPage=10`
      );

      if (!locationResponse.ok) {
        throw new Error('Failed to fetch locations');
      }
      const response: ApiResponse = await locationResponse.json();
      
      // Check if the response data is in the expected format
      let locationData = response.locations;
      setLocations(locationData);

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="p-4 mt-16 flex items-center space-x-2">
        <div className="flex-grow">
          <form onSubmit={handleSearch} className="flex items-center bg-white rounded-full shadow-lg">
            <input
              type="text"
              placeholder="Area or location you are in"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2 px-4 rounded-full focus:outline-none w-full text-sm"
            />
            <button type="button" className="p-2 text-gray-400 hover:text-gray-600">
              <Sliders size={20} />
            </button>
          </form>
        </div>
        <button 
          onClick={handleSearch}
          className="p-2 bg-green-500 rounded-full text-white shadow-lg hover:bg-green-600 transition-colors"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Results Container */}
      <div className="absolute left-0 right-0 z-50 mx-4">
        {/* Loading state */}
        {loading && (
          <div className="mt-2 p-4 bg-white rounded-lg shadow-lg">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mt-2 p-4 bg-red-50 text-red-600 rounded-lg shadow-lg">
            {error}
          </div>
        )}

        {/* Results list */}
        {!loading && Array.isArray(locations) && locations.length > 0 && (
          <div className="mt-2 bg-white rounded-lg shadow-lg overflow-hidden max-h-96 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {locations.map((location: Location) => (
                <li key={location.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <h3 className="font-medium text-gray-900">{location.name}</h3>
                  <p className="text-sm text-gray-500">
                    {typeof location.distance === 'number' ? `${location.distance.toFixed(1)} km away` : ''} 
                    {location.categoryId ? ` • Category ${location.categoryId}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No results state */}
        {!loading && !error && searchQuery && (!Array.isArray(locations) || locations.length === 0) && (
          <div className="mt-2 p-4 bg-gray-50 text-gray-600 rounded-lg shadow-lg text-center">
            No locations found for "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;