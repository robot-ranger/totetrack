import { createContext, useContext, useState, ReactNode } from 'react'

interface SidebarRefreshContextType {
  refreshTrigger: number
  triggerRefresh: () => void
}

const SidebarRefreshContext = createContext<SidebarRefreshContextType | undefined>(undefined)

export function SidebarRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <SidebarRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </SidebarRefreshContext.Provider>
  )
}

export function useSidebarRefresh() {
  const context = useContext(SidebarRefreshContext)
  if (context === undefined) {
    throw new Error('useSidebarRefresh must be used within a SidebarRefreshProvider')
  }
  return context
}