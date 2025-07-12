/**
 * Search Persistence Utilities
 * 
 * This module provides utilities for persisting search states, filters, and preferences
 * across browser sessions using localStorage with proper error handling and type safety.
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface SearchState {
  query: string
  filters: Record<string, any>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  view?: 'table' | 'card' | 'list'
  timestamp: number
}

export interface SavedSearch {
  id: string
  name: string
  entityType: 'assets' | 'users' | 'assignments' | 'maintenance'
  searchState: SearchState
  isDefault?: boolean
  createdAt: string
  lastUsed?: string
}

export interface SearchPreferences {
  autoSave: boolean
  maxSavedSearches: number
  defaultView: 'table' | 'card' | 'list'
  debounceDelay: number
  showSuggestions: boolean
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  SAVED_SEARCHES: 'it_inventory_saved_searches',
  SEARCH_PREFERENCES: 'it_inventory_search_preferences',
  RECENT_SEARCHES: 'it_inventory_recent_searches',
  CURRENT_SEARCH_STATE: 'it_inventory_current_search_state',
} as const

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_PREFERENCES: SearchPreferences = {
  autoSave: true,
  maxSavedSearches: 10,
  defaultView: 'table',
  debounceDelay: 300,
  showSuggestions: true,
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safe localStorage operations with error handling
 */
class SafeStorage {
  static isAvailable(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  static get(key: string): string | null {
    if (!this.isAvailable()) return null
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error)
      return null
    }
  }

  static set(key: string, value: string): boolean {
    if (!this.isAvailable()) return false
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error)
      return false
    }
  }

  static remove(key: string): boolean {
    if (!this.isAvailable()) return false
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error)
      return false
    }
  }
}

// ============================================================================
// SEARCH PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Save search state for a specific entity type
 */
export function saveSearchState(
  entityType: string,
  searchState: Partial<SearchState>
): boolean {
  try {
    const key = `${STORAGE_KEYS.CURRENT_SEARCH_STATE}_${entityType}`
    const fullState: SearchState = {
      query: searchState.query || '',
      filters: searchState.filters || {},
      sortBy: searchState.sortBy,
      sortOrder: searchState.sortOrder,
      page: searchState.page,
      view: searchState.view,
      timestamp: Date.now(),
    }
    
    return SafeStorage.set(key, JSON.stringify(fullState))
  } catch (error) {
    console.error('Error saving search state:', error)
    return false
  }
}

/**
 * Load search state for a specific entity type
 */
export function loadSearchState(entityType: string): SearchState | null {
  try {
    const key = `${STORAGE_KEYS.CURRENT_SEARCH_STATE}_${entityType}`
    const data = SafeStorage.get(key)
    
    if (!data) return null
    
    const state = JSON.parse(data) as SearchState
    
    // Validate the loaded state
    if (typeof state !== 'object' || !state) return null
    
    return {
      query: state.query || '',
      filters: state.filters || {},
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      page: state.page,
      view: state.view,
      timestamp: state.timestamp || Date.now(),
    }
  } catch (error) {
    console.error('Error loading search state:', error)
    return null
  }
}

/**
 * Save a named search for later use
 */
export function saveNamedSearch(
  name: string,
  entityType: SavedSearch['entityType'],
  searchState: SearchState
): boolean {
  try {
    const savedSearches = loadSavedSearches()
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      entityType,
      searchState,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    }
    
    // Remove existing search with same name for this entity type
    const filteredSearches = savedSearches.filter(
      search => !(search.name === name && search.entityType === entityType)
    )
    
    // Add new search and limit total count
    const preferences = loadSearchPreferences()
    const updatedSearches = [newSearch, ...filteredSearches].slice(0, preferences.maxSavedSearches)
    
    return SafeStorage.set(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updatedSearches))
  } catch (error) {
    console.error('Error saving named search:', error)
    return false
  }
}

/**
 * Load all saved searches
 */
export function loadSavedSearches(): SavedSearch[] {
  try {
    const data = SafeStorage.get(STORAGE_KEYS.SAVED_SEARCHES)
    if (!data) return []
    
    const searches = JSON.parse(data) as SavedSearch[]
    return Array.isArray(searches) ? searches : []
  } catch (error) {
    console.error('Error loading saved searches:', error)
    return []
  }
}

/**
 * Load saved searches for a specific entity type
 */
export function loadSavedSearchesByType(entityType: SavedSearch['entityType']): SavedSearch[] {
  const allSearches = loadSavedSearches()
  return allSearches.filter(search => search.entityType === entityType)
}

/**
 * Delete a saved search
 */
export function deleteSavedSearch(searchId: string): boolean {
  try {
    const savedSearches = loadSavedSearches()
    const updatedSearches = savedSearches.filter(search => search.id !== searchId)
    
    return SafeStorage.set(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updatedSearches))
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return false
  }
}

/**
 * Update last used timestamp for a saved search
 */
export function updateSavedSearchUsage(searchId: string): boolean {
  try {
    const savedSearches = loadSavedSearches()
    const updatedSearches = savedSearches.map(search => 
      search.id === searchId 
        ? { ...search, lastUsed: new Date().toISOString() }
        : search
    )
    
    return SafeStorage.set(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updatedSearches))
  } catch (error) {
    console.error('Error updating saved search usage:', error)
    return false
  }
}

