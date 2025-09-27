import { Box, Container, Stack, Heading, Text, Button, HStack, Icon, SimpleGrid, Highlight, Card, Link, Image, Separator, VStack, Flex, List, Badge } from '@chakra-ui/react'
import { FiPackage, FiLayers, FiSearch, FiCloud, FiCamera, FiUsers, FiCheck } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'

// Simple feature data
const features = [
  {
    title: 'Visual Inventory',
    icon: FiCamera,
    desc: 'Attach images to totes and items so you can visually confirm contents before you dig.'
  },
  {
    title: 'Powerful Search',
    icon: FiSearch,
    desc: 'Instantly find which tote any item lives in with fast text search.'
  },
  {
    title: 'Unlimited Items',
    icon: FiLayers,
    desc: 'No arbitrary item caps. Organize as granularly as you like.'
  },
  {
    title: 'CSV Export',
    icon: FiCloud,
    desc: 'Download your data anytime for reporting or offline backup.'
  },
  {
    title: 'Share & Collaborate',
    icon: FiUsers,
    desc: 'Invite teammates to manage and audit storage together (Pro feature).'
  },
  {
    title: 'Track Totes',
    icon: FiPackage,
    desc: 'Assign IDs, locations, and custom notes to every physical container.'
  }
]

// Pricing tiers data
interface Tier {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  highlight?: boolean
  badge?: string
}

const tiers: Tier[] = [
  {
    name: 'Starter',
    price: '$0',
    period: '/mo',
    description: 'Basic tracking for personal use and small experiments.',
    features: [
      'Manage up to 2 Locations',
      'Track up to 8 totes',
      'Unlimited items per tote',
      'CSV export',
      'Manual image uploads'
    ],
    cta: 'Get Started'
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/mo',
    description: 'Advanced tracking with collaboration features for growing teams.',
    features: [
      'Unlimited locations',
      'Unlimited totes',
      'Custom storage locations',
      'User management',
      'Bulk CSV import/export',
      'Priority support'
    ],
    cta: 'Start Pro',
    highlight: true,
    badge: 'Most Popular'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'Custom',
    description: 'Need on-prem, or custom workflows? Let\'s talk.',
    features: [
      'All Pro features',
      'On-Prem deployment',
      'Custom retention & backups',
      'Dedicated success engineer'
    ],
    cta: 'Contact Us'
  }
]

function TierCard(t: Tier) {
  return (
    <Box
      borderWidth={t.highlight ? '2px' : '1px'}
      borderColor={t.highlight ? 'yellow.focusRing' : 'border'}
      rounded="xl"
      p={8}
      position="relative"
      bg={t.highlight ? 'bg.subtle' : 'bg'}
      shadow={t.highlight ? 'md' : 'sm'}
    >
      {t.badge && (
        <Badge colorPalette="yellow" position="absolute" top={4} right={4} rounded="md" px={2} py={1} fontSize="xs">{t.badge}</Badge>
      )}
      <Stack gap={3} mb={6}>
        <Heading size="md">{t.name}</Heading>
        <HStack align="baseline" gap={1}>
          <Heading size="2xl" fontWeight="bold">{t.price}</Heading>
          {t.period && <Text color="fg.muted" fontWeight="medium">{t.period}</Text>}
        </HStack>
        <Text color="fg.muted" fontSize="sm">{t.description}</Text>
      </Stack>
      <List.Root mb={8} gap={3}>
        {t.features.map(f => (
          <List.Item key={f} display="flex" gap={3}>
            <Icon color={t.highlight ? 'yellow.500' : 'green.500'}><FiCheck /></Icon>
            <Text fontSize="sm">{f}</Text>
          </List.Item>
        ))}
      </List.Root>
      <Button w="full" colorPalette={t.highlight ? 'yellow' : 'gray'} variant={t.highlight ? 'solid' : 'outline'} asChild>
        <RouterLink to={t.name === 'Starter' ? '/login' : '/contact'}>{t.cta}</RouterLink>
      </Button>
    </Box>
  )
}

