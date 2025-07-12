'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2, Package, Users, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useDebouncedSearch } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'

// Search result types
interface SearchResult {
  id: string
  type: 'asset' | 'user' | 'assignment'
  title: string
  subtitle: string
  description?: string
  status?: string
  url: string
  icon: React.ReactNode
}

// Search suggestions for auto-complete
interface SearchSuggestion {
  text: string
  type: 'recent' | 'popular' | 'suggestion'
}

interface GlobalSearchProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
  showSuggestions?: boolean
  maxResults?: number
}

export function GlobalSearch({
  placeholder = "Search assets, users, assignments...",
  className,
  onSearch,
  showSuggestions = true,
  maxResults = 8
}: GlobalSearchProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Use debounced search to avoid excessive API calls
  const { debouncedSearchTerm, isSearching } = useDebouncedSearch(searchTerm, 300)

  // Load recent searches and popular terms on mount
  useEffect(() => {
    loadSearchSuggestions()
  }, [])

  // Handle search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      performSearch(debouncedSearchTerm)
    } else {
      setResults([])
      setIsLoading(false)
    }
  }, [debouncedSearchTerm])

  // Handle click outside to close search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load search suggestions from localStorage
  const loadSearchSuggestions = () => {
    try {
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      const popularTerms = [
        { text: 'laptop', type: 'popular' as const },
        { text: 'monitor', type: 'popular' as const },
        { text: 'printer', type: 'popular' as const },
        { text: 'available', type: 'popular' as const },
        { text: 'warranty', type: 'popular' as const }
      ]
      
      setSuggestions([
        ...recentSearches.slice(0, 3).map((search: string) => ({ text: search, type: 'recent' as const })),
        ...popularTerms
      ])
    } catch (error) {
      console.error('Error loading search suggestions:', error)
    }
  }

  // Save search term to recent searches
  const saveSearchTerm = (term: string) => {
    try {
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      const updatedSearches = [term, ...recentSearches.filter((s: string) => s !== term)].slice(0, 10)
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches))
    } catch (error) {
      console.error('Error saving search term:', error)
    }
  }

  // Perform search across different entities
  const performSearch = async (query: string) => {
    setIsLoading(true)
    
    try {
      // Search assets
      const assetsResponse = await fetch(`/api/assets?search=${encodeURIComponent(query)}&limit=3`)
      const assetsData = await assetsResponse.json()
      
      // Search users
      const usersResponse = await fetch(`/api/users?search=${encodeURIComponent(query)}&limit=3`)
      const usersData = await usersResponse.json()
      
      // Search assignments
      const assignmentsResponse = await fetch(`/api/assignments?search=${encodeURIComponent(query)}&limit=2`)
      const assignmentsData = await assignmentsResponse.json()

      // Combine and format results
      const combinedResults: SearchResult[] = [
        ...(assetsData.data || []).map((asset: any) => ({
          id: asset.id.toString(),
          type: 'asset' as const,
          title: asset.name,
          subtitle: asset.assetTag,
          description: `${asset.category} • ${asset.status}`,
          status: asset.status,
          url: `/dashboard/assets/${asset.id}`,
          icon: <Package className="h-4 w-4" />
        })),
        ...(usersData.data || []).map((user: any) => ({
          id: user.id,
          type: 'user' as const,
          title: user.name,
          subtitle: user.email,
          description: `${user.department || 'No department'} • ${user.role}`,
          status: user.isActive ? 'active' : 'inactive',
          url: `/dashboard/users/${user.id}`,
          icon: <Users className="h-4 w-4" />
        })),
        ...(assignmentsData.data || []).map((assignment: any) => ({
          id: assignment.id.toString(),
          type: 'assignment' as const,
          title: `${assignment.assetName} → ${assignment.userName}`,
          subtitle: assignment.assetTag,
          description: `Assigned ${new Date(assignment.assignedAt).toLocaleDateString()}`,
          status: assignment.status,
          url: `/dashboard/assignments/${assignment.id}`,
          icon: <Calendar className="h-4 w-4" />
        }))
      ]

      setResults(combinedResults.slice(0, maxResults))
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsOpen(true)
    setSelectedIndex(-1)
    
    if (onSearch) {
      onSearch(value)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleResultClick(results[selectedIndex])
      } else if (searchTerm.trim()) {
        handleSearchSubmit()
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setSelectedIndex(-1)
    }
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    saveSearchTerm(searchTerm)
    router.push(result.url)
    setIsOpen(false)
    setSearchTerm('')
    setResults([])
  }

  // Handle search submit
  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      saveSearchTerm(searchTerm)
      router.push(`/dashboard/assets?search=${encodeURIComponent(searchTerm)}`)
      setIsOpen(false)
      setSearchTerm('')
      setResults([])
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.text)
    setIsOpen(false)
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            )}

            {/* Search Results */}
            {!isLoading && results.length > 0 && (
              <div className="max-h-80 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0",
                      selectedIndex === index && "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{result.title}</p>
                          {result.status && (
                            <Badge variant="secondary" className="text-xs">
                              {result.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        {result.description && (
                          <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Search Suggestions */}
            {!isLoading && results.length === 0 && showSuggestions && searchTerm.length === 0 && (
              <div className="p-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Quick Search</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs"
                    >
                      {suggestion.text}
                      {suggestion.type === 'recent' && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Recent
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!isLoading && results.length === 0 && searchTerm.length > 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">No results found for "{searchTerm}"</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearchSubmit}
                  className="mt-2"
                >
                  Search all assets
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 