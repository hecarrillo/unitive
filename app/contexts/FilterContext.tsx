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
  isNameSearch: boolean;
  setIsNameSearch: Dispatch<SetStateAction<boolean>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children, initialRadius = 20 }: { children: React.ReactNode, initialRadius?: number }) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedAspects, setSelectedAspects] = useState<number[]>([]);
  const [radius, setRadius] = useState<number>(initialRadius);
  const [isNameSearch, setIsNameSearch] = useState<boolean>(false);

  useEffect(() => {
    const savedFilters = localStorage.getItem('mapFilters');
    if (savedFilters) {
      const { 
        searchTerm: savedSearchTerm,
        selectedCategories: savedCategories,
        selectedAspects: savedAspects,
        radius: savedRadius,
        isNameSearch: savedIsNameSearch
      } = JSON.parse(savedFilters);

      setSearchTerm(savedSearchTerm);
      setSelectedCategories(savedCategories);
      setSelectedAspects(savedAspects);
      setRadius(savedRadius);
      setIsNameSearch(savedIsNameSearch);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mapFilters', JSON.stringify({
      searchTerm,
      selectedCategories,
      selectedAspects,
      radius,
      isNameSearch
    }));
  }, [searchTerm, selectedCategories, selectedAspects, radius, isNameSearch]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedAspects([]);
    setRadius(initialRadius);
    setIsNameSearch(false);
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
      resetFilters,
      isNameSearch,
      setIsNameSearch,
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