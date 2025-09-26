import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Container, Heading, HStack, Spacer, Button, Box, Icon, Image, IconButton, Menu, MenuContent, MenuTrigger, Portal } from '@chakra-ui/react'
import { useColorMode } from './components/ui/color-mode'
import TotesPage from './pages/TotesPage'
import ToteDetailPage from './pages/ToteDetailPage'
import ItemsPage from './pages/ItemsPage'
import UsersPage from './pages/UsersPage'
import { FiArchive, FiDownloadCloud, FiMoon, FiSun, FiTag, FiUsers, FiLogOut } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { listItems } from './api'
import type { Item } from './types'
import { useAuth } from './auth'
import LoginPage from './pages/LoginPage'
import PasswordRecoveryPage from './pages/PasswordRecoveryPage'
import PricingPage from './pages/PricingPage'


export default function App() {
    const { colorMode, toggleColorMode } = useColorMode()
    const { user, logout } = useAuth()

    function toCsv(items: Item[]): string {
        const headers = ['id', 'name', 'description', 'quantity', 'tote_id', 'image_url'] as const
        const escape = (val: unknown) => {
            if (val === null || val === undefined) return ''
            const s = String(val)
            if (/[",\n\r]/.test(s)) {
                return '"' + s.replace(/"/g, '""') + '"'
            }
            return s
        }
        const lines = [headers.join(',')]
        for (const it of items) {
            const row = headers.map(h => escape((it as any)[h]))
            lines.push(row.join(','))
        }
        return lines.join('\r\n')
    }

    async function handleDownloadCsv() {
        try {
            const items = await listItems()
            const csv = toCsv(items)
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const ts = new Date()
            const pad = (n: number) => String(n).padStart(2, '0')
            const filename = `items-${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.csv`
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Failed to download CSV', err)
        }
    }
    // Public routes
    if (!user) {
        return (
            <Container maxW="6xl" py={6}>
                <HStack gap={6} mb={6}>
                    <NavLink to='/'><HStack><Image src={"/media/totetrack-icon_light_30.png"} alt="ToteTrackr" w={30}/><Heading size="lg">ToteTrackr</Heading></HStack></NavLink>
                    <RouterLink to="/pricing"><HStack>Pricing</HStack></RouterLink>
                    <Spacer />
                    <IconButton aria-label="Toggle color mode" variant="subtle" size="sm" onClick={toggleColorMode}>{colorMode === 'light' ? <FiMoon /> : <FiSun />}</IconButton>
                </HStack>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/recover" element={<PasswordRecoveryPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Container>
        )
    }

    // Authenticated routes
    return (
        <Container maxW="6xl" py={6}>
            <HStack gap={6} mb={6}>
                <NavLink to='/'><HStack><Image src={"/media/totetrack-icon_light_30.png"} alt="Boxly" w={30}/><Heading size="lg">ToteTrack</Heading></HStack></NavLink>
                <Spacer />
                <RouterLink to="/"><HStack><Icon size={'sm'}><FiArchive/></Icon>Totes</HStack></RouterLink>
                <RouterLink to="/items"><HStack><Icon size={'sm'}><FiTag/></Icon>Items</HStack></RouterLink>
                <RouterLink to="/pricing"><HStack>Pricing</HStack></RouterLink>
                {user.is_superuser && (
                    <RouterLink to="/users"><HStack><Icon size={'sm'}><FiUsers/></Icon>Users</HStack></RouterLink>
                )}
                <IconButton aria-label="Toggle color mode" variant="subtle" size="sm" onClick={toggleColorMode}>{colorMode === 'light' ? <FiMoon /> : <FiSun />}</IconButton>
                <IconButton aria-label="Download items CSV" variant="subtle" size="sm" onClick={handleDownloadCsv}><FiDownloadCloud /></IconButton>
                <Button size="sm" variant="outline" onClick={() => { logout(); }}>
                    <HStack><Icon size={'sm'}><FiLogOut /></Icon>Logout</HStack>
                </Button>
            </HStack>
            <Routes>
                <Route path="/" element={<TotesPage />} />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/totes/:toteId" element={<ToteDetailPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Container>
    )
}