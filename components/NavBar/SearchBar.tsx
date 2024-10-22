import React, { useState } from 'react';
import { Search, Sliders, X, AlertCircle } from 'lucide-react';

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
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const defaultCenter = {
    lat: 19.4326,
    lng: -99.1332,
  };

  const validateSearch = () => {
    if (!searchQuery.trim() && !selectedCategory) {
      setValidationError('Please enter a location name or select a category');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSearch()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const categoryId = selectedCategory ? categoryMap[selectedCategory as keyof typeof categoryMap] : '';
      
      const locationResponse = await fetch(
        `/api/search?latitude=${defaultCenter.lat}&longitude=${defaultCenter.lng}&distance=10&name=${searchQuery.trim()}&categoryId=${categoryId}&page=1&perPage=10`
      );

      if (!locationResponse.ok) {
        throw new Error('Failed to fetch locations');
      }
      const response: ApiResponse = await locationResponse.json();
      setLocations(response.locations);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setShowCategories(false);
    setValidationError(null);
    setLocations([]); // Reset locations when category changes
  };

  const clearCategory = () => {
    setSelectedCategory(null);
    setLocations([]); // Reset locations when category is cleared
    if (!searchQuery.trim()) {
      setValidationError('Please enter a location name or select a category');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setValidationError(null);
    setLocations([]); // Reset locations when search text changes
  };

  return (
    <div className="relative w-full">
      <div className="p-4 pb-8 mt-16 flex items-center space-x-2">
        <div className="flex-grow">
          <form onSubmit={handleSearch} className="flex items-center bg-white rounded-full shadow-lg">
            <input
              type="text"
              placeholder="Search by location name..."
              value={searchQuery}
              onChange={handleInputChange}
              className={`py-2 px-4 rounded-full focus:outline-none w-full text-sm ${
                validationError && !searchQuery.trim() && !selectedCategory
                  ? 'border-red-300 focus:border-red-500'
                  : ''
              }`}
            />
            <button 
              type="button" 
              onClick={() => setShowCategories(!showCategories)}
              className={`p-2 ${
                validationError && !searchQuery.trim() && !selectedCategory
                  ? 'text-red-400 hover:text-red-600'
                  : showCategories
                  ? 'text-green-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Sliders size={20} />
            </button>
          </form>

          {/* Validation Error Message */}
          {validationError && (
            <div className="absolute mt-2 flex items-center space-x-1 text-red-600 text-sm">
              <AlertCircle size={14} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Category Dropdown */}
          {showCategories && (
            <div className="absolute mt-2 w-full bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Select Category</h3>
                <div className="space-y-1">
                  {Object.keys(categoryMap).map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedCategory === category
                          ? 'bg-green-50 text-green-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={handleSearch}
          className={`p-2 rounded-full text-white shadow-lg transition-colors ${
            !searchQuery.trim() && !selectedCategory
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          }`}
          disabled={!searchQuery.trim() && !selectedCategory}
        >
          <Search size={20} />
        </button>
      </div>

      {/* Selected Category Tag */}
      {selectedCategory && (
        <div className="absolute -mt-6 ml-6 z-20">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            {selectedCategory}
            <button
              onClick={clearCategory}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              <X size={14} />
            </button>
          </span>
        </div>
      )}

      {/* Results Container */}
      <div className="absolute left-0 right-0 z-10 mx-4 mt-4">
        {loading && (
          <div className="p-4 bg-white rounded-lg shadow-lg">
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

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg shadow-lg">
            {error}
          </div>
        )}

        {!loading && Array.isArray(locations) && locations.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden max-h-96 overflow-y-auto">
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

        {!loading && !error && (searchQuery || selectedCategory) && (!Array.isArray(locations) || locations.length === 0) && (
          <div className="p-4 bg-gray-50 text-gray-600 rounded-lg shadow-lg text-center">
            No locations found {searchQuery ? `for "${searchQuery}"` : 'in this category'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;