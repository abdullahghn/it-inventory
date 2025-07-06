import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// The matchers are automatically extended in vitest when importing the above

// Run cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
}) 