'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Filter, 
  X, 
  Save, 
  Bookmark, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  Building,
  Package,
  Users,
  AlertTriangle,
  DollarSign
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Filter interface
interface AssetFilters {
  search?: string
  category?: string[]
  status?: string[]
  condition?: string[]
  manufacturer?: string
  building?: string
  floor?: string
  room?: string
  assignedTo?: string
  isAssigned?: boolean
  warrantyExpiring?: boolean
  purchaseDateFrom?: string
  purchaseDateTo?: string
  warrantyExpiryFrom?: string
  warrantyExpiryTo?: string
  priceFrom?: string
  priceTo?: string
}

// Saved filter interface
interface SavedFilter {
  id: string
  name: string
  filters: AssetFilters
  createdAt: string
  isDefault?: boolean
}

interface AdvancedAssetFiltersProps {
  onFiltersChange?: (filters: AssetFilters) => void
  showSavedFilters?: boolean
  className?: string
}

export function AdvancedAssetFilters({
  onFiltersChange,
  showSavedFilters = true,
  className
}: AdvancedAssetFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<AssetFilters>({})
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')

  // Load saved filters from localStorage on mount
  useEffect(() => {
    loadSavedFilters()
  }, [])

  // Parse filters from URL params on mount
  useEffect(() => {
    const urlFilters = parseUrlFilters()
    setFilters(urlFilters)
  }, [searchParams])

  // Load saved filters from localStorage
  const loadSavedFilters = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedAssetFilters') || '[]')
      setSavedFilters(saved)
    } catch (error) {
      console.error('Error loading saved filters:', error)
    }
  }

  // Save filters to localStorage
  const saveFiltersToStorage = (filtersToSave: SavedFilter[]) => {
    try {
      localStorage.setItem('savedAssetFilters', JSON.stringify(filtersToSave))
    } catch (error) {
      console.error('Error saving filters:', error)
    }
  }

  // Parse filters from URL search params
  const parseUrlFilters = (): AssetFilters => {
    const params = new URLSearchParams(searchParams.toString())
    
    return {
      search: params.get('search') || undefined,
      category: params.get('category')?.split(',').filter(Boolean) || undefined,
      status: params.get('status')?.split(',').filter(Boolean) || undefined,
      condition: params.get('condition')?.split(',').filter(Boolean) || undefined,
      manufacturer: params.get('manufacturer') || undefined,
      building: params.get('building') || undefined,
      floor: params.get('floor') || undefined,
      room: params.get('room') || undefined,
      assignedTo: params.get('assignedTo') || undefined,
      isAssigned: params.get('isAssigned') === 'true' ? true : undefined,
      warrantyExpiring: params.get('warrantyExpiring') === 'true' ? true : undefined,
      purchaseDateFrom: params.get('purchaseDateFrom') || undefined,
      purchaseDateTo: params.get('purchaseDateTo') || undefined,
      warrantyExpiryFrom: params.get('warrantyExpiryFrom') || undefined,
      warrantyExpiryTo: params.get('warrantyExpiryTo') || undefined,
      priceFrom: params.get('priceFrom') || undefined,
      priceTo: params.get('priceTo') || undefined,
    }
  }

  // Update URL with current filters
  const updateUrl = (newFilters: AssetFilters) => {
    const params = new URLSearchParams()
    
    // Add non-empty filters to URL
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(','))
          }
        } else {
          params.set(key, String(value))
        }
      }
    })
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    const newUrl = `/dashboard/assets?${params.toString()}`
    router.push(newUrl)
  }

  // Handle filter change
  const handleFilterChange = (key: keyof AssetFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Update URL
    updateUrl(newFilters)
    
    // Notify parent component
    if (onFiltersChange) {
      onFiltersChange(newFilters)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    const emptyFilters: AssetFilters = {}
    setFilters(emptyFilters)
    updateUrl(emptyFilters)
    
    if (onFiltersChange) {
      onFiltersChange(emptyFilters)
    }
    
    toast({
      type: "success",
      title: "Filters cleared",
      description: "All filters have been reset.",
    })
  }

  // Save current filter
  const saveCurrentFilter = () => {
    if (!saveFilterName.trim()) {
      toast({
        type: "error",
        title: "Error",
        description: "Please enter a name for the saved filter.",
      })
      return
    }

    const newSavedFilter: SavedFilter = {
      id: Date.now().toString(),
      name: saveFilterName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    }

    const updatedSavedFilters = [...savedFilters, newSavedFilter]
    setSavedFilters(updatedSavedFilters)
    saveFiltersToStorage(updatedSavedFilters)
    setShowSaveDialog(false)
    setSaveFilterName('')

    toast({
      type: "success",
      title: "Filter saved",
      description: `"${newSavedFilter.name}" has been saved.`,
    })
  }

  // Load saved filter
  const loadSavedFilter = (savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters)
    updateUrl(savedFilter.filters)
    
    if (onFiltersChange) {
      onFiltersChange(savedFilter.filters)
    }
    
    toast({
      type: "success",
      title: "Filter loaded",
      description: `"${savedFilter.name}" has been applied.`,
    })
  }

  // Delete saved filter
  const deleteSavedFilter = (filterId: string) => {
    const updatedSavedFilters = savedFilters.filter(f => f.id !== filterId)
    setSavedFilters(updatedSavedFilters)
    saveFiltersToStorage(updatedSavedFilters)
    
    toast({
      type: "success",
      title: "Filter deleted",
      description: "The saved filter has been removed.",
    })
  }

  // Set as default filter
  const setAsDefault = (filterId: string) => {
    const updatedSavedFilters = savedFilters.map(f => ({
      ...f,
      isDefault: f.id === filterId
    }))
    setSavedFilters(updatedSavedFilters)
    saveFiltersToStorage(updatedSavedFilters)
    
    toast({
      type: "success",
      title: "Default filter set",
      description: "This filter will be applied by default.",
    })
  }

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== '' && 
    (!Array.isArray(value) || value.length > 0)
  ).length

  return (
    <div className={className}>
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Advanced Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} active</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Expand
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Saved Filters */}
      {showSavedFilters && savedFilters.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map((savedFilter) => (
                <div key={savedFilter.id} className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadSavedFilter(savedFilter)}
                    className="text-xs"
                  >
                    {savedFilter.name}
                    {savedFilter.isDefault && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Default
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSavedFilter(savedFilter.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Form */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="lg:col-span-3">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name, tag, serial number..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={filters.category?.[0] || ''}
                  onValueChange={(value) => handleFilterChange('category', value ? [value] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="monitor">Monitor</SelectItem>
                    <SelectItem value="printer">Printer</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="network_device">Network Device</SelectItem>
                    <SelectItem value="software_license">Software License</SelectItem>
                    <SelectItem value="toner">Toner</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status?.[0] || ''}
                  onValueChange={(value) => handleFilterChange('status', value ? [value] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="stolen">Stolen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={filters.condition?.[0] || ''}
                  onValueChange={(value) => handleFilterChange('condition', value ? [value] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Conditions</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Manufacturer */}
              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  placeholder="e.g., Dell, HP, Apple"
                  value={filters.manufacturer || ''}
                  onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                />
              </div>

              {/* Building */}
              <div>
                <Label htmlFor="building">Building</Label>
                <Input
                  id="building"
                  placeholder="Building name"
                  value={filters.building || ''}
                  onChange={(e) => handleFilterChange('building', e.target.value)}
                />
              </div>

              {/* Floor */}
              <div>
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  placeholder="Floor number"
                  value={filters.floor || ''}
                  onChange={(e) => handleFilterChange('floor', e.target.value)}
                />
              </div>

              {/* Room */}
              <div>
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  placeholder="Room number"
                  value={filters.room || ''}
                  onChange={(e) => handleFilterChange('room', e.target.value)}
                />
              </div>

              {/* Assigned To */}
              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  placeholder="User name or email"
                  value={filters.assignedTo || ''}
                  onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                />
              </div>

              {/* Purchase Date Range */}
              <div className="lg:col-span-2">
                <Label>Purchase Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="From"
                    value={filters.purchaseDateFrom || ''}
                    onChange={(e) => handleFilterChange('purchaseDateFrom', e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="To"
                    value={filters.purchaseDateTo || ''}
                    onChange={(e) => handleFilterChange('purchaseDateTo', e.target.value)}
                  />
                </div>
              </div>

              {/* Warranty Expiry Range */}
              <div className="lg:col-span-2">
                <Label>Warranty Expiry Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="From"
                    value={filters.warrantyExpiryFrom || ''}
                    onChange={(e) => handleFilterChange('warrantyExpiryFrom', e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="To"
                    value={filters.warrantyExpiryTo || ''}
                    onChange={(e) => handleFilterChange('warrantyExpiryTo', e.target.value)}
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className="lg:col-span-2">
                <Label>Price Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={filters.priceFrom || ''}
                    onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={filters.priceTo || ''}
                    onChange={(e) => handleFilterChange('priceTo', e.target.value)}
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="lg:col-span-3">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isAssigned"
                      checked={filters.isAssigned || false}
                      onCheckedChange={(checked) => handleFilterChange('isAssigned', checked ? true : undefined)}
                    />
                    <Label htmlFor="isAssigned">Assigned Assets Only</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="warrantyExpiring"
                      checked={filters.warrantyExpiring || false}
                      onCheckedChange={(checked) => handleFilterChange('warrantyExpiring', checked ? true : undefined)}
                    />
                    <Label htmlFor="warrantyExpiring">Warranty Expiring Soon</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Filter Button */}
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
                disabled={activeFilterCount === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      </Collapsible>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Save Filter</CardTitle>
            <CardDescription>
              Give this filter combination a name to save it for later use.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Filter name"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveCurrentFilter()
                  }
                }}
              />
              <Button onClick={saveCurrentFilter}>Save</Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 