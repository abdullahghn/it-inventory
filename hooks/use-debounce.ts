import { useState, useEffect } from 'react'

/**
 * Custom hook for debounced values
 * Useful for search inputs to avoid excessive API calls
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up the timeout to update the debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if value changes or component unmounts
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for debounced search with loading state
 * Provides both the debounced search term and a loading indicator
 * 
 * @param searchTerm - The search term to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Object containing debounced search term and loading state
 */
export function useDebouncedSearch(searchTerm: string, delay: number = 300) {
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, delay)

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [searchTerm, debouncedSearchTerm])

  return {
    debouncedSearchTerm,
    isSearching
  }
} 