"use client";

import React, { useState, useEffect } from 'react';
import { Search, Sliders } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useFilters } from '@/app/contexts/FilterContext';

interface Category {
  id: number;
  name: string;
}

interface Aspect {
  id: number;
  name: string;
}

interface SearchHeaderProps {
  onFiltersChange: (filters: {
    searchTerm: string;
    categoryIds: number[];
    aspectIds: number[];
    radius: number | null;
    isOpenNow: boolean;
  }) => void;
  initialRadius?: number;
  onNoResults?: () => void;
}


interface FilterConfirmation {
  isShowing: boolean;
  appliedFilters: {
    categories: number;
    aspects: number;
    hasSearchTerm: boolean;
    radius: number;
    isOpenNow: boolean;
  };
}

const STORAGE_KEYS = {
  CATEGORIES: 'filter_categories',
  ASPECTS: 'filter_aspects'
};

const loadFromSession = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  const item = sessionStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

const saveToSession = <T,>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(key, JSON.stringify(data));
};

export default function SearchHeader({ onFiltersChange, initialRadius = 20 }: SearchHeaderProps) {
  const {
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
    isOpenNowFilter,
    setIsOpenNowFilter,
  } = useFilters();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNoResultsToast, setShowNoResultsToast] = useState(false);
  const [filterConfirmation, setFilterConfirmation] = useState<FilterConfirmation>({
    isShowing: false,
    appliedFilters: {
      categories: 0,
      aspects: 0,
      hasSearchTerm: false,
      radius: initialRadius,
      isOpenNow: false
    }
  });

  useEffect(() => {
    const fetchFiltersData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check sessionStorage first
        const cachedCategories = loadFromSession<Category[]>(STORAGE_KEYS.CATEGORIES);
        const cachedAspects = loadFromSession<Aspect[]>(STORAGE_KEYS.ASPECTS);

        if (cachedCategories && cachedAspects) {
          setCategories(cachedCategories);
          setAspects(cachedAspects);
          setIsLoading(false);
          return;
        }

        // If no cached data, fetch from API
        const [categoriesResponse, aspectsResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/aspects')
        ]);

        if (!categoriesResponse.ok || !aspectsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const categoriesData = await categoriesResponse.json();
        const aspectsData = await aspectsResponse.json();

        // Update state
        setCategories(categoriesData);
        setAspects(aspectsData);

        // Cache in sessionStorage
        saveToSession(STORAGE_KEYS.CATEGORIES, categoriesData);
        saveToSession(STORAGE_KEYS.ASPECTS, aspectsData);

      } catch (err) {
        setError('Failed to load filters');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiltersData();
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setIsNameSearch(true);
      setSelectedCategories([]);
      setSelectedAspects([]);
      onFiltersChange({
        searchTerm,
        categoryIds: [],
        aspectIds: [],
        radius: null,
        isOpenNow: isOpenNowFilter
      });
    } else {
      setIsNameSearch(false);
      setSearchTerm('');
      onFiltersChange({
        searchTerm: '',
        categoryIds: selectedCategories,
        aspectIds: selectedAspects,
        radius,
        isOpenNow: isOpenNowFilter
      });
    }

    setFilterConfirmation({
      isShowing: true,
      appliedFilters: {
        categories: isNameSearch ? 0 : selectedCategories.length,
        aspects: isNameSearch ? 0 : selectedAspects.length,
        hasSearchTerm: searchTerm.trim() !== '',
        radius: isNameSearch ? 0 : radius,
        isOpenNow: isOpenNowFilter
      }
    });

    setIsDialogOpen(false);
  };
  const handleDismissConfirmation = () => {
    setFilterConfirmation(prev => ({
      ...prev,
      isShowing: false
    }));
  };

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAspectToggle = (aspectId: number) => {
    setSelectedAspects(prev =>
      prev.includes(aspectId)
        ? prev.filter(id => id !== aspectId)
        : [...prev, aspectId]
    );
  };

  const handleReset = () => {
    resetFilters();

    // Clear all state
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedAspects([]);
    setRadius(initialRadius);
    
    // Reset filter confirmation
    setFilterConfirmation({
      isShowing: false,
      appliedFilters: {
        categories: 0,
        aspects: 0,
        hasSearchTerm: false,
        radius: initialRadius,
        isOpenNow: false
      }
    });

    // Notify parent component
    onFiltersChange({
      searchTerm: '',
      categoryIds: [],
      aspectIds: [],
      radius: initialRadius,
      isOpenNow: false
    });

    // Close the dialog
    setIsDialogOpen(false);
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };


  return (
    <div className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-2 justify-center">
          <div className="relative w-[40%]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input 
              className={`w-full pl-10 pr-4 white ${!isNameSearch && selectedCategories.length + selectedAspects.length > 0 ? 'opacity-50' : ''}`}
              placeholder={!isNameSearch && selectedCategories.length + selectedAspects.length > 0 ? "Clear filters to search by name..." : "Location name..."}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.trim() && !isNameSearch) {
                  setSelectedCategories([]);
                  setSelectedAspects([]);
                }
              }}
              onKeyPress={handleKeyPress}
              disabled={!isNameSearch && selectedCategories.length + selectedAspects.length > 0}
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 white"
                disabled={isNameSearch && searchTerm.trim() !== ''}
                title={isNameSearch && searchTerm.trim() !== '' ? "Clear name search to use filters" : ""}
              >
                {filterConfirmation.isShowing ? (
                  <div className="flex items-center gap-2">
                    <span>Filters Applied</span>
                    <span className="h-5 w-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                      {filterConfirmation.appliedFilters.categories + 
                       filterConfirmation.appliedFilters.aspects + 
                       (filterConfirmation.appliedFilters.hasSearchTerm ? 1 : 0) + 
                       (filterConfirmation.appliedFilters.radius > 0 ? 1 : 0)
                       + (filterConfirmation.appliedFilters.isOpenNow ? 1 : 0)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Filters</span>
                    {(selectedCategories.length > 0 || selectedAspects.length > 0) && (
                      <span className="h-5 w-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                        {selectedCategories.length + selectedAspects.length}
                      </span>
                    )}
                  </div>
                )}
              </Button>
            </DialogTrigger>
  
            <DialogContent className="sm:max-w-md z-[999]">
              {searchTerm.trim() !== '' && (
                <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700">
                    Note: Using filters will clear your name search
                  </p>
                </div>
              )}
              {filterConfirmation.isShowing ? (
                <div className="p-4">
                  <DialogHeader>
                    <DialogTitle className="text-center mb-4">Filters Applied</DialogTitle>
                  </DialogHeader>
                  <div className="mb-6">
                    <h3 className="font-medium mb-2">Active Filters:</h3>
                    <div className="space-y-2">
                      {filterConfirmation.appliedFilters.hasSearchTerm && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span>Search Term: {searchTerm}</span>
                        </div>
                      )}
                      {filterConfirmation.appliedFilters.categories > 0 && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span>Categories: {filterConfirmation.appliedFilters.categories} selected</span>
                        </div>
                      )}
                      {filterConfirmation.appliedFilters.aspects > 0 && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span>Aspects: {filterConfirmation.appliedFilters.aspects} selected</span>
                        </div>
                      )}
                      {filterConfirmation.appliedFilters.isOpenNow && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span>Open Now: Yes</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>Radius: {filterConfirmation.appliedFilters.radius} km</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={handleReset}  // This should now properly clear everything
                      variant="outline"
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={handleDismissConfirmation}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Add More Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-center mb-4">Filter Options</DialogTitle>
                  </DialogHeader>
                  
                  {error ? (
                    <div className="text-red-500 text-center p-4">{error}</div>
                  ) : (
                    <Tabs defaultValue="categories" className="w-full">
                      <TabsList className="grid grid-cols-3 mb-4">
                        <TabsTrigger value="categories" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                          Categories
                          {selectedCategories.length > 0 && (
                            <span className="ml-1 text-xs">({selectedCategories.length})</span>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="aspects" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                          Aspects
                          {selectedAspects.length > 0 && (
                            <span className="ml-1 text-xs">({selectedAspects.length})</span>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="radius" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                          Radius
                        </TabsTrigger>
                      </TabsList>
  
                      <TabsContent value="categories">
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                          {isLoading ? (
                            <div className="text-center py-4">Loading categories...</div>
                          ) : (
                            <div className="space-y-4">
                              {categories.map((category) => (
                                <div key={category.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`category-${category.id}`}
                                    checked={selectedCategories.includes(category.id)}
                                    onCheckedChange={() => handleCategoryToggle(category.id)}
                                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                  />
                                  <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
  
                      <TabsContent value="aspects">
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                          {isLoading ? (
                            <div className="text-center py-4">Loading aspects...</div>
                          ) : (
                            <div className="space-y-4">
                              {aspects.map((aspect) => (
                                <div key={aspect.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`aspect-${aspect.id}`}
                                    checked={selectedAspects.includes(aspect.id)}
                                    onCheckedChange={() => handleAspectToggle(aspect.id)}
                                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                  />
                                  <Label htmlFor={`aspect-${aspect.id}`}>{aspect.name}</Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
  
                      <TabsContent value="radius">
                        <div className="p-4 space-y-6">
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Search Radius</span>
                              <span className="text-sm text-gray-500">{radius} km</span>
                            </div>
                            <Slider
                              value={[radius]}
                              onValueChange={([value]) => setRadius(value)}
                              max={20}
                              step={1}
                              className="py-2"
                            />
                          </div>
                        </div>
                      </TabsContent>
                      <div className="mt-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="open-now"
                            checked={isOpenNowFilter}
                            onCheckedChange={(checked) => setIsOpenNowFilter(checked as boolean)}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                          <Label htmlFor="open-now">Open Now</Label>
                        </div>
                      </div>
                    </Tabs>
                  )}
  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                      disabled={isLoading}
                    >
                      Reset
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleSearch}
                      disabled={isLoading}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
          <Button 
            onClick={handleSearch}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}