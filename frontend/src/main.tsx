import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { Provider } from './components/ui/provider'
import { AuthProvider } from './auth'
import { Toaster } from "./components/ui/toaster"

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Provider>
            <Toaster />
            <AuthProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <App />
                </BrowserRouter>
            </AuthProvider>
        </Provider>
    </React.StrictMode>
)