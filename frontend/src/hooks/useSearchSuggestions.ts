import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

type SuggestionItem = {
  text: string;
  type: 'recent' | 'product';
  marketplace?: string;
};

type UseSearchSuggestionsProps = {
  searchQuery: string;
  onSearch: (query: string) => void;
  setSearchQuery: (query: string) => void;
};

export const useSearchSuggestions = ({ searchQuery, onSearch, setSearchQuery }: UseSearchSuggestionsProps) => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<SuggestionItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedSearches = localStorage.getItem('recent_searches');
    if (storedSearches) {
      try {
        const parsed = JSON.parse(storedSearches);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.warn('Failed to parse recent searches from localStorage:', error);
        setRecentSearches([]);
      }
    }
  }, []);

  // Fetch autocomplete suggestions when search query changes
  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const response = await api.get(`/products/autocomplete?q=${encodeURIComponent(searchQuery.trim())}`) as any;
          const autocompleteItems: SuggestionItem[] = (response.suggestions || []).map((s: any) => ({
            text: s.text,
            type: 'product' as const,
            marketplace: s.marketplace
          }));
          setAutocompleteSuggestions(autocompleteItems);
        } catch (error) {
          console.error('Failed to fetch autocomplete suggestions:', error);
          setAutocompleteSuggestions([]);
        }
      } else {
        setAutocompleteSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchAutocomplete, 150); // Debounce API calls
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Combine and set suggestions
  useEffect(() => {
    const recentItems: SuggestionItem[] = recentSearches
      .filter(search => search.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery.trim().length < 2)
      .slice(0, 3)
      .map(search => ({ text: search, type: 'recent' as const }));

    const combined = [...autocompleteSuggestions.slice(0, 5), ...recentItems.slice(0, 2)];
    const unique = combined.filter((item, index, self) =>
      index === self.findIndex(t => t.text === item.text)
    );

    setSuggestions(unique);
    setShowSuggestions(unique.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [searchQuery, recentSearches, autocompleteSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(search => search !== trimmedQuery);
      const updated = [trimmedQuery, ...filtered].slice(0, 10);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    const recentItems: SuggestionItem[] = recentSearches
      .slice(0, 5)
      .map(search => ({ text: search, type: 'recent' as const }));
    setSuggestions(recentItems);
    setShowSuggestions(recentItems.length > 0);
  };

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    onSearch(suggestion.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex !== -1) {
            handleSuggestionClick(suggestions[selectedSuggestionIndex]);
          } else {
            onSearch(searchQuery);
            setShowSuggestions(false);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          break;
        default:
          break;
      }
    } else if (e.key === 'Enter') {
      onSearch(searchQuery);
    }
  };

  return {
    suggestions,
    showSuggestions,
    selectedSuggestionIndex,
    inputRef,
    dropdownRef,
    saveRecentSearch,
    handleInputChange,
    handleInputFocus,
    handleSuggestionClick,
    handleKeyDown,
  };
};
