import { useState, useEffect, useRef } from 'react';

type UseSearchSuggestionsProps = {
  searchQuery: string;
  onSearch: (query: string) => void;
  setSearchQuery: (query: string) => void;
};

export const useSearchSuggestions = ({ searchQuery, onSearch, setSearchQuery }: UseSearchSuggestionsProps) => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
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

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = recentSearches
        .filter(search => search.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions(recentSearches.slice(0, 5));
      setShowSuggestions(recentSearches.length > 0);
    }
    setSelectedSuggestionIndex(-1);
  }, [searchQuery, recentSearches]);

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
    if (recentSearches.length > 0) {
      setSuggestions(recentSearches.slice(0, 5));
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
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
