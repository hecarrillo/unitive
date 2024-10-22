"use client";

import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Info, Settings, Search, LogOut } from 'lucide-react';
import { useSupabase } from '@/app/supabase-provider';
import SearchBar from './SearchBar';

let navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Settings', path: '/settings', icon: Settings },
];

const NavBar: FC = () => {
    const { signOut, session } = useSupabase();
    const [isNavOpen, setIsNavOpen] = useState(false);
    const pathname = usePathname();

    const toggleNav = () => setIsNavOpen(!isNavOpen);

    useEffect(() => {
        // Close the navbar when the route changes
        setIsNavOpen(false);
    }, [pathname]);

    async function handleLogout() {
        await signOut();
    }
    
    if(session){
        navItems = [
            { name: 'Home', path: '/', icon: Home },
            //{ name: 'About', path: '/about', icon: Info },
            //{ name: 'Settings', path: '/settings', icon: Settings },
            { name: 'Log Out', path: '/logout', icon: LogOut, onClick: handleLogout }
        ];
    } else {
        navItems = [
            { name: 'Home', path: '/', icon: Home },
            //{ name: 'About', path: '/about', icon: Info },
            //{ name: 'Settings', path: '/settings', icon: Settings },
        ];
    }

    if (!session) {
        return null;
    }
    return (
        <>
            {/* Navigation toggle button */}
            <button
                onClick={toggleNav}
                className={`fixed top-20 left-4 z-50 p-2 bg-white rounded-full shadow-lg transition-transform duration-300 ease-in-out ${
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
                <SearchBar/>
                <div className="p-4 space-y-4 top-10">
                    {navItems.map((item) => (
                        item.onClick ? (
                            <button
                                key={item.name}
                                onClick={item.onClick}
                                className={`flex items-center space-x-2 p-2 rounded-lg w-full text-left ${
                                    pathname === item.path
                                        ? 'bg-green-100 text-black-600'
                                        : 'hover:bg-gray-100'
                                }`}
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
                </div>
            </nav>
        </>
    );
};

export default NavBar;