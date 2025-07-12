'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { 
  saveSearchState, 
  loadSearchState, 
  saveNamedSearch, 
  loadSavedSearches,
  deleteSavedSearch,
  updateSavedSearchUsage,
  setDefaultSearch,
  getDefaultSearch,
  addRecentSearch,
  loadRecentSearches,
  loadSearchPreferences,
  saveSearchPreferences,
  type SearchState,
  type SavedSearch,
  type SearchPreferences
} from '@/lib/search-persistence'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface SearchContextState {
  // Current search state for different entities
  currentSearches: Record<string, SearchState>
  
  // Saved searches
  savedSearches: SavedSearch[]
  
  // Recent searches by entity type
  recentSearches: Record<string, string[]>
  
  // User preferences
  preferences: SearchPreferences
  
  // Loading states
  isLoading: boolean
  isSaving: boolean
}

type SearchAction =
  | { type: 'SET_CURRENT_SEARCH'; entityType: string; searchState: Partial<SearchState> }
  | { type: 'CLEAR_CURRENT_SEARCH'; entityType: string }
  | { type: 'LOAD_SAVED_SEARCHES'; searches: SavedSearch[] }
  | { type: 'ADD_SAVED_SEARCH'; search: SavedSearch }
  | { type: 'DELETE_SAVED_SEARCH'; searchId: string }
  | { type: 'UPDATE_SAVED_SEARCH_USAGE'; searchId: string }
  | { type: 'SET_DEFAULT_SEARCH'; searchId: string }
  | { type: 'SET_RECENT_SEARCHES'; entityType: string; searches: string[] }
  | { type: 'ADD_RECENT_SEARCH'; entityType: string; term: string }
  | { type: 'SET_PREFERENCES'; preferences: Partial<SearchPreferences> }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_SAVING'; isSaving: boolean }

interface SearchContextValue extends SearchContextState {
  // Actions
  setCurrentSearch: (entityType: string, searchState: Partial<SearchState>) => void
  clearCurrentSearch: (entityType: string) => void
  saveSearch: (name: string, entityType: SavedSearch['entityType'], searchState: SearchState) => Promise<boolean>
  deleteSearch: (searchId: string) => Promise<boolean>
  loadSavedSearch: (searchId: string) => SavedSearch | null
  setDefaultSearch: (searchId: string) => Promise<boolean>
  getDefaultSearch: (entityType: SavedSearch['entityType']) => SavedSearch | null
  addRecentSearch: (entityType: string, term: string) => void
  updatePreferences: (preferences: Partial<SearchPreferences>) => void
  loadSavedSearches: () => Promise<void>
}

// ============================================================================
// REDUCER
// ============================================================================

