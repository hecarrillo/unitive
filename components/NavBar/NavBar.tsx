"use client";

import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Home, User, Heart, Map, LogOut } from 'lucide-react';
import { useSupabase } from '@/app/supabase-provider';

const LOAD_FAVORITES_EVENT = 'LOAD_FAVORITES_MAP';

const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Favorites', path: '/', icon: Heart }, // Changed path to '/' since we'll handle it differently
    { name: 'Touristic Route', path: '/routes', icon: Map },
];

const NavBar: FC = () => {
    const { signOut, session } = useSupabase();
    const [isNavOpen, setIsNavOpen] = useState(false);
    const pathname = usePathname();

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen);
    };

    const handleNavItemClick = (path: string, name: string) => {
        if (name === 'Favorites') {
            // Dispatch custom event instead of navigation
            const event = new CustomEvent(LOAD_FAVORITES_EVENT);
            window.dispatchEvent(event);
            setIsNavOpen(false); // Close the nav after clicking
        }
    };

    useEffect(() => {
        setIsNavOpen(false);
    }, [pathname]);

    async function handleLogout() {
        await signOut();
    }

    if (!session) {
        return null;
    }
    
    return (
        <>
            {/* User icon toggle button */}
            <button
                onClick={toggleNav}
                className={`fixed top-20 left-4 z-50 p-2 bg-white rounded-full shadow-lg transition-transform duration-300 ease-in-out ${
                    isNavOpen ? 'translate-x-64' : 'translate-x-0'
                }`}
            >
                {isNavOpen ? <X size={24} /> : <User size={24} />}
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
                {/* User Profile Section */}
                <div className="p-4 border-b">
                    <div className="flex items-center justify-center mb-4">
                        <img 
                            src="/api/placeholder/48/48"
                            alt="User avatar" 
                            className="w-16 h-16 rounded-full"
                        />
                    </div>
                    <p className="text-center text-gray-600">
                        {session?.user?.email}
                    </p>
                </div>

                {/* User Actions Label */}
                <div className="p-4 border-b">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">User Actions</h3>
                </div>

                {/* Navigation Items */}
                <div className="p-4 space-y-2">
                    {navItems.map((item) => (
                        item.name === 'Favorites' ? (
                            <button
                                key={item.path}
                                onClick={() => handleNavItemClick(item.path, item.name)}
                                className={`flex items-center space-x-2 p-2 rounded-lg w-full text-left hover:bg-gray-100`}
                            >
                                <item.icon size={20} />
                                <span>{item.name}</span>
                            </button>
                        ) : (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center space-x-2 p-2 rounded-lg ${
                                    pathname === item.path
                                        ? 'bg-green-100 text-black-600'
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                <item.icon size={20} />
                                <span>{item.name}</span>
                            </Link>
                        )
                    ))}
                    
                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 p-2 rounded-lg w-full text-left hover:bg-gray-100"
                    >
                        <LogOut size={20} />
                        <span>Log Out</span>
                    </button>
                </div>
            </nav>
        </>
    );
};

export default NavBar;