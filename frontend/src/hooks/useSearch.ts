import { useState } from 'react';
import { toast } from 'sonner';
import { productsAPI, ScrapedProduct } from '@/lib/api';

export const useSearch = () => {
  const [scrapedProducts, setScrapedProducts] = useState<ScrapedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (query: string) => {
    const currentQuery = query.trim();

    if (!currentQuery) {
      toast.error('Please enter a search term');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    setError('');
    setScrapedProducts([]);
    toast.info('Searching across marketplaces...');

    try {
      const results = await productsAPI.searchAllMarketsProducts(currentQuery);
      setScrapedProducts(results);
      if (results.length === 0) {
        toast.warning('Search complete. No products found. Try different keywords.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(`Search failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    scrapedProducts,
    loading,
    error,
    handleSearch,
  };
};