function searchReducer(state: SearchContextState, action: SearchAction): SearchContextState {
  switch (action.type) {
    case 'SET_CURRENT_SEARCH':
      return {
        ...state,
        currentSearches: {
          ...state.currentSearches,
          [action.entityType]: {
            query: action.searchState.query || '',
            filters: action.searchState.filters || {},
            sortBy: action.searchState.sortBy,
            sortOrder: action.searchState.sortOrder,
            page: action.searchState.page,
            view: action.searchState.view,
            timestamp: Date.now(),
          }
        }
      }

    case 'CLEAR_CURRENT_SEARCH':
      const { [action.entityType]: removed, ...remainingSearches } = state.currentSearches
      return {
        ...state,
        currentSearches: remainingSearches
      }

    case 'LOAD_SAVED_SEARCHES':
      return {
        ...state,
        savedSearches: action.searches
      }

    case 'ADD_SAVED_SEARCH':
      return {
        ...state,
        savedSearches: [action.search, ...state.savedSearches.filter(s => s.id !== action.search.id)]
      }

    case 'DELETE_SAVED_SEARCH':
      return {
        ...state,
        savedSearches: state.savedSearches.filter(s => s.id !== action.searchId)
      }

    case 'UPDATE_SAVED_SEARCH_USAGE':
      return {
        ...state,
        savedSearches: state.savedSearches.map(search =>
          search.id === action.searchId
            ? { ...search, lastUsed: new Date().toISOString() }
            : search
        )
      }

    case 'SET_DEFAULT_SEARCH':
      return {
        ...state,
        savedSearches: state.savedSearches.map(search => ({
          ...search,
          isDefault: search.id === action.searchId
        }))
      }

    case 'SET_RECENT_SEARCHES':
      return {
        ...state,
        recentSearches: {
          ...state.recentSearches,
          [action.entityType]: action.searches
        }
      }

    case 'ADD_RECENT_SEARCH':
      const existingSearches = state.recentSearches[action.entityType] || []
      const filteredSearches = existingSearches.filter(term => term !== action.term)
      const updatedSearches = [action.term, ...filteredSearches].slice(0, 10)
      
      return {
        ...state,
        recentSearches: {
          ...state.recentSearches,
          [action.entityType]: updatedSearches
        }
      }

    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.preferences }
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading
      }

    case 'SET_SAVING':
      return {
        ...state,
        isSaving: action.isSaving
      }

    default:
      return state
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

// ============================================================================
// PROVIDER
// ============================================================================

interface SearchProviderProps {
  children: ReactNode
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [state, dispatch] = useReducer(searchReducer, {
    currentSearches: {},
    savedSearches: [],
    recentSearches: {},
    preferences: loadSearchPreferences(),
    isLoading: false,
    isSaving: false,
  })