export default function LandingPage() {
  return (
    <Box>
      {/* Hero Section */}
      <Box pt={{ base: 16, md: 8 }} pb={16} position="relative" overflow="hidden">
        <Container maxW="7xl">
          <Stack direction={{ base: 'column', md: 'row' }} gap={{ base: 12, md: 16 }} align="center">
            <Stack flex="1" gap={6}>
              <Heading size={{ base: '2xl', md: '3xl' }} lineHeight="1.5">
                Track every tote. Find any item. <Highlight query={"In seconds."} styles={{ px: "0.5", bg: "yellow.subtle", color: "yellow.fg" }}>In seconds.</Highlight>
              </Heading>
              <Text fontSize={{ base: 'md', md: 'lg' }} color="fg.muted" maxW="lg">
                ToteTrackr gives you a fast, searchable inventory of everything in your storage system. Stop opening random boxes – know exactly where each item lives.
              </Text>
              <HStack gap={4} flexWrap="wrap">
                <Button size="lg" asChild colorPalette="yellow">
                  <RouterLink to="/login">Get Started</RouterLink>
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                  View Pricing
                </Button>
              </HStack>
              <Text fontSize="xs" color="fg.muted">Free forever plan. Upgrade only if you grow.</Text>
            </Stack>
            <Flex flex="1" justify="center" w="full" position="relative">
              <Box
                overflow="hidden"
                w="full"
                maxW="520px"
                shadow= 'lg'
                borderRadius= '2xl'
                bg='bg.subtle'
                borderWidth= '1px'
                borderColor= 'border'
                _dark={{ 
                    bg: 'bg.inverted',
                }}
              >
                <Image src="totetrackr_shelf.png" alt="App preview" w="100%" h="auto" objectFit="cover" p={12} />
              </Box>
            </Flex>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 16, md: 20 }} bg="bg.subtle">
        <Container maxW="7xl">
          <Stack textAlign="center" gap={4} mb={14}>
            <Heading size="3xl">No More Guessing What’s in the Box.</Heading>
            <Text color="fg.muted" fontSize={{ base: 'md', md: 'lg' }}>Built for makers, teams, and anyone with too many totes.</Text>
          </Stack>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={{ base: 6, md: 10 }}>
            {features.map(f => (
              <Card.Root key={f.title} variant="elevated" p={6} rounded="xl" borderWidth="1px" shadow="sm" bg="bg">
                <HStack mb={4} gap={3}>
                  <Icon as={f.icon} boxSize={6} color={"yellow.focusRing"} />
                  <Heading size="md">{f.title}</Heading>
                </HStack>
                <Text fontSize="sm" color="fg.muted">{f.desc}</Text>
              </Card.Root>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box id="pricing" py={{ base: 16, md: 20 }}>
        <Container maxW="7xl">
          <Stack textAlign="center" mb={14} gap={4}>
            <Heading size="3xl">Simple, transparent pricing</Heading>
            <Text fontSize="lg" color="fg.muted">Choose the plan that fits your inventory tracking needs. Upgrade or downgrade anytime.</Text>
          </Stack>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
            {tiers.map(t => <TierCard key={t.name} {...t} />)}
          </SimpleGrid>
          <Box mt={12} textAlign="center">
            <Text fontSize="sm" color="fg.muted">Need something custom? <Link as={RouterLink} href="/contact" color={"yellow.focusRing"} style={{ textDecoration: 'underline' }}>Contact us</Link>.</Text>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box as="footer" py={8}>
          <HStack gap={6} justify={"center"} flexWrap="wrap">
            <HStack gap={3}>
              <Image src="totetrackr.png" alt="ToteTrackr" w={30} />
              <Heading size="md">ToteTrackr</Heading>
            </HStack>
            <HStack gap={6} fontSize="sm" color="fg.muted">
              <Link onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} cursor="pointer">Pricing</Link>
              <Link asChild><RouterLink to="/login">Login</RouterLink></Link>
            </HStack>
            <Separator />
          </HStack>
          <Flex justifyContent="center" mt={4}>
            <Text fontSize="xs" color="fg.muted">© {new Date().getFullYear()} ToteTrackr. All rights reserved.</Text>
          </Flex>
      </Box>
    </Box>
  )
}
