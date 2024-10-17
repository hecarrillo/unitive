import React, { useState } from 'react';
import { Search, Sliders } from 'lucide-react';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  return (
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
  );
};

export default SearchBar;