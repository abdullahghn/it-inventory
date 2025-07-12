'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, FileText, Users, Package, Link, Download, AlertTriangle, CheckCircle } from 'lucide-react'

const importSchema = z.object({
  importType: z.enum(['assets', 'users', 'assignments']),
  file: z.instanceof(File).refine((file) => file.size > 0, 'File is required'),
  hasHeaders: z.boolean().default(true),
  skipErrors: z.boolean().default(false),
  notes: z.string().optional(),
})

type ImportFormData = z.infer<typeof importSchema>

interface ImportResult {
  success: boolean
  message: string
  totalRows: number
  importedRows: number
  failedRows: number
  errors: string[]
}

export function BulkImportForm() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<any>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      importType: 'assets',
      hasHeaders: true,
      skipErrors: false,
    },
  })

  const importType = watch('importType')

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setValue('file', file)
    setPreviewData([])
    setImportResult(null)

    // Preview the file content
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const preview = lines.slice(0, 5) // Show first 5 lines
      setPreviewData(preview.map(line => line.split(',')))
    } catch (error) {
      console.error('Error reading file:', error)
    }
  }

  const onSubmit = async (data: any) => {
    setIsUploading(true)
    setUploadProgress(0)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('importType', data.importType)
      formData.append('hasHeaders', data.hasHeaders.toString())
      formData.append('skipErrors', data.skipErrors.toString())
      if (data.notes) {
        formData.append('notes', data.notes)
      }

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Import failed')
      }

      const result: ImportResult = await response.json()
      setImportResult(result)

      if (result.success) {
        toast({
          type: 'success',
          title: 'Import Successful',
          description: `Imported ${result.importedRows} out of ${result.totalRows} records`,
        })
      } else {
        toast({
          type: 'error',
          title: 'Import Completed with Errors',
          description: `${result.failedRows} records failed to import`,
        })
      }
    } catch (error: any) {
      toast({
        type: 'error',
        title: 'Import Failed',
        description: error.message || 'Failed to import data',
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(100)
    }
  }

  const downloadTemplate = () => {
    const templates = {
      assets: `assetTag,name,category,subcategory,serialNumber,model,manufacturer,purchaseDate,purchasePrice,currentValue,status,condition,building,floor,room,desk,description,notes
IT-001234,MacBook Pro 16",laptop,workstation,SN123456,MacBook Pro 16",Apple,2024-01-15,2500.00,2200.00,available,excellent,Building A,2,201,Desk 5,16-inch MacBook Pro for development,New equipment`,
      users: `name,email,department,jobTitle,employeeId,phone,role,isActive
John Doe,john.doe@company.com,IT,Software Engineer,EMP001,+966501234567,user,true
Jane Smith,jane.smith@company.com,HR,HR Manager,EMP002,+966507654321,manager,true`,
      assignments: `assetId,userId,purpose,expectedReturnAt,notes
1,user-id-1,Work from home,2024-12-31,WFH setup
2,user-id-2,Project assignment,,Temporary project work`
    }

    const template = templates[importType as keyof typeof templates]
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${importType}_template.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Import Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Configuration
          </CardTitle>
          <CardDescription>
            Configure your bulk import settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="importType">Import Type *</Label>
              <Select
                value={watch('importType')}
                onValueChange={(value) => setValue('importType', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assets">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Assets
                    </div>
                  </SelectItem>
                  <SelectItem value="users">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Users
                    </div>
                  </SelectItem>
                  <SelectItem value="assignments">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Assignments
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Template</Label>
              <Button
                type="button"
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasHeaders"
                {...register('hasHeaders')}
                className="rounded"
              />
              <Label htmlFor="hasHeaders">File has headers</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="skipErrors"
                {...register('skipErrors')}
                className="rounded"
              />
              <Label htmlFor="skipErrors">Skip rows with errors</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Upload
          </CardTitle>
          <CardDescription>
            Upload your CSV or Excel file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File *</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              ref={fileInputRef}
              className={errors.file ? 'border-red-500' : ''}
            />
            {errors.file && (
              <p className="text-sm text-red-500">{errors.file.message?.toString()}</p>
            )}
            <p className="text-sm text-gray-500">
              Supported formats: CSV, Excel (.xlsx, .xls). Maximum file size: 10MB
            </p>
          </div>

          {/* File Preview */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <Label>File Preview (first 5 rows)</Label>
              <div className="border rounded-lg p-4 bg-gray-50 max-h-40 overflow-auto">
                {previewData.map((row, index) => (
                  <div key={index} className="text-sm font-mono">
                    {row.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Import Notes</CardTitle>
          <CardDescription>
            Optional notes about this import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('notes')}
            placeholder="Enter any notes about this import..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Import Progress */}
      {isUploading && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={uploadProgress} className="w-full" />
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Processing import...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.totalRows}
                </div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.importedRows}
                </div>
                <div className="text-sm text-gray-600">Imported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.failedRows}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Errors</Label>
                <div className="max-h-32 overflow-auto border rounded p-2 bg-red-50">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={isUploading || !watch('file')}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Start Import
        </Button>
      </div>
    </div>
  )
} 