'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { bulkImportSchema, type BulkImport } from '@/lib/validations'
import { useToast } from '@/hooks/use-toast'
import { 
  Loader2, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  X,
  Settings,
  Info
} from 'lucide-react'

interface ImportResult {
  success: boolean
  totalRows: number
  processedRows: number
  successRows: number
  errorRows: number
  errors?: Array<{
    row: number
    field?: string
    message: string
    data?: any
  }>
  warnings?: Array<{
    row: number
    field?: string
    message: string
  }>
}

interface BulkImportFormProps {
  onSubmit: (data: BulkImport) => Promise<ImportResult>
  onCancel?: () => void
  isLoading?: boolean
}

export function BulkImportForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: BulkImportFormProps) {
  const { toast } = useToast()
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<BulkImport>({
    resolver: zodResolver(bulkImportSchema),
    defaultValues: {
      entityType: 'assets',
      hasHeaders: true,
      delimiter: ',',
      updateExisting: false,
      skipErrors: false,
    },
  })

  /**
   * Handles file selection and validation
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          type: 'error',
          title: 'Invalid file type',
          description: 'Please select a CSV or Excel file',
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          type: 'error',
          title: 'File too large',
          description: 'Please select a file smaller than 10MB',
        })
        return
      }

      form.setValue('file', file)
      toast({
        type: 'success',
        title: 'File selected',
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      })
    }
  }

  /**
   * Handles form submission with progress tracking
   */
  const handleSubmit = async (data: BulkImport) => {
    try {
      setUploadProgress(0)
      setImportResult(null)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await onSubmit(data)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setImportResult(result)

      if (result.success) {
        toast({
          type: 'success',
          title: 'Import completed',
          description: `Successfully imported ${result.successRows} of ${result.totalRows} records`,
        })
      } else {
        toast({
          type: 'error',
          title: 'Import failed',
          description: `Failed to import ${result.errorRows} records. Check the errors below.`,
        })
      }
    } catch (error) {
      console.error('Bulk import error:', error)
      toast({
        type: 'error',
        title: 'Import error',
        description: error instanceof Error ? error.message : 'Failed to import data',
      })
    }
  }

  /**
   * Downloads a sample template for the selected entity type
   */
  const downloadTemplate = () => {
    const entityType = form.watch('entityType')
    const delimiter = form.watch('delimiter')
    
    let headers = ''
    let sampleData = ''
    
    switch (entityType) {
      case 'assets':
        headers = 'assetTag,name,category,subcategory,serialNumber,model,manufacturer,status,condition,purchaseDate,purchasePrice,warrantyExpiry,building,floor,room,desk,description,notes'
        sampleData = 'IT-0001,Dell Latitude 5520,laptop,business,SN123456789,Latitude 5520,Dell,available,good,2024-01-15,3500.00,2027-01-15,Main Building,2nd,201,Desk A1,High-performance business laptop,Assigned to IT department'
        break
      case 'users':
        headers = 'name,email,department,jobTitle,employeeId,phone,role,isActive'
        sampleData = 'John Doe,john.doe@company.com,IT,Software Engineer,EMP001,+966501234567,user,true'
        break
      case 'assignments':
        headers = 'assetTag,userEmail,purpose,expectedReturnAt,notes'
        sampleData = 'IT-0001,john.doe@company.com,Work from home setup,2024-12-31,WFH assignment for remote work'
        break
    }

    const csvContent = `${headers}\n${sampleData}`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entityType}_template.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Import Data
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Import multiple records from a CSV or Excel file. Download a template to see the required format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">File Upload</h3>
              <Separator />
              
              <div className="space-y-4">
                {/* File Input */}
                <div className="space-y-2">
                  <Label htmlFor="file">Select File *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to select or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      CSV or Excel files up to 10MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4"
                    >
                      Choose File
                    </Button>
                  </div>
                  {form.watch('file') && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        {form.watch('file')?.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => form.setValue('file', null as any)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Template Download */}
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <div className="text-sm text-gray-600">
                    Get a sample file with the correct format and headers
                  </div>
                </div>
              </div>
            </div>

            {/* Import Settings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Import Settings
              </h3>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entity Type */}
                <div className="space-y-2">
                  <Label htmlFor="entityType">Data Type *</Label>
                  <Select
                    value={form.watch('entityType')}
                    onValueChange={(value) => form.setValue('entityType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assets">Assets</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                      <SelectItem value="assignments">Assignments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Delimiter */}
                <div className="space-y-2">
                  <Label htmlFor="delimiter">CSV Delimiter</Label>
                  <Select
                    value={form.watch('delimiter')}
                    onValueChange={(value) => form.setValue('delimiter', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select delimiter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Comma (,)</SelectItem>
                      <SelectItem value=";">Semicolon (;)</SelectItem>
                      <SelectItem value="\t">Tab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Has Headers */}
                <div className="space-y-2">
                  <Label htmlFor="hasHeaders">File Has Headers</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasHeaders"
                      checked={form.watch('hasHeaders')}
                      onCheckedChange={(checked: boolean) => form.setValue('hasHeaders', checked)}
                    />
                    <Label htmlFor="hasHeaders" className="text-sm">
                      First row contains column headers
                    </Label>
                  </div>
                </div>

                {/* Update Existing */}
                <div className="space-y-2">
                  <Label htmlFor="updateExisting">Update Existing Records</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="updateExisting"
                      checked={form.watch('updateExisting')}
                      onCheckedChange={(checked: boolean) => form.setValue('updateExisting', checked)}
                    />
                    <Label htmlFor="updateExisting" className="text-sm">
                      Update existing records instead of creating new ones
                    </Label>
                  </div>
                </div>

                {/* Skip Errors */}
                <div className="space-y-2">
                  <Label htmlFor="skipErrors">Skip Error Rows</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="skipErrors"
                      checked={form.watch('skipErrors')}
                      onCheckedChange={(checked: boolean) => form.setValue('skipErrors', checked)}
                    />
                    <Label htmlFor="skipErrors" className="text-sm">
                      Continue importing even if some rows have errors
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isLoading || !form.watch('file')}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isLoading ? 'Importing...' : 'Start Import'}
          </Button>
        </div>
      </form>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{importResult.totalRows}</p>
                <p className="text-sm text-gray-600">Total Rows</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{importResult.successRows}</p>
                <p className="text-sm text-green-600">Successful</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{importResult.errorRows}</p>
                <p className="text-sm text-red-600">Errors</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{importResult.processedRows}</p>
                <p className="text-sm text-blue-600">Processed</p>
              </div>
            </div>

            {/* Errors */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-800">Errors</h4>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="p-3 border-b last:border-b-0">
                      <p className="text-sm font-medium">
                        Row {error.row}: {error.field && `${error.field} - `}{error.message}
                      </p>
                      {error.data && (
                        <p className="text-xs text-gray-600 mt-1">
                          Data: {JSON.stringify(error.data)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {importResult.warnings && importResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-800">Warnings</h4>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {importResult.warnings.map((warning, index) => (
                    <div key={index} className="p-3 border-b last:border-b-0">
                      <p className="text-sm">
                        Row {warning.row}: {warning.field && `${warning.field} - `}{warning.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 