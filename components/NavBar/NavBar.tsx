"use client";

import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Info, Settings, Search, LogOut } from 'lucide-react';

const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Log Out', path: '/logout', icon: LogOut },
];

const NavBar: FC = () => {
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const pathname = usePathname();

    const toggleNav = () => setIsNavOpen(!isNavOpen);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // You can implement your search functionality here.
        alert(`Searching for: ${searchQuery}`);
    };

    useEffect(() => {
        // Close the navbar when the route changes
        setIsNavOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Navigation toggle button */}
            <button
                onClick={toggleNav}
                className={`fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-lg transition-transform duration-300 ease-in-out ${
                    isNavOpen ? 'translate-x-64' : 'translate-x-0'
                }`}
            >
                {isNavOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay */}
            {isNavOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={toggleNav}
                ></div>
            )}

            {/* Side Navigation */}
            <nav
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
                    isNavOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Search Bar */}
                <div className="p-4 mt-16">
                    <form onSubmit={handleSearch} className="flex items-center bg-white rounded-full shadow-lg">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="py-2 px-4 rounded-l-full focus:outline-none w-full"
                        />
                        <button type="submit" className="p-2 bg-blue-500 rounded-r-full">
                            <Search size={20} className="text-white" />
                        </button>
                    </form>
                </div>
                <div className="p-4 space-y-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center space-x-2 p-2 rounded-lg ${
                                pathname === item.path
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
        </>
    );
};

export default NavBar;