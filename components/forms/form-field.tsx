'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, CalendarDays, AlertCircle, Eye, EyeOff } from 'lucide-react'

// Base form field wrapper
interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  description?: string
  className?: string
  children: React.ReactNode
}

export function FormField({
  label,
  error,
  required,
  description,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <div className="flex items-center space-x-1 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  )
}

// Enhanced input component with validation states
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
  description?: string
  icon?: React.ReactNode
  suffix?: React.ReactNode
}

export function FormInput({
  label,
  error,
  required,
  description,
  icon,
  suffix,
  className,
  type = 'text',
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <FormField
      label={label}
      error={error}
      required={required}
      description={description}
    >
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <Input
          type={inputType}
          className={cn(
            'transition-colors',
            icon && 'pl-10',
            (suffix || isPassword) && 'pr-10',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}
        {suffix && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {suffix}
          </div>
        )}
      </div>
    </FormField>
  )
}

// Select component for dropdowns
interface FormSelectProps {
  label?: string
  error?: string
  required?: boolean
  description?: string
  placeholder?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export function FormSelect({
  label,
  error,
  required,
  description,
  placeholder = 'Select an option...',
  options,
  value,
  onChange,
  className,
}: FormSelectProps) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      description={description}
    >
      <select
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}

// Date picker component
interface FormDatePickerProps {
  label?: string
  error?: string
  required?: boolean
  description?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  minDate?: Date
  maxDate?: Date
}

export function FormDatePicker({
  label,
  error,
  required,
  description,
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  minDate,
  maxDate,
}: FormDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Format date for input
  const formatDate = (date: Date | undefined) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value
    if (dateStr) {
      onChange?.(new Date(dateStr))
    } else {
      onChange?.(undefined)
    }
  }

  return (
    <FormField
      label={label}
      error={error}
      required={required}
      description={description}
    >
      <div className="relative">
        <Input
          type="date"
          value={formatDate(value)}
          onChange={handleDateChange}
          min={minDate ? formatDate(minDate) : undefined}
          max={maxDate ? formatDate(maxDate) : undefined}
          className={cn(
            'pr-10',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          placeholder={placeholder}
        />
        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </FormField>
  )
}

// Textarea component
interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  required?: boolean
  description?: string
}

export function FormTextarea({
  label,
  error,
  required,
  description,
  className,
  rows = 3,
  ...props
}: FormTextareaProps) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      description={description}
    >
      <textarea
        rows={rows}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
    </FormField>
  )
}

// Checkbox component
interface FormCheckboxProps {
  label?: string
  error?: string
  description?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  className?: string
}

export function FormCheckbox({
  label,
  error,
  description,
  checked,
  onChange,
  className,
}: FormCheckboxProps) {
  return (
    <FormField error={error} description={description}>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={checked || false}
          onChange={(e) => onChange?.(e.target.checked)}
          className={cn(
            'h-4 w-4 rounded border border-input ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
            className
          )}
        />
        {label && <Label className="text-sm font-medium">{label}</Label>}
      </div>
    </FormField>
  )
}

// Radio group component
interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface FormRadioGroupProps {
  label?: string
  error?: string
  required?: boolean
  description?: string
  options: RadioOption[]
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export function FormRadioGroup({
  label,
  error,
  required,
  description,
  options,
  value,
  onChange,
  className,
}: FormRadioGroupProps) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      description={description}
    >
      <div className={cn('space-y-2', className)}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <input
              type="radio"
              id={option.value}
              name={label}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={option.disabled}
              className={cn(
                'h-4 w-4 border border-input ring-offset-background',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-destructive'
              )}
            />
            <div className="flex-1">
              <Label htmlFor={option.value} className="text-sm font-medium">
                {option.label}
              </Label>
              {option.description && (
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </FormField>
  )
} 