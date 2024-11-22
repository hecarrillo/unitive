// app/contexts/FilterContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, Dispatch, SetStateAction } from 'react';

interface FilterContextType {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  selectedCategories: number[];
  setSelectedCategories: Dispatch<SetStateAction<number[]>>;
  selectedAspects: number[];
  setSelectedAspects: Dispatch<SetStateAction<number[]>>;
  radius: number;
  setRadius: Dispatch<SetStateAction<number>>;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children, initialRadius = 20 }: { children: React.ReactNode, initialRadius?: number }) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedAspects, setSelectedAspects] = useState<number[]>([]);
  const [radius, setRadius] = useState<number>(initialRadius);

  // Load saved filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('mapFilters');
    if (savedFilters) {
      const { 
        searchTerm: savedSearchTerm,
        selectedCategories: savedCategories,
        selectedAspects: savedAspects,
        radius: savedRadius
      } = JSON.parse(savedFilters);

      setSearchTerm(savedSearchTerm);
      setSelectedCategories(savedCategories);
      setSelectedAspects(savedAspects);
      setRadius(savedRadius);
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mapFilters', JSON.stringify({
      searchTerm,
      selectedCategories,
      selectedAspects,
      radius
    }));
  }, [searchTerm, selectedCategories, selectedAspects, radius]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedAspects([]);
    setRadius(initialRadius);
    localStorage.removeItem('mapFilters');
  };

  return (
    <FilterContext.Provider value={{
      searchTerm,
      setSearchTerm,
      selectedCategories,
      setSelectedCategories,
      selectedAspects,
      setSelectedAspects,
      radius,
      setRadius,
      resetFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}