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
  Users,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Filter interface
interface UserFilters {
  search?: string
  role?: string[]
  department?: string[]
  isActive?: boolean
  hasAssignments?: boolean
  lastLoginFrom?: string
  lastLoginTo?: string
  createdFrom?: string
  createdTo?: string
  employeeId?: string
}

// Saved filter interface
interface SavedUserFilter {
  id: string
  name: string
  filters: UserFilters
  createdAt: string
  isDefault?: boolean
}

interface AdvancedUserFiltersProps {
  onFiltersChange?: (filters: UserFilters) => void
  showSavedFilters?: boolean
  className?: string
}

export function AdvancedUserFilters({
  onFiltersChange,
  showSavedFilters = true,
  className
}: AdvancedUserFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<UserFilters>({})
  const [savedFilters, setSavedFilters] = useState<SavedUserFilter[]>([])
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
      const saved = JSON.parse(localStorage.getItem('savedUserFilters') || '[]')
      setSavedFilters(saved)
    } catch (error) {
      console.error('Error loading saved filters:', error)
    }
  }

  // Save filters to localStorage
  const saveFiltersToStorage = (filtersToSave: SavedUserFilter[]) => {
    try {
      localStorage.setItem('savedUserFilters', JSON.stringify(filtersToSave))
    } catch (error) {
      console.error('Error saving filters:', error)
    }
  }

  // Parse filters from URL search params
  const parseUrlFilters = (): UserFilters => {
    const params = new URLSearchParams(searchParams.toString())
    
    return {
      search: params.get('search') || undefined,
      role: params.get('role')?.split(',').filter(Boolean) || undefined,
      department: params.get('department')?.split(',').filter(Boolean) || undefined,
      isActive: params.get('isActive') === 'true' ? true : undefined,
      hasAssignments: params.get('hasAssignments') === 'true' ? true : undefined,
      lastLoginFrom: params.get('lastLoginFrom') || undefined,
      lastLoginTo: params.get('lastLoginTo') || undefined,
      createdFrom: params.get('createdFrom') || undefined,
      createdTo: params.get('createdTo') || undefined,
      employeeId: params.get('employeeId') || undefined,
    }
  }

  // Update URL with current filters
  const updateUrl = (newFilters: UserFilters) => {
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
    
    const newUrl = `/dashboard/users?${params.toString()}`
    router.push(newUrl)
  }

  // Handle filter change
  const handleFilterChange = (key: keyof UserFilters, value: any) => {
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
    const emptyFilters: UserFilters = {}
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

    const newSavedFilter: SavedUserFilter = {
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
  const loadSavedFilter = (savedFilter: SavedUserFilter) => {
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
                  placeholder="Search by name, email, employee ID..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={filters.role?.[0] || ''}
                  onValueChange={(value) => handleFilterChange('role', value ? [value] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={filters.department?.[0] || ''}
                  onValueChange={(value) => handleFilterChange('department', value ? [value] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employee ID */}
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  placeholder="Employee ID"
                  value={filters.employeeId || ''}
                  onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                />
              </div>

              {/* Last Login Range */}
              <div className="lg:col-span-2">
                <Label>Last Login Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="From"
                    value={filters.lastLoginFrom || ''}
                    onChange={(e) => handleFilterChange('lastLoginFrom', e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="To"
                    value={filters.lastLoginTo || ''}
                    onChange={(e) => handleFilterChange('lastLoginTo', e.target.value)}
                  />
                </div>
              </div>

              {/* Created Date Range */}
              <div className="lg:col-span-2">
                <Label>Created Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="From"
                    value={filters.createdFrom || ''}
                    onChange={(e) => handleFilterChange('createdFrom', e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="To"
                    value={filters.createdTo || ''}
                    onChange={(e) => handleFilterChange('createdTo', e.target.value)}
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="lg:col-span-3">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={filters.isActive || false}
                      onCheckedChange={(checked) => handleFilterChange('isActive', checked ? true : undefined)}
                    />
                    <Label htmlFor="isActive">Active Users Only</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasAssignments"
                      checked={filters.hasAssignments || false}
                      onCheckedChange={(checked) => handleFilterChange('hasAssignments', checked ? true : undefined)}
                    />
                    <Label htmlFor="hasAssignments">Users with Asset Assignments</Label>
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