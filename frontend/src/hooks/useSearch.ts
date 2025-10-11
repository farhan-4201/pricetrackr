import { useState } from 'react';
import { productsAPI, ScrapedProduct } from '@/lib/api';

export const useSearch = () => {
  const [scrapedProducts, setScrapedProducts] = useState<ScrapedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (query: string) => {
    const currentQuery = query.trim();

    if (!currentQuery) {
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    setError('');
    setScrapedProducts([]);

    try {
      const results = await productsAPI.searchAllMarketsProducts(currentQuery);
      setScrapedProducts(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
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
