import { Routes, Route, NavLink } from 'react-router-dom'
import { Container, Heading, HStack, Spacer, Button, Box, Icon, Image, IconButton } from '@chakra-ui/react'
import { useColorMode } from './components/ui/color-mode'
import TotesPage from './pages/TotesPage'
import ToteDetailPage from './pages/ToteDetailPage'
import ItemsPage from './pages/ItemsPage'
import { FiArchive, FiCamera, FiDownloadCloud, FiMoon, FiSun, FiTag } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'


export default function App() {
    const { colorMode, toggleColorMode } = useColorMode()
    return (
        <Container maxW="6xl" py={6}>
            <HStack gap={6} mb={6}>
                <NavLink to='/'><HStack><Image src={"/media/totetrack-icon_light_30.png"} alt="Boxly" w={30}/><Heading size="lg">ToteTrack</Heading></HStack></NavLink>
                <Spacer />
                <RouterLink to="/"><HStack><Icon size={'sm'}><FiArchive/></Icon>Totes</HStack></RouterLink>
                <RouterLink to="/items"><HStack><Icon size={'sm'}><FiTag/></Icon>Items</HStack></RouterLink>
                <IconButton variant="subtle" size="sm" onClick={toggleColorMode}>{colorMode === 'light' ? <FiMoon /> : <FiSun />}</IconButton>
                <IconButton variant="subtle" size="sm"><FiDownloadCloud /></IconButton>
            </HStack>
            <Routes>
                <Route path="/" element={<TotesPage />} />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/totes/:toteId" element={<ToteDetailPage />} />
            </Routes>
        </Container>
    )
}