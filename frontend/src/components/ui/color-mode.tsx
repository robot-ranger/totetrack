import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Minimal color mode implementation for Chakra v3 guidance when not using next-themes.
// Adds a data attribute on the html element: data-theme="light" | "dark".

type Mode = 'light' | 'dark'
interface ColorModeContextValue {
  colorMode: Mode
  toggleColorMode: () => void
  setColorMode: (m: Mode) => void
}

const ColorModeContext = createContext<ColorModeContextValue | undefined>(undefined)

function getInitial(): Mode {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem('color-mode') as Mode | null
  if (stored === 'light' || stored === 'dark') return stored
  // prefers-color-scheme fallback
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  return mql.matches ? 'dark' : 'light'
}

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(getInitial)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = mode
    root.classList.remove(mode === 'light' ? 'dark' : 'light')
    root.classList.add(mode)
    window.localStorage.setItem('color-mode', mode)
  }, [mode])

  const toggle = useCallback(() => setMode(m => (m === 'light' ? 'dark' : 'light')), [])

  const value: ColorModeContextValue = {
    colorMode: mode,
    toggleColorMode: toggle,
    setColorMode: setMode
  }

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>
}

export function useColorMode() {
  const ctx = useContext(ColorModeContext)
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider')
  return ctx
}

export function useColorModeValue<T>(light: T, dark: T): T {
  const { colorMode } = useColorMode()
  return colorMode === 'light' ? light : dark
}

export const LightMode: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="light">{children}</div>
}
export const DarkMode: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="dark">{children}</div>
}

export default ColorModeProvider