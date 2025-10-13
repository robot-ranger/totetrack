import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Container, Heading, HStack, Spacer, Button, Box, Icon, Image, IconButton, Dialog, Text } from '@chakra-ui/react'
import { useColorMode } from './components/ui/color-mode'
import TotesPage from './pages/TotesPage'
import ToteDetailPage from './pages/ToteDetailPage'
import ItemsPage from './pages/ItemsPage'
import UsersPage from './pages/UsersPage'
import LocationsPage from './pages/LocationsPage'
import LocationDetailsPage from './pages/LocationDetailsPage'
import CheckedOutItemsPage from './pages/CheckedOutItemsPage'
import { FiDownloadCloud, FiMoon, FiSun, FiMenu, FiUser, FiSettings, FiUploadCloud } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { exportDataZip, importDataZip } from './importExport'
import type { } from './types'
import { useAuth } from './auth'
import { Sidebar } from './components/Sidebar'
import { ProfileModal } from './components/ProfileModal'
import LoginPage from './pages/LoginPage'
import PasswordRecoveryPage from './pages/PasswordRecoveryPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import LandingPage from './pages/LandingPage'
import { SidebarRefreshProvider } from './SidebarRefreshContext'
import MyProfilePage from './pages/MyProfilePage'

const sidebarWidth = 220

export default function App() {
    const { colorMode, toggleColorMode } = useColorMode()
    const { user, logout } = useAuth()
    // Track actual sidebar width (collapsible on desktop)
    const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState<number>(sidebarWidth)
    // Profile and nav state for authenticated users (always declare hooks)
    const [profileOpen, setProfileOpen] = useState(false)
    const [navOpen, setNavOpen] = useState(false)
    const navigate = useNavigate()

    async function handleDownloadZip() {
        try {
            const blob = await exportDataZip()

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

    // Import dialog state
    const [importOpen, setImportOpen] = useState(false)
    const [importBusy, setImportBusy] = useState(false)
    const [importReport, setImportReport] = useState<null | { text: string }>(null)
    const D = Dialog as any

    async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (!f) return
        setImportBusy(true)
        try {
            const report = await importDataZip(f, { includeUsers: true })
            const summary = `Imported: ${report.locationsCreated} locations, ${report.totesCreated} totes, ${report.itemsCreated} items${report.usersCreated ? `, ${report.usersCreated} users` : ''}.` + (report.notes.length ? `\nNotes:\n- ${report.notes.join('\n- ')}` : '')
            setImportReport({ text: summary })
        } catch (err) {
            console.error('Import failed', err)
            setImportReport({ text: 'Import failed: ' + String(err) })
        } finally {
            setImportBusy(false)
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
                    <Route path="/verify" element={<VerifyEmailPage />} />
                    <Route path="/recover" element={<PasswordRecoveryPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Box>
        )
    }

    // Authenticated routes
    return (
        <SidebarRefreshProvider>
            <Box display="flex" minH="100vh" colorPalette={'purple'}>
                <Sidebar
                    width={sidebarWidth}
                    mobileOpen={navOpen}
                    onMobileOpenChange={setNavOpen}
                    hideHamburger
                    onProfile={() => navigate('/me')}
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
                            <>
                                <IconButton aria-label="Download data (ZIP)" variant="subtle" size="sm" onClick={handleDownloadZip}>
                                    <FiDownloadCloud />
                                </IconButton>
                                <IconButton aria-label="Import data (ZIP)" variant="subtle" size="sm" onClick={() => setImportOpen(true)}>
                                    <FiUploadCloud />
                                </IconButton>
                            </>
                        )}
                        <Button size="sm" variant="subtle" onClick={() => navigate('/me')}>
                            <Icon size={'sm'}><FiUser /></Icon>
                        </Button>
                    </HStack>
                    <Routes>
                        <Route path="/" element={<TotesPage />} />
                        <Route path="/verify" element={<VerifyEmailPage />} />
                        <Route path="/items" element={<ItemsPage />} />
                        <Route path="/checked-out" element={<CheckedOutItemsPage />} />
                        <Route path="/locations" element={<LocationsPage />} />
                        <Route path="/locations/:locationId" element={<LocationDetailsPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/me" element={<MyProfilePage />} />
                        <Route path="/totes/:toteId" element={<ToteDetailPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Box>
            </Box>
            {/* Import dialog (superuser only) */}
            {user?.is_superuser && (
                <D.Root open={importOpen} onOpenChange={(d: any) => setImportOpen(d.open)}>
                    <D.Backdrop />
                    <D.Positioner>
                        <D.Content maxW="480px">
                            <D.Header>
                                <D.Title>Import data</D.Title>
                            </D.Header>
                            <D.Body>
                                <Box>
                                    <Text mb={2}>Select a ZIP previously exported from ToteTrackr.</Text>
                                    <input type="file" accept=".zip" onChange={handleImportFile} disabled={importBusy} />
                                    {importReport && (
                                        <Box mt={3} p={2} bg="bg.subtle" borderRadius="md" fontSize="sm" whiteSpace="pre-wrap">
                                            {importReport.text}
                                        </Box>
                                    )}
                                </Box>
                            </D.Body>
                            <D.Footer>
                                <Button variant="subtle" onClick={() => setImportOpen(false)} disabled={importBusy}>Close</Button>
                            </D.Footer>
                        </D.Content>
                    </D.Positioner>
                </D.Root>
            )}
        </SidebarRefreshProvider>
    )
}