/**
 * Set a saved search as default for its entity type
 */
export function setDefaultSearch(searchId: string): boolean {
  try {
    const savedSearches = loadSavedSearches()
    const targetSearch = savedSearches.find(search => search.id === searchId)
    
    if (!targetSearch) return false
    
    const updatedSearches = savedSearches.map(search => ({
      ...search,
      isDefault: search.id === searchId && search.entityType === targetSearch.entityType
    }))
    
    return SafeStorage.set(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updatedSearches))
  } catch (error) {
    console.error('Error setting default search:', error)
    return false
  }
}

/**
 * Get default search for an entity type
 */
export function getDefaultSearch(entityType: SavedSearch['entityType']): SavedSearch | null {
  const savedSearches = loadSavedSearches()
  return savedSearches.find(search => 
    search.entityType === entityType && search.isDefault
  ) || null
}

// ============================================================================
// RECENT SEARCHES
// ============================================================================

/**
 * Add a search term to recent searches
 */
export function addRecentSearch(term: string, entityType: string): boolean {
  try {
    const key = `${STORAGE_KEYS.RECENT_SEARCHES}_${entityType}`
    const recentSearches = loadRecentSearches(entityType)
    
    // Remove existing occurrence and add to front
    const filteredSearches = recentSearches.filter(search => search !== term)
    const updatedSearches = [term, ...filteredSearches].slice(0, 10)
    
    return SafeStorage.set(key, JSON.stringify(updatedSearches))
  } catch (error) {
    console.error('Error adding recent search:', error)
    return false
  }
}

/**
 * Load recent searches for an entity type
 */
export function loadRecentSearches(entityType: string): string[] {
  try {
    const key = `${STORAGE_KEYS.RECENT_SEARCHES}_${entityType}`
    const data = SafeStorage.get(key)
    
    if (!data) return []
    
    const searches = JSON.parse(data) as string[]
    return Array.isArray(searches) ? searches : []
  } catch (error) {
    console.error('Error loading recent searches:', error)
    return []
  }
}

/**
 * Clear recent searches for an entity type
 */
export function clearRecentSearches(entityType: string): boolean {
  const key = `${STORAGE_KEYS.RECENT_SEARCHES}_${entityType}`
  return SafeStorage.remove(key)
}

// ============================================================================
// SEARCH PREFERENCES
// ============================================================================

/**
 * Load search preferences
 */
export function loadSearchPreferences(): SearchPreferences {
  try {
    const data = SafeStorage.get(STORAGE_KEYS.SEARCH_PREFERENCES)
    
    if (!data) {
      // Save default preferences
      saveSearchPreferences(DEFAULT_PREFERENCES)
      return DEFAULT_PREFERENCES
    }
    
    const preferences = JSON.parse(data) as SearchPreferences
    
    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_PREFERENCES, ...preferences }
  } catch (error) {
    console.error('Error loading search preferences:', error)
    return DEFAULT_PREFERENCES
  }
}

/**
 * Save search preferences
 */
export function saveSearchPreferences(preferences: Partial<SearchPreferences>): boolean {
  try {
    const currentPreferences = loadSearchPreferences()
    const updatedPreferences = { ...currentPreferences, ...preferences }
    
    return SafeStorage.set(STORAGE_KEYS.SEARCH_PREFERENCES, JSON.stringify(updatedPreferences))
  } catch (error) {
    console.error('Error saving search preferences:', error)
    return false
  }
}

/**
 * Reset search preferences to defaults
 */
export function resetSearchPreferences(): boolean {
  return saveSearchPreferences(DEFAULT_PREFERENCES)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all search-related data
 */
export function clearAllSearchData(): boolean {
  try {
    const keys = Object.values(STORAGE_KEYS)
    let success = true
    
    keys.forEach(key => {
      if (!SafeStorage.remove(key)) {
        success = false
      }
    })
    
    return success
  } catch (error) {
    console.error('Error clearing search data:', error)
    return false
  }
}

/**
 * Export search data for backup
 */
export function exportSearchData(): string {
  try {
    const data = {
      savedSearches: loadSavedSearches(),
      preferences: loadSearchPreferences(),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
    
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('Error exporting search data:', error)
    return ''
  }
}

/**
 * Import search data from backup
 */
export function importSearchData(backupData: string): boolean {
  try {
    const data = JSON.parse(backupData)
    
    if (data.savedSearches) {
      SafeStorage.set(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(data.savedSearches))
    }
    
    if (data.preferences) {
      SafeStorage.set(STORAGE_KEYS.SEARCH_PREFERENCES, JSON.stringify(data.preferences))
    }
    
    return true
  } catch (error) {
    console.error('Error importing search data:', error)
    return false
  }
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
  totalSize: number
  itemCount: number
  available: boolean
} {
  try {
    if (!SafeStorage.isAvailable()) {
      return { totalSize: 0, itemCount: 0, available: false }
    }
    
    let totalSize = 0
    let itemCount = 0
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const value = localStorage.getItem(key)
      if (value) {
        totalSize += key.length + value.length
        itemCount++
      }
    })
    
    return { totalSize, itemCount, available: true }
  } catch (error) {
    console.error('Error getting storage stats:', error)
    return { totalSize: 0, itemCount: 0, available: false }
  }
} 