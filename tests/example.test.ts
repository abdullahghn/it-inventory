import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, capitalizeFirst } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$10.00')
      expect(formatCurrency(50)).toBe('$0.50')
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
    })
  })

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello')
      expect(capitalizeFirst('WORLD')).toBe('WORLD')
      expect(capitalizeFirst('')).toBe('')
    })
  })
}) 