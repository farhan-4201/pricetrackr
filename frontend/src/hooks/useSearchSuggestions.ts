import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

type SuggestionItem = {
  text: string;
  type: 'product';
  marketplace?: string;
};

type UseSearchSuggestionsProps = {
  searchQuery: string;
  onSearch: (query: string) => void;
  setSearchQuery: (query: string) => void;
};

export const useSearchSuggestions = ({ searchQuery, onSearch, setSearchQuery }: UseSearchSuggestionsProps) => {
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<SuggestionItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const fetchAutocomplete = async () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2) {
      setAutocompleteSuggestions([]);
      return;
    }

    try {
      // ✅ FIXED: Remove /api/v1 prefix - it's already in the base URL
      const response = await api.get(
        `/products/autocomplete?q=${encodeURIComponent(trimmedQuery)}`
      ) as any;

      console.log('✅ Autocomplete response:', response);

      const autocompleteItems: SuggestionItem[] = (response?.suggestions || []).map((s: any) => ({
        text: s.text,
        type: 'product' as const,
        marketplace: s.marketplace,
      }));

      setAutocompleteSuggestions(autocompleteItems);
    } catch (error) {
      console.error('❌ Failed to fetch autocomplete suggestions:', error);
      setAutocompleteSuggestions([]);
    }
  };

  const debounceTimer = setTimeout(fetchAutocomplete, 200);
  return () => clearTimeout(debounceTimer);
}, [searchQuery]);

  // Update suggestions based on autocomplete results
  useEffect(() => {
    setSuggestions(autocompleteSuggestions.slice(0, 5));
    setSelectedSuggestionIndex(-1);
  }, [autocompleteSuggestions]);

  // Close dropdown on outside click
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    // Show autocomplete suggestions if available, otherwise hide dropdown
    setShowSuggestions(autocompleteSuggestions.length > 0);
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
    handleInputChange,
    handleInputFocus,
    handleSuggestionClick,
    handleKeyDown,
    setShowSuggestions,
  };
};
