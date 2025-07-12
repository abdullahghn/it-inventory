'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearchPreferences } from '@/contexts/SearchContext'
import { useToast } from '@/hooks/use-toast'
import { Settings, Save, RotateCcw } from 'lucide-react'

interface SearchPreferencesProps {
  className?: string
}

export function SearchPreferences({ className }: SearchPreferencesProps) {
  const { preferences, updatePreferences } = useSearchPreferences()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  // Local state for form values
  const [localPreferences, setLocalPreferences] = useState({
    autoSave: preferences.autoSave,
    maxSavedSearches: preferences.maxSavedSearches,
    defaultView: preferences.defaultView,
    debounceDelay: preferences.debounceDelay,
    showSuggestions: preferences.showSuggestions,
  })

  // Handle preference change
  const handlePreferenceChange = (key: keyof typeof localPreferences, value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Save preferences
  const savePreferences = () => {
    updatePreferences(localPreferences)
    toast({
      type: "success",
      title: "Preferences saved",
      description: "Your search preferences have been updated.",
    })
  }

  // Reset to defaults
  const resetPreferences = () => {
    const defaultPreferences = {
      autoSave: true,
      maxSavedSearches: 10,
      defaultView: 'table' as const,
      debounceDelay: 300,
      showSuggestions: true,
    }
    
    setLocalPreferences(defaultPreferences)
    updatePreferences(defaultPreferences)
    
    toast({
      type: "success",
      title: "Preferences reset",
      description: "Search preferences have been reset to defaults.",
    })
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        Search Preferences
      </Button>

      {isOpen && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Search Preferences
            </CardTitle>
            <CardDescription>
              Customize your search experience and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto-save Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Auto-save Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSave">Auto-save searches</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save search terms to recent searches
                  </p>
                </div>
                <Switch
                  id="autoSave"
                  checked={localPreferences.autoSave}
                  onCheckedChange={(checked) => handlePreferenceChange('autoSave', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSavedSearches">Maximum saved searches</Label>
                <Select
                  value={localPreferences.maxSavedSearches.toString()}
                  onValueChange={(value) => handlePreferenceChange('maxSavedSearches', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 searches</SelectItem>
                    <SelectItem value="10">10 searches</SelectItem>
                    <SelectItem value="15">15 searches</SelectItem>
                    <SelectItem value="20">20 searches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Display Settings</h4>
              
              <div className="space-y-2">
                <Label htmlFor="defaultView">Default view</Label>
                <Select
                  value={localPreferences.defaultView}
                  onValueChange={(value) => handlePreferenceChange('defaultView', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Table view</SelectItem>
                    <SelectItem value="card">Card view</SelectItem>
                    <SelectItem value="list">List view</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showSuggestions">Show search suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Display recent searches and popular terms
                  </p>
                </div>
                <Switch
                  id="showSuggestions"
                  checked={localPreferences.showSuggestions}
                  onCheckedChange={(checked) => handlePreferenceChange('showSuggestions', checked)}
                />
              </div>
            </div>

            {/* Performance Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Performance Settings</h4>
              
              <div className="space-y-2">
                <Label htmlFor="debounceDelay">Search debounce delay (ms)</Label>
                <Input
                  id="debounceDelay"
                  type="number"
                  min="100"
                  max="1000"
                  step="50"
                  value={localPreferences.debounceDelay}
                  onChange={(e) => handlePreferenceChange('debounceDelay', parseInt(e.target.value))}
                  className="w-32"
                />
                <p className="text-sm text-muted-foreground">
                  Lower values = faster search, higher values = fewer API calls
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={resetPreferences}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={savePreferences}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 