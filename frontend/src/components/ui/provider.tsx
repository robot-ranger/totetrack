import React from 'react'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { ColorModeProvider } from './color-mode'

// Central system definition (v3 replacement for extendTheme).
// Add design tokens & semantic tokens here.
export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#eff6ff' },
          100: { value: '#dbeafe' },
          200: { value: '#bfdbfe' },
          300: { value: '#93c5fd' },
          400: { value: '#60a5fa' },
          500: { value: '#3b82f6' },
          600: { value: '#2563eb' },
          700: { value: '#1d4ed8' },
          800: { value: '#1e40af' },
          900: { value: '#1e3a8a' }
        }
      },
      radii: {
        sm: { value: '2px' },
        md: { value: '6px' },
        lg: { value: '10px' }
      }
    },
    semanticTokens: {
      colors: {
        'bg.canvas': { value: { _light: '{colors.white}', _dark: '{colors.gray.900}' } },
        'fg.default': { value: { _light: '{colors.gray.800}', _dark: '{colors.gray.100}' } }
      }
    }
  }
})

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider>{children}</ColorModeProvider>
    </ChakraProvider>
  )
}

export default Provider