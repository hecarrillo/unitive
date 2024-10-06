"use client";

import { FC, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Home, Info, Settings, Search} from 'lucide-react';
import Map from './MapLayout';

interface LatLng {
  lat: number;
  lng: number;
}

const defaultCenter: LatLng = {
  lat: 19.4326,
  lng: -99.1332, // Mexico City coordinates
};

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'About', path: '/about', icon: Info },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const MapWithOverlay: FC = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const router = useRouter();

  const toggleNav = () => setIsNavOpen(!isNavOpen);

  const handleSearch = () => {
    // You can implement your search functionality here.
    alert(`Searching for: ${searchQuery}`);
  };
  
  return (
    <div className="relative h-screen w-full">
      {/* Map Component */}
      <main className="h-full w-full">
        <Map/>
      </main>
      {/* Navigation toggle button */}
      <button
        onClick={toggleNav}
        className={`absolute top-4 left-4 z-50 p-2 bg-white rounded-full shadow-lg ${
          isNavOpen ? 'translate-x-64 mt-4' : 'translate-x-4 mt-4'
        }`}
      >
        {isNavOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="absolute top-0 left-0 h-full flex">
        {/* Side Navigation */}
        <nav
          className={`absolute top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
            isNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-2 p-2 rounded-lg ${
                  router.pathname === item.path
                    ? 'bg-blue-100 text-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
        {/* Search Bar */}
        <div className={`mt-4 transition-all duration-300 ease-in-out ${
          isNavOpen ? 'translate-x-0' : '-translate-x-64'
        }`}>
          <form onSubmit={handleSearch} className="flex items-center bg-white rounded-full shadow-lg">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2 px-4 rounded-l-full focus:outline-none"
            />
            <button type="submit" className="p-2 bg-blue-500 rounded-r-full">
              <Search size={20} className="text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MapWithOverlay;