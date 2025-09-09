import { Routes, Route, NavLink } from 'react-router-dom'
import { Container, Heading, HStack, Spacer, Button } from '@chakra-ui/react'
import { useColorMode } from './components/ui/color-mode'
import TotesPage from './pages/TotesPage'
import ToteDetailPage from './pages/ToteDetailPage'
import SearchPage from './pages/SearchPage'
import ScanPage from './pages/ScanPage'


export default function App() {
    const { colorMode, toggleColorMode } = useColorMode()
    return (
        <Container maxW="6xl" py={6}>
            <HStack as="header" gap={6} mb={6}>
                <Heading size="lg">Boxly</Heading>
                <Spacer />
                <NavLink to="/" end style={({ isActive }) => (isActive ? { fontWeight: 'bold', textDecoration: 'underline' } : undefined)}>Totes</NavLink>
                <NavLink to="/search" style={({ isActive }) => (isActive ? { fontWeight: 'bold', textDecoration: 'underline' } : undefined)}>Search</NavLink>
                <NavLink to="/scan" style={({ isActive }) => (isActive ? { fontWeight: 'bold', textDecoration: 'underline' } : undefined)}>Scan</NavLink>
                <Button variant="subtle" size="sm" onClick={toggleColorMode}>{colorMode === 'light' ? 'Dark' : 'Light'}</Button>
            </HStack>
            <Routes>
                <Route path="/" element={<TotesPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/totes/:toteId" element={<ToteDetailPage />} />
            </Routes>
        </Container>
    )
}