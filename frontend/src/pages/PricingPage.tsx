import { Box, Container, Heading, Text, SimpleGrid, Stack, Button, List, Icon, HStack, Badge } from '@chakra-ui/react'
import { FiCheck } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../auth'

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
    description: 'Need on‑prem, or custom workflows? Let’s talk.',
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

export default function PricingPage() {
  const { user } = useAuth()
  return (
    <Container maxW="7xl" py={16}>
      <Stack textAlign="center" mb={14} gap={4}>
        <Heading size="2xl">Simple, transparent pricing</Heading>
        <Text fontSize="lg" color="fg.muted">Choose the plan that fits your inventory tracking needs. Upgrade or downgrade anytime.</Text>
        {!user && (
          <Text fontSize="sm" color="fg.muted">Already have an account? <RouterLink to="/login" style={{ textDecoration: 'underline' }}>Log in</RouterLink></Text>
        )}
      </Stack>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
        {tiers.map(t => <TierCard key={t.name} {...t} />)}
      </SimpleGrid>
      <Box mt={20} textAlign="center">
        <Text fontSize="sm" color="fg.muted">Need something custom? <RouterLink to="/contact" style={{ textDecoration: 'underline' }}>Contact us</RouterLink>.</Text>
      </Box>
    </Container>
  )
}
