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

interface Category {
  id: number;
  name: string;
}

interface Aspect {
  id: number;
  name: string;
}

interface SearchFilters {
  searchTerm: string;
  categoryIds: number[];
  aspectIds: number[];
  radius: number | null;
}

interface SearchHeaderProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialRadius?: number;
}

export default function SearchHeader({ onFiltersChange, initialRadius = 20 }: SearchHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [radius, setRadius] = useState(initialRadius);
  const [categories, setCategories] = useState<Category[]>([]);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedAspects, setSelectedAspects] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [categoriesResponse, aspectsResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/aspects')
        ]);

        if (!categoriesResponse.ok || !aspectsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const categoriesData = await categoriesResponse.json();
        const aspectsData = await aspectsResponse.json();

        setCategories(categoriesData);
        setAspects(aspectsData);
      } catch (err) {
        setError('Failed to load filters');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    // If there's only a search term, don't include radius
    const searchRadius = searchTerm.trim() && !selectedCategories.length && !selectedAspects.length 
      ? null 
      : radius;

    onFiltersChange({
      searchTerm,
      categoryIds: selectedCategories,
      aspectIds: selectedAspects,
      radius: searchRadius
    });
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
    setSelectedCategories([]);
    setSelectedAspects([]);
    setRadius(initialRadius);
    setSearchTerm('');
    onFiltersChange({
      searchTerm: '',
      categoryIds: [],
      aspectIds: [],
      radius: initialRadius
    });
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
              className="w-full pl-10 pr-4 white"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 white">
                Filters
                {(selectedCategories.length > 0 || selectedAspects.length > 0) && (
                  <span className="ml-1 h-5 w-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                    {selectedCategories.length + selectedAspects.length}
                  </span>
                )}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
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