import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { Container, Heading, HStack, Spacer, Button, Box, Icon, Image, IconButton } from '@chakra-ui/react'
import { useColorMode } from './components/ui/color-mode'
import TotesPage from './pages/TotesPage'
import ToteDetailPage from './pages/ToteDetailPage'
import ItemsPage from './pages/ItemsPage'
import UsersPage from './pages/UsersPage'
import LocationsPage from './pages/LocationsPage'
import LocationDetailsPage from './pages/LocationDetailsPage'
import CheckedOutItemsPage from './pages/CheckedOutItemsPage'
import { FiDownloadCloud, FiMoon, FiSun, FiMenu, FiUser, FiSettings } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { listItems, listLocations, listTotes, listUsers } from './api'
import type { ItemWithCheckoutStatus, User as UserType } from './types'
import { useAuth } from './auth'
import { Sidebar } from './components/Sidebar'
import { ProfileModal } from './components/ProfileModal'
import LoginPage from './pages/LoginPage'
import PasswordRecoveryPage from './pages/PasswordRecoveryPage'
import LandingPage from './pages/LandingPage'
import { SidebarRefreshProvider } from './SidebarRefreshContext'

const sidebarWidth = 220

export default function App() {
    const { colorMode, toggleColorMode } = useColorMode()
    const { user, logout } = useAuth()
    // Track actual sidebar width (collapsible on desktop)
    const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState<number>(sidebarWidth)
    // Profile and nav state for authenticated users (always declare hooks)
    const [profileOpen, setProfileOpen] = useState(false)
    const [navOpen, setNavOpen] = useState(false)

    // Generic CSV helpers
    function escapeCsv(val: unknown): string {
        if (val === null || val === undefined) return ''
        // Convert objects to JSON strings for readability (e.g., metadata); primitives as-is
        const v = typeof val === 'object' ? JSON.stringify(val) : String(val)
        if (/[",\n\r]/.test(v)) {
            return '"' + v.replace(/"/g, '""') + '"'
        }
        return v
    }

    function toCsvFromRows(rows: Array<Record<string, unknown>>, headers: string[]): string {
        const lines: string[] = []
        lines.push(headers.join(','))
        for (const r of rows) {
            const row = headers.map(h => escapeCsv((r as any)[h]))
            lines.push(row.join(','))
        }
        return lines.join('\r\n')
    }

    async function handleDownloadZip() {
        try {
            const [locations, totes, items, users] = await Promise.all([
                listLocations(),
                listTotes(),
                listItems(),
                listUsers(), // Endpoint is superuser-restricted; the button is only visible to superusers
            ])

            // locations.csv
            const locationHeaders = ['id', 'name', 'description']
            const locationRows = locations.map(l => ({
                id: l.id,
                name: l.name,
                description: l.description ?? '',
            }))
            const locationsCsv = toCsvFromRows(locationRows, locationHeaders)

            // totes.csv
            const toteHeaders = ['id', 'name', 'description', 'location', 'location_id', 'metadata_json', 'items_count']
            const toteRows = totes.map(t => ({
                id: t.id,
                name: t.name ?? '',
                description: t.description ?? '',
                location: t.location ?? t.location_obj?.name ?? '',
                location_id: t.location_id ?? t.location_obj?.id ?? '',
                metadata_json: t.metadata_json ?? '',
                items_count: Array.isArray(t.items) ? t.items.length : 0,
            }))
            const totesCsv = toCsvFromRows(toteRows, toteHeaders)

            // items.csv
            const itemHeaders = [
                'id', 'name', 'description', 'quantity', 'tote_id', 'image_url',
                'is_checked_out', 'checked_out_at', 'checked_out_by_id', 'checked_out_by_email', 'checked_out_by_name',
            ]
            const itemRows = items.map((it: ItemWithCheckoutStatus) => ({
                id: it.id,
                name: it.name,
                description: it.description ?? '',
                quantity: it.quantity,
                tote_id: it.tote_id ?? '',
                image_url: it.image_url ?? '',
                is_checked_out: !!it.is_checked_out,
                checked_out_at: it.checked_out_at ?? '',
                checked_out_by_id: it.checked_out_by?.id ?? '',
                checked_out_by_email: it.checked_out_by?.email ?? '',
                checked_out_by_name: it.checked_out_by?.full_name ?? '',
            }))
            const itemsCsv = toCsvFromRows(itemRows, itemHeaders)

            // users.csv
            const userHeaders = [
                'id', 'email', 'full_name', 'is_active', 'is_superuser', 'account_id', 'created_at', 'updated_at',
            ]
            const userRows = users.map((u: UserType) => ({
                id: u.id,
                email: u.email,
                full_name: u.full_name ?? '',
                is_active: u.is_active,
                is_superuser: u.is_superuser,
                account_id: u.account_id,
                created_at: u.created_at ?? '',
                updated_at: u.updated_at ?? '',
            }))
            const usersCsv = toCsvFromRows(userRows, userHeaders)

            // Zip them
            const { default: JSZip } = await import('jszip')
            const zip = new JSZip()
            zip.file('locations.csv', locationsCsv)
            zip.file('totes.csv', totesCsv)
            zip.file('items.csv', itemsCsv)
            zip.file('users.csv', usersCsv)
            const blob = await zip.generateAsync({ type: 'blob' })

            // trigger download
            const url = URL.createObjectURL(blob)
            const ts = new Date()
            const pad = (n: number) => String(n).padStart(2, '0')
            const filename = `export-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.zip`
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Failed to download data ZIP', err)
        }
    }

    async function handleDownloadCsv() {
        try {
            const items = await listItems()
            const itemHeaders = [
                'id', 'name', 'description', 'quantity', 'tote_id', 'image_url',
                'is_checked_out', 'checked_out_at', 'checked_out_by_id', 'checked_out_by_email', 'checked_out_by_name',
            ]
            const rows = items.map((it: ItemWithCheckoutStatus) => ({
                id: it.id,
                name: it.name,
                description: it.description ?? '',
                quantity: it.quantity,
                tote_id: it.tote_id ?? '',
                image_url: it.image_url ?? '',
                is_checked_out: !!it.is_checked_out,
                checked_out_at: it.checked_out_at ?? '',
                checked_out_by_id: it.checked_out_by?.id ?? '',
                checked_out_by_email: it.checked_out_by?.email ?? '',
                checked_out_by_name: it.checked_out_by?.full_name ?? '',
            }))
            const csv = toCsvFromRows(rows, itemHeaders)
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
                        <NavLink to='/'><HStack><Image src={"totetrackr.png"} alt="ToteTrackr" w={30}/><Heading size="lg">ToteTrackr</Heading></HStack></NavLink>
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
        <SidebarRefreshProvider>
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
                            <NavLink to='/'><HStack><Image src={"totetrackr.png"} alt="Boxly" w={30}/><Heading size="md">ToteTrackr</Heading></HStack></NavLink>
                        </HStack>
                        <Spacer />
                        <IconButton aria-label="Toggle color mode" variant="subtle" size="sm" color={colorMode === 'light' ? 'gray.100' : 'gray.700'} bg={colorMode === 'light' ? 'gray.700' : 'gray.100'} onClick={toggleColorMode}>{colorMode === 'light' ? <FiMoon /> : <FiSun />}</IconButton>
                        {user?.is_superuser && (
                            <IconButton aria-label="Download data (ZIP)" variant="subtle" size="sm" onClick={handleDownloadZip}>
                                <FiDownloadCloud />
                            </IconButton>
                        )}
                        <Button size="sm" variant="subtle" onClick={() => setProfileOpen(true)}>
                            <Icon size={'sm'}><FiSettings /></Icon>
                        </Button>
                    </HStack>
                    <Routes>
                        <Route path="/" element={<TotesPage />} />
                        <Route path="/items" element={<ItemsPage />} />
                        <Route path="/checked-out" element={<CheckedOutItemsPage />} />
                        <Route path="/locations" element={<LocationsPage />} />
                        <Route path="/locations/:locationId" element={<LocationDetailsPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/totes/:toteId" element={<ToteDetailPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} onLogout={logout} />
                </Box>
            </Box>
        </SidebarRefreshProvider>
    )
}