  // Load initial data on mount
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load saved searches and recent searches on mount
  const loadInitialData = async () => {
    dispatch({ type: 'SET_LOADING', isLoading: true })
    
    try {
      // Load saved searches
      const savedSearches = loadSavedSearches()
      dispatch({ type: 'LOAD_SAVED_SEARCHES', searches: savedSearches })
      
      // Load recent searches for common entity types
      const entityTypes = ['assets', 'users', 'assignments', 'maintenance']
      entityTypes.forEach(entityType => {
        const recentSearches = loadRecentSearches(entityType)
        dispatch({ type: 'SET_RECENT_SEARCHES', entityType, searches: recentSearches })
      })
    } catch (error) {
      console.error('Error loading initial search data:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false })
    }
  }

  // Set current search state
  const setCurrentSearch = (entityType: string, searchState: Partial<SearchState>) => {
    dispatch({ type: 'SET_CURRENT_SEARCH', entityType, searchState })
    
    // Persist to localStorage
    saveSearchState(entityType, searchState)
  }

  // Clear current search state
  const clearCurrentSearch = (entityType: string) => {
    dispatch({ type: 'CLEAR_CURRENT_SEARCH', entityType })
    
    // Remove from localStorage
    const key = `it_inventory_current_search_state_${entityType}`
    localStorage.removeItem(key)
  }

  // Save a named search
  const saveSearch = async (
    name: string, 
    entityType: SavedSearch['entityType'], 
    searchState: SearchState
  ): Promise<boolean> => {
    dispatch({ type: 'SET_SAVING', isSaving: true })
    
    try {
      const success = saveNamedSearch(name, entityType, searchState)
      
      if (success) {
        const updatedSavedSearches = await loadSavedSearches()
        dispatch({ type: 'LOAD_SAVED_SEARCHES', searches: updatedSavedSearches })
      }
      
      return success
    } catch (error) {
      console.error('Error saving search:', error)
      return false
    } finally {
      dispatch({ type: 'SET_SAVING', isSaving: false })
    }
  }

  // Delete a saved search
  const deleteSearch = async (searchId: string): Promise<boolean> => {
    try {
      const success = deleteSavedSearch(searchId)
      
      if (success) {
        dispatch({ type: 'DELETE_SAVED_SEARCH', searchId })
      }
      
      return success
    } catch (error) {
      console.error('Error deleting search:', error)
      return false
    }
  }

  // Load a saved search by ID
  const loadSavedSearch = (searchId: string): SavedSearch | null => {
    return state.savedSearches.find(search => search.id === searchId) || null
  }

  // Set a search as default
  const setDefaultSearchHandler = async (searchId: string): Promise<boolean> => {
    try {
      const success = setDefaultSearch(searchId)
      
      if (success) {
        dispatch({ type: 'SET_DEFAULT_SEARCH', searchId })
      }
      
      return success
    } catch (error) {
      console.error('Error setting default search:', error)
      return false
    }
  }

  // Get default search for entity type
  const getDefaultSearchHandler = (entityType: SavedSearch['entityType']): SavedSearch | null => {
    return getDefaultSearch(entityType)
  }

  // Add recent search term
  const addRecentSearchHandler = (entityType: string, term: string) => {
    dispatch({ type: 'ADD_RECENT_SEARCH', entityType, term })
    
    // Persist to localStorage
    addRecentSearch(entityType, term)
  }

  // Update search preferences
  const updatePreferences = (preferences: Partial<SearchPreferences>) => {
    dispatch({ type: 'SET_PREFERENCES', preferences })
    
    // Persist to localStorage
    saveSearchPreferences(preferences)
  }

  // Load saved searches (refresh from storage)
  const loadSavedSearchesHandler = async () => {
    try {
      const savedSearches = loadSavedSearches()
      dispatch({ type: 'LOAD_SAVED_SEARCHES', searches: savedSearches })
    } catch (error) {
      console.error('Error loading saved searches:', error)
    }
  }

  const contextValue: SearchContextValue = {
    ...state,
    setCurrentSearch,
    clearCurrentSearch,
    saveSearch,
    deleteSearch,
    loadSavedSearch,
    setDefaultSearch: setDefaultSearchHandler,
    getDefaultSearch: getDefaultSearchHandler,
    addRecentSearch: addRecentSearchHandler,
    updatePreferences,
    loadSavedSearches: loadSavedSearchesHandler,
  }

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useSearch() {
  const context = useContext(SearchContext)
  
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  
  return context
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for managing search state for a specific entity type
 */
export function useEntitySearch(entityType: string) {
  const { 
    currentSearches, 
    setCurrentSearch, 
    clearCurrentSearch,
    recentSearches,
    addRecentSearch 
  } = useSearch()
  
  const currentSearch = currentSearches[entityType]
  const entityRecentSearches = recentSearches[entityType] || []
  
  const updateSearch = (searchState: Partial<SearchState>) => {
    setCurrentSearch(entityType, searchState)
  }
  
  const clearSearch = () => {
    clearCurrentSearch(entityType)
  }
  
  const addRecent = (term: string) => {
    addRecentSearch(entityType, term)
  }
  
  return {
    currentSearch,
    recentSearches: entityRecentSearches,
    updateSearch,
    clearSearch,
    addRecent,
  }
}

/**
 * Hook for managing saved searches
 */
export function useSavedSearches(entityType?: SavedSearch['entityType']) {
  const { 
    savedSearches, 
    saveSearch, 
    deleteSearch, 
    loadSavedSearch,
    setDefaultSearch,
    getDefaultSearch,
    isLoading,
    isSaving 
  } = useSearch()
  
  const filteredSearches = entityType 
    ? savedSearches.filter(search => search.entityType === entityType)
    : savedSearches
  
  return {
    savedSearches: filteredSearches,
    saveSearch,
    deleteSearch,
    loadSavedSearch,
    setDefaultSearch,
    getDefaultSearch,
    isLoading,
    isSaving,
  }
}

/**
 * Hook for managing search preferences
 */
export function useSearchPreferences() {
  const { preferences, updatePreferences } = useSearch()
  
  return {
    preferences,
    updatePreferences,
  }
} 