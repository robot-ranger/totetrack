import { Box, VStack, HStack, Text, Icon, useBreakpointValue, IconButton, Drawer, Image, Heading, Button, Separator } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'
import { FiArchive, FiTag, FiUsers, FiMenu, FiX, FiChevronLeft, FiChevronRight, FiLogOut, FiUser, FiMapPin } from 'react-icons/fi'
import { useRef, useState, useEffect } from 'react'
import { useAuth } from '../auth'

/**
 * Sidebar navigation shown for authenticated users.
 * Responsive behavior:
 *  - Desktop (md+): fixed sidebar on left, content area uses left margin.
 *  - Mobile: hidden by default; hamburger IconButton fixed top-left opens Drawer.
 */
export function Sidebar({ width = 220, mobileOpen, onMobileOpenChange, hideHamburger, onProfile, onLogout, onWidthChange }: { width?: number; mobileOpen?: boolean; onMobileOpenChange?: (open: boolean) => void; hideHamburger?: boolean; onProfile?: () => void; onLogout?: () => void; onWidthChange?: (w: number) => void }) {
  const { user } = useAuth()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const [internalOpen, setInternalOpen] = useState(false)
  const controlled = mobileOpen !== undefined && !!onMobileOpenChange
  const open = controlled ? mobileOpen! : internalOpen
  const setOpen = (val: boolean) => {
    if (controlled) onMobileOpenChange!(val)
    else setInternalOpen(val)
  }
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const links = [
    { to: '/locations', label: 'Locations', icon: FiMapPin },
    { to: '/', label: 'Totes', icon: FiArchive },
    { to: '/items', label: 'Items', icon: FiTag },
  ]
  if (user?.is_superuser) {
    links.push({ to: '/users', label: 'Users', icon: FiUsers })
  }

  // Collapsible (desktop only)
  const COLLAPSED_WIDTH = 60
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('sidebar_collapsed') === '1' } catch { return false }
  })

  useEffect(() => {
    if (!isMobile) {
      try { localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0') } catch {}
      onWidthChange?.(collapsed ? COLLAPSED_WIDTH : width)
    }
  }, [collapsed, isMobile, onWidthChange, width])

  // Notify parent on mount for initial width
  useEffect(() => {
    if (!isMobile) onWidthChange?.(collapsed ? COLLAPSED_WIDTH : width)
  }, [isMobile])

  // Create separate content for desktop and mobile
  const createContent = (forceExpanded = false) => {
    const isCollapsed = !forceExpanded && collapsed
    return (
      <VStack align="stretch" gap={1} p={isCollapsed ? 2 : 4} role="navigation" aria-label="Main" fontSize="sm" flex={1}>
        {/* Collapse / Expand toggle (desktop only) */}
        {!isMobile && !forceExpanded && (
          <HStack justify={isCollapsed ? 'center' : 'flex-end'} mb={2} px={isCollapsed ? 0 : 1}>
            <IconButton
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              size="xs"
              variant="subtle"
              onClick={() => setCollapsed(c => !c)}
            >
              {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </IconButton>
          </HStack>
        )}
        {links.map(l => (
          <NavLink key={l.to} to={l.to} title={l.label} style={({ isActive }) => ({ textDecoration: 'none' })}>
            {({ isActive }) => (
              <HStack
                px={isCollapsed ? 0 : 3}
                py={2}
                rounded="md"
                bg={isActive ? 'accent.subtle' : 'transparent'}
                _hover={{ bg: 'bg.emphasized' }}
                color={isActive ? 'accent' : 'fg'}
                justify={isCollapsed ? 'center' : 'flex-start'}
              >
                <Icon as={l.icon} />
                {!isCollapsed && <Text>{l.label}</Text>}
              </HStack>
            )}
          </NavLink>
        ))}
      </VStack>
    )
  }

  const desktopContent = createContent(false)
  const mobileContent = createContent(true) // Always expanded for mobile

  // Create separate footer for desktop and mobile
  const createFooter = (forceExpanded = false) => {
    if (!user) return null
    const isCollapsed = !forceExpanded && collapsed
    return (
      <Box p={isCollapsed ? 2 : 3} borderTopWidth="1px" fontSize="xs">
        <VStack align="stretch" gap={2}>
          {!isCollapsed && <Text fontWeight="medium" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name || user.email}</Text>}
          <HStack gap={2} justify={isCollapsed ? 'center' : 'end'}>
            {onProfile && !isCollapsed && <Button aria-label="Profile" px={2} size="xs" variant={isCollapsed ? 'ghost' : 'surface'} colorPalette={"yellow"} onClick={onProfile}>{/* icon fallback */}<FiUser /> My Profile</Button>}
            <Button size="xs" variant={isCollapsed ? 'solid' : 'outline'} colorPalette="red" onClick={onLogout}><FiLogOut />{!isCollapsed && <Text ml={2}>Logout</Text>}</Button>
          </HStack>
        </VStack>
      </Box>
    )
  }

  const desktopFooter = createFooter(false)
  const mobileFooter = createFooter(true) // Always expanded for mobile

  if (isMobile) {
    const D = Drawer as any
    return (
      <>
        {!hideHamburger && (
          <IconButton
            aria-label="Open navigation"
            variant="ghost"
            size="sm"
            ref={btnRef}
            onClick={() => setOpen(true)}
          >
            <FiMenu />
          </IconButton>
        )}
        <D.Root open={open} onOpenChange={(e: any) => setOpen(e.open)} placement="start">
          <D.Backdrop />
          <D.Positioner>
            <D.Content maxW="240px" display="flex" flexDirection="column" maxH="100vh">
              <D.Header fontSize="md" px={4} py={3}>
                <HStack justify="space-between" w="full">
                  <HStack><Image src={"totetrackr.png"} alt="Boxly" w={30}/><Heading size="md">ToteTrackr</Heading></HStack>
                  <D.CloseTrigger asChild>
                    <IconButton aria-label="Close" size="xs" variant="ghost"><FiX /></IconButton>
                  </D.CloseTrigger>
                </HStack>
              </D.Header>
              <D.Body p={0} display="flex" flexDirection="column" overflowY="auto">{mobileContent}{mobileFooter}</D.Body>
            </D.Content>
          </D.Positioner>
        </D.Root>
      </>
    )
  }

  const actualWidth = collapsed ? COLLAPSED_WIDTH : width

  return (
    <Box
      as="aside"
      position="fixed"
      top={0}
      left={0}
      h="100vh"
      w={actualWidth + 'px'}
      borderRightWidth="1px"
      bg="bg.muted"
      display="flex"
      flexDirection="column"
    >
      {desktopContent}
      {desktopFooter}
    </Box>
  )
}

export function SidebarSpacer({ width = 220 }: { width?: number }) {
  const isMobile = useBreakpointValue({ base: true, md: false })
  if (isMobile) return null
  return <Box width={width + 'px'} flexShrink={0} />
}
