# Advanced Search & Filtering System

This document provides comprehensive documentation for the advanced search and filtering functionality implemented in the IT Inventory Management System.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Global Search](#global-search)
3. [Advanced Filters](#advanced-filters)
4. [Search Persistence](#search-persistence)
5. [Search Context & Hooks](#search-context--hooks)
6. [API Integration](#api-integration)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)
9. [Performance Considerations](#performance-considerations)

## 🎯 Overview

The search and filtering system provides:

- **Global Search**: Cross-entity search with auto-complete
- **Advanced Filters**: Multi-criteria filtering for assets and users
- **Saved Searches**: Save and reuse complex filter combinations
- **Search Persistence**: Filters and search states persist across sessions
- **Real-time Search**: Debounced search with instant results
- **Search History**: Recent searches and popular terms

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GlobalSearch  │    │ AdvancedFilters  │    │ SearchContext   │
│   Component     │    │   Components     │    │   Provider      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  useDebounce    │    │ SearchPersistence│    │  Custom Hooks   │
│     Hooks       │    │    Utilities     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔍 Global Search

### Basic Usage

```tsx
import { GlobalSearch } from '@/components/search/GlobalSearch'

function MyComponent() {
  return (
    <GlobalSearch 
      placeholder="Search assets, users, assignments..."
      showSuggestions={true}
      maxResults={8}
      onSearch={(query) => {
        console.log('Search query:', query)
      }}
    />
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `"Search assets, users, assignments..."` | Placeholder text for search input |
| `showSuggestions` | `boolean` | `true` | Whether to show search suggestions |
| `maxResults` | `number` | `8` | Maximum number of results to display |
| `onSearch` | `(query: string) => void` | `undefined` | Callback when search is performed |
| `className` | `string` | `undefined` | Additional CSS classes |

### Features

#### Auto-complete
- **Recent Searches**: Last 10 search terms used
- **Popular Terms**: Predefined popular search terms
- **Smart Suggestions**: Context-aware suggestions

#### Keyboard Navigation
- **Arrow Keys**: Navigate through results
- **Enter**: Select highlighted result or perform search
- **Escape**: Close search dropdown
- **Tab**: Focus management

#### Real-time Search
- **Debounced Input**: 300ms delay to avoid excessive API calls
- **Loading States**: Visual feedback during search
- **Error Handling**: Graceful error handling with fallbacks

### Search Results

The global search returns results from multiple entities:

```typescript
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
```

## 🔧 Advanced Filters

### Asset Filters

```tsx
import { AdvancedAssetFilters } from '@/components/search/AdvancedAssetFilters'

function AssetsPage() {
  return (
    <AdvancedAssetFilters 
      onFiltersChange={(filters) => {
        // Handle filter changes
        console.log('Asset filters:', filters)
      }}
      showSavedFilters={true}
    />
  )
}
```

#### Available Filters

| Filter | Type | Description |
|--------|------|-------------|
| `search` | `string` | Search by name, tag, serial number, manufacturer, model |
| `category` | `string[]` | Filter by asset category (laptop, desktop, etc.) |
| `status` | `string[]` | Filter by asset status (available, assigned, etc.) |
| `condition` | `string[]` | Filter by asset condition (new, excellent, etc.) |
| `manufacturer` | `string` | Filter by manufacturer |
| `building` | `string` | Filter by building location |
| `floor` | `string` | Filter by floor |
| `room` | `string` | Filter by room |
| `assignedTo` | `string` | Filter by assigned user |
| `isAssigned` | `boolean` | Filter assigned/unassigned assets |
| `warrantyExpiring` | `boolean` | Filter assets with expiring warranty |
| `purchaseDateFrom` | `string` | Filter by purchase date range (start) |
| `purchaseDateTo` | `string` | Filter by purchase date range (end) |
| `warrantyExpiryFrom` | `string` | Filter by warranty expiry range (start) |
| `warrantyExpiryTo` | `string` | Filter by warranty expiry range (end) |
| `priceFrom` | `string` | Filter by price range (minimum) |
| `priceTo` | `string` | Filter by price range (maximum) |

### User Filters

```tsx
import { AdvancedUserFilters } from '@/components/search/AdvancedUserFilters'

function UsersPage() {
  return (
    <AdvancedUserFilters 
      onFiltersChange={(filters) => {
        // Handle filter changes
        console.log('User filters:', filters)
      }}
      showSavedFilters={true}
    />
  )
}
```

#### Available Filters

| Filter | Type | Description |
|--------|------|-------------|
| `search` | `string` | Search by name, email, employee ID, department |
| `role` | `string[]` | Filter by user role (admin, manager, user, etc.) |
| `department` | `string[]` | Filter by department |
| `isActive` | `boolean` | Filter active/inactive users |
| `hasAssignments` | `boolean` | Filter users with/without asset assignments |
| `lastLoginFrom` | `string` | Filter by last login date range (start) |
| `lastLoginTo` | `string` | Filter by last login date range (end) |
| `createdFrom` | `string` | Filter by created date range (start) |
| `createdTo` | `string` | Filter by created date range (end) |
| `employeeId` | `string` | Filter by employee ID |

## 💾 Search Persistence

### Overview

The search persistence system automatically saves and restores:

- Current search state per entity type
- Saved filter combinations with names
- Recent search terms (last 10)
- Search preferences (debounce delay, default view)
- Cross-session persistence using localStorage

### Usage

```tsx
import { 
  saveSearchState, 
  loadSearchState, 
  saveNamedSearch,
  loadSavedSearches 
} from '@/lib/search-persistence'

// Save current search state
saveSearchState('assets', {
  query: 'laptop',
  filters: { category: ['laptop'], status: ['available'] },
  sortBy: 'name',
  sortOrder: 'asc'
})

// Load saved search state
const savedState = loadSearchState('assets')

// Save a named search
saveNamedSearch('My Laptop Search', 'assets', {
  query: 'laptop',
  filters: { category: ['laptop'] },
  timestamp: Date.now()
})

// Load all saved searches
const savedSearches = loadSavedSearches()
```

### Storage Keys

The system uses the following localStorage keys:

- `it_inventory_saved_searches` - Saved filter combinations
- `it_inventory_search_preferences` - User preferences
- `it_inventory_recent_searches_[entityType]` - Recent searches per entity
- `it_inventory_current_search_state_[entityType]` - Current search state per entity

## 🎣 Search Context & Hooks

### SearchProvider

Wrap your app with the SearchProvider:

```tsx
import { SearchProvider } from '@/contexts/SearchContext'

function App() {
  return (
    <SearchProvider>
      <YourApp />
    </SearchProvider>
  )
}
```

### useSearch Hook

```tsx
import { useSearch } from '@/contexts/SearchContext'

function MyComponent() {
  const { 
    currentSearches,
    savedSearches,
    setCurrentSearch,
    saveSearch,
    deleteSearch 
  } = useSearch()

  // Use the search functionality
}
```

### Specialized Hooks

#### useEntitySearch

```tsx
import { useEntitySearch } from '@/contexts/SearchContext'

function AssetsPage() {
  const { 
    currentSearch, 
    recentSearches, 
    updateSearch, 
    clearSearch, 
    addRecent 
  } = useEntitySearch('assets')

  return (
    <div>
      <input 
        value={currentSearch?.query || ''}
        onChange={(e) => updateSearch({ query: e.target.value })}
      />
      <button onClick={clearSearch}>Clear</button>
    </div>
  )
}
```

#### useSavedSearches

```tsx
import { useSavedSearches } from '@/contexts/SearchContext'

function SavedSearchesList() {
  const { 
    savedSearches, 
    saveSearch, 
    deleteSearch, 
    setDefaultSearch 
  } = useSavedSearches('assets')

  return (
    <div>
      {savedSearches.map(search => (
        <div key={search.id}>
          <span>{search.name}</span>
          <button onClick={() => deleteSearch(search.id)}>Delete</button>
          <button onClick={() => setDefaultSearch(search.id)}>Set Default</button>
        </div>
      ))}
    </div>
  )
}
```

#### useSearchPreferences

```tsx
import { useSearchPreferences } from '@/contexts/SearchContext'

function SearchSettings() {
  const { preferences, updatePreferences } = useSearchPreferences()

  return (
    <div>
      <label>
        Debounce Delay:
        <input 
          type="number"
          value={preferences.debounceDelay}
          onChange={(e) => updatePreferences({ 
            debounceDelay: parseInt(e.target.value) 
          })}
        />
      </label>
    </div>
  )
}
```

## 🔌 API Integration

### Search Endpoints

The system integrates with existing API endpoints:

#### Assets API
```typescript
// GET /api/assets
interface AssetFilters {
  search?: string
  category?: string[]
  status?: string[]
  condition?: string[]
  manufacturer?: string
  building?: string
  assignedTo?: string
  warrantyExpiring?: boolean
  purchaseDateFrom?: string
  purchaseDateTo?: string
  priceFrom?: string
  priceTo?: string
}
```

#### Users API
```typescript
// GET /api/users
interface UserFilters {
  search?: string
  role?: string[]
  department?: string[]
  isActive?: boolean
  hasAssignments?: boolean
  lastLoginFrom?: string
  lastLoginTo?: string
}
```

#### Assignments API
```typescript
// GET /api/assignments
interface AssignmentFilters {
  search?: string
  status?: string[]
  assignedTo?: string
  assignedFrom?: string
  assignedTo?: string
}
```

### URL Integration

Filters are automatically synced with URL parameters:

```typescript
// URL: /dashboard/assets?search=laptop&category=laptop&status=available
const filters = {
  search: 'laptop',
  category: ['laptop'],
  status: ['available']
}
```

## 🎨 Customization

### Custom Search Components

Create custom search components by extending the base functionality:

```tsx
import { useDebouncedSearch } from '@/hooks/use-debounce'
import { useEntitySearch } from '@/contexts/SearchContext'

function CustomAssetSearch() {
  const { debouncedSearchTerm, isSearching } = useDebouncedSearch(searchTerm, 300)
  const { updateSearch } = useEntitySearch('assets')

  // Custom search logic
  return (
    <div>
      {/* Custom search UI */}
    </div>
  )
}
```

### Custom Filter Components

```tsx
function CustomFilter({ onFilterChange }) {
  const [filters, setFilters] = useState({})

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div>
      {/* Custom filter UI */}
    </div>
  )
}
```

### Styling Customization

All components use Tailwind CSS classes and can be customized:

```tsx
<GlobalSearch 
  className="custom-search-styles"
  placeholder="Custom placeholder"
/>
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Search Not Working

**Problem**: Global search returns no results

**Solution**:
```typescript
// Check if API endpoints are working
const response = await fetch('/api/assets?search=test')
const data = await response.json()
console.log('API response:', data)
```

#### 2. Filters Not Persisting

**Problem**: Filters reset when navigating

**Solution**:
```typescript
// Ensure SearchProvider is wrapping your app
import { SearchProvider } from '@/contexts/SearchContext'

// Check localStorage
console.log('Saved searches:', localStorage.getItem('it_inventory_saved_searches'))
```

#### 3. Performance Issues

**Problem**: Search is slow or unresponsive

**Solution**:
```typescript
// Increase debounce delay
const { debouncedSearchTerm } = useDebouncedSearch(searchTerm, 500)

// Limit search results
<GlobalSearch maxResults={5} />
```

#### 4. TypeScript Errors

**Problem**: Type errors in search components

**Solution**:
```typescript
// Ensure proper types are imported
import type { SearchState, SavedSearch } from '@/lib/search-persistence'

// Use proper type annotations
const searchState: SearchState = {
  query: '',
  filters: {},
  timestamp: Date.now()
}
```

### Debug Mode

Enable debug mode to see search operations:

```typescript
// Add to your component
useEffect(() => {
  console.log('Current search state:', currentSearch)
  console.log('Saved searches:', savedSearches)
}, [currentSearch, savedSearches])
```

## ⚡ Performance Considerations

### Optimization Tips

1. **Debounce Search**: Use appropriate debounce delays (300-500ms)
2. **Limit Results**: Set reasonable maxResults limits
3. **Lazy Loading**: Load search suggestions on demand
4. **Caching**: Cache search results when appropriate
5. **Indexing**: Ensure database indexes on searchable fields

### Memory Management

```typescript
// Clean up saved searches periodically
const cleanupOldSearches = () => {
  const savedSearches = loadSavedSearches()
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  
  const filteredSearches = savedSearches.filter(search => 
    new Date(search.lastUsed || search.createdAt).getTime() > thirtyDaysAgo
  )
  
  saveFiltersToStorage(filteredSearches)
}
```

### Bundle Size

The search system is designed to be tree-shakeable:

```typescript
// Only import what you need
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { useDebounce } from '@/hooks/use-debounce'
```

## 📚 Examples

### Complete Search Implementation

```tsx
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { AdvancedAssetFilters } from '@/components/search/AdvancedAssetFilters'
import { useEntitySearch } from '@/contexts/SearchContext'

function AssetsPage() {
  const { currentSearch, updateSearch } = useEntitySearch('assets')

  return (
    <div>
      <GlobalSearch 
        placeholder="Search assets..."
        onSearch={(query) => updateSearch({ query })}
      />
      
      <AdvancedAssetFilters 
        onFiltersChange={(filters) => updateSearch({ filters })}
        showSavedFilters={true}
      />
      
      {/* Asset list with current search applied */}
    </div>
  )
}
```

### Custom Search Hook

```tsx
import { useDebouncedSearch } from '@/hooks/use-debounce'
import { useEntitySearch } from '@/contexts/SearchContext'

function useAssetSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const { debouncedSearchTerm, isSearching } = useDebouncedSearch(searchTerm, 300)
  const { updateSearch, addRecent } = useEntitySearch('assets')

  const performSearch = useCallback(async (query: string) => {
    try {
      const response = await fetch(`/api/assets?search=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (query.trim()) {
        addRecent(query)
      }
      
      return data
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  }, [addRecent])

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    performSearch
  }
}
```

## 🤝 Contributing

When contributing to the search system:

1. **Follow TypeScript conventions**
2. **Add proper error handling**
3. **Include performance considerations**
4. **Update documentation**
5. **Add tests for new functionality**

## 📄 License

This search and filtering system is part of the IT Inventory Management System and follows the same license terms. 