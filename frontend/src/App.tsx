import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { Container, Heading, HStack, Spacer, Button, Box, Icon, Image, IconButton } from '@chakra-ui/react'
import { useColorMode } from './components/ui/color-mode'
import TotesPage from './pages/TotesPage'
import ToteDetailPage from './pages/ToteDetailPage'
import ItemsPage from './pages/ItemsPage'
import UsersPage from './pages/UsersPage'
import { FiDownloadCloud, FiMoon, FiSun, FiMenu, FiUser } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { listItems } from './api'
import type { Item } from './types'
import { useAuth } from './auth'
import { Sidebar } from './components/Sidebar'
import { ProfileModal } from './components/ProfileModal'
import LoginPage from './pages/LoginPage'
import PasswordRecoveryPage from './pages/PasswordRecoveryPage'
import LandingPage from './pages/LandingPage'

const sidebarWidth = 220

export default function App() {
    const { colorMode, toggleColorMode } = useColorMode()
    const { user, logout } = useAuth()
    // Track actual sidebar width (collapsible on desktop)
    const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState<number>(sidebarWidth)
    // Profile and nav state for authenticated users (always declare hooks)
    const [profileOpen, setProfileOpen] = useState(false)
    const [navOpen, setNavOpen] = useState(false)

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
            <Box>
                <Container maxW="6xl" py={6}>
                    <HStack gap={6} mb={4}>
                        <NavLink to='/'><HStack><Image src={"/media/totetrackr.png"} alt="ToteTrackr" w={30}/><Heading size="lg">ToteTrackr</Heading></HStack></NavLink>
                        <Spacer />
                        <HStack gap={3}>
                            <Button size="sm" variant="solid" colorPalette="yellow" asChild><NavLink to="/login">Login</NavLink></Button>
                            <IconButton aria-label="Toggle color mode" variant="subtle" size="sm" onClick={toggleColorMode}>{colorMode === 'light' ? <FiMoon /> : <FiSun />}</IconButton>
                        </HStack>
                    </HStack>
                </Container>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/recover" element={<PasswordRecoveryPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Box>
        )
    }

    // Authenticated routes
    return (
        <Box display="flex" minH="100vh">
            <Sidebar
                width={sidebarWidth}
                mobileOpen={navOpen}
                onMobileOpenChange={setNavOpen}
                hideHamburger
                onProfile={() => setProfileOpen(true)}
                onLogout={logout}
                onWidthChange={setSidebarCurrentWidth}
            />
            <Box flex="1" ml={{ base: 0, md: `${sidebarCurrentWidth}px` }} px={4} py={4}>
                <HStack mb={4} gap={4}>
                    <HStack gap={3}>
                        <IconButton display={{ base: 'inline-flex', md: 'none' }} aria-label="Open navigation" variant="ghost" size="sm" onClick={() => setNavOpen(true)}>
                            <FiMenu />
                        </IconButton>
                        <NavLink to='/'><HStack><Image src={"/media/totetrackr.png"} alt="Boxly" w={30}/><Heading size="md">ToteTrackr</Heading></HStack></NavLink>
                    </HStack>
                    <Spacer />
                    <IconButton aria-label="Toggle color mode" variant="subtle" size="sm" color={colorMode === 'light' ? 'gray.100' : 'gray.700'} bg={colorMode === 'light' ? 'gray.700' : 'gray.100'} onClick={toggleColorMode}>{colorMode === 'light' ? <FiMoon /> : <FiSun />}</IconButton>
                    <IconButton aria-label="Download items CSV" variant="subtle" size="sm" onClick={handleDownloadCsv}><FiDownloadCloud /></IconButton>
                    <Button size="sm" variant="subtle" onClick={() => setProfileOpen(true)}>
                        <HStack gap={1}><Icon size={'sm'}><FiUser /></Icon><span>Profile</span></HStack>
                    </Button>
                </HStack>
                <Routes>
                    <Route path="/" element={<TotesPage />} />
                    <Route path="/items" element={<ItemsPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/totes/:toteId" element={<ToteDetailPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} onLogout={logout} />
            </Box>
        </Box>
    )
}