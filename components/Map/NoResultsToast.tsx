import React, { useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { AlertCircle } from 'lucide-react';

interface NoResultsProps {
  show: boolean;
  searchTerm?: string;
  filters?: {
    categories?: number[];
    aspects?: number[];
    radius?: number;
    isOpenNow?: boolean;
  };
}

export function NoResultsToast({ 
  show, 
  searchTerm, 
  filters 
}: NoResultsProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (show) {
      toast({
        variant: "destructive",
        title: "No Locations Found",
        description: generateDescription(),
        duration: 5000,
      });
    }
  }, [show]);

  const generateDescription = () => {
    const descriptions: string[] = [];

    if (searchTerm) {
      descriptions.push(`No results for "${searchTerm}"`);
    }

    if (filters) {
      const filterDetails = [];
      
      if (filters.categories && filters.categories.length > 0) {
        filterDetails.push(`Categories applied`);
      }
      
      if (filters.aspects && filters.aspects.length > 0) {
        filterDetails.push(`Aspects applied`);
      }
      
      if (filters.radius) {
        filterDetails.push(`Radius: ${filters.radius} km`);
      }
      
      if (filters.isOpenNow) {
        filterDetails.push(`Open Now filter active`);
      }

      if (filterDetails.length > 0) {
        descriptions.push(`Current filters: ${filterDetails.join(', ')}`);
      }
    }

    descriptions.push("Try broadening your search or adjusting filters.");

    return descriptions.join(". ");
  };

  return null;
}