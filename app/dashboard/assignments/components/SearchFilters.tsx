'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Grid, List } from 'lucide-react'

interface SearchFiltersProps {
  initialSearch?: string
  initialStatus?: string
  initialCategory?: string
  initialView?: 'card' | 'table'
}

export default function SearchFilters({
  initialSearch = '',
  initialStatus = 'all',
  initialCategory = 'all',
  initialView = 'card'
}: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [category, setCategory] = useState(initialCategory)
  const [view, setView] = useState(initialView)

  // Update local state when URL params change
  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    setStatus(searchParams.get('status') || 'all')
    setCategory(searchParams.get('category') || 'all')
    setView((searchParams.get('view') as 'card' | 'table') || 'card')
  }, [searchParams])

  const updateUrl = useCallback((newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update or remove params
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    const newUrl = `/dashboard/assignments?${params.toString()}`
    router.push(newUrl)
  }, [searchParams, router])

  // Debounced search update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrl({ search })
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [search, updateUrl])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl({ search, status, category })
  }

  const handleViewChange = (newView: 'card' | 'table') => {
    setView(newView)
    updateUrl({ view: newView })
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setCategory('all')
    router.push('/dashboard/assignments')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search assets by name, tag, serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Filter */}
        <Select 
          value={status} 
          onValueChange={(value) => {
            setStatus(value)
            updateUrl({ status: value })
          }}
        >
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="repair">Repair</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select 
          value={category} 
          onValueChange={(value) => {
            setCategory(value)
            updateUrl({ category: value })
          }}
        >
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
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

        {/* View Toggle */}
        <div className="flex border rounded-md">
          <Button
            type="button"
            variant={view === 'card' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => handleViewChange('card')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={view === 'table' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => handleViewChange('table')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button type="submit" className="w-full lg:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
          {(search || status !== 'all' || category !== 'all') && (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="w-full lg:w-auto"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </form>
  )
} 