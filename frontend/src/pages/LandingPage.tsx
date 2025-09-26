import { Box, Container, Stack, Heading, Text, Button, HStack, Icon, SimpleGrid, Highlight, Card, Link, Image, Separator, VStack, Flex } from '@chakra-ui/react'
import { FiPackage, FiLayers, FiSearch, FiCloud, FiCamera, FiUsers } from 'react-icons/fi'
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

export default function LandingPage() {
  return (
    <Box>
      {/* Hero Section */}
      <Box pt={{ base: 16, md: 24 }} pb={{ base: 16, md: 28 }} position="relative" overflow="hidden">
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
                <Button size="lg" variant="outline" asChild>
                  <RouterLink to="/pricing">View Pricing</RouterLink>
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
                <Image src="/media/totetrackr_shelf.png" alt="App preview" w="100%" h="auto" objectFit="cover" p={12} />
              </Box>
            </Flex>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 16, md: 24 }} bg="bg.subtle">
        <Container maxW="7xl">
          <Stack textAlign="center" gap={4} mb={14}>
            <Heading size="xl">Everything you need to stay organized</Heading>
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

      {/* Footer */}
      <Box as="footer" py={8}>
          <HStack gap={6} justify={"center"} flexWrap="wrap">
            <HStack gap={3}>
              <Image src="/media/totetrackr.png" alt="ToteTrackr" w={30} />
              <Heading size="md">ToteTrackr</Heading>
            </HStack>
            <HStack gap={6} fontSize="sm" color="fg.muted">
              <Link asChild><RouterLink to="/pricing">Pricing</RouterLink></Link>
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
