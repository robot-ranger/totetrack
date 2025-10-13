import { useEffect, useState } from 'react'
import { SimpleGrid, Stat, HStack, Icon, Box } from '@chakra-ui/react'
import { FiMapPin, FiPackage, FiLayers, FiCheckSquare } from 'react-icons/fi'
import { getStatistics } from '../api'
import type { Statistics } from '../types'
import { Link as RouterLink } from 'react-router-dom'

export default function StatisticsCards() {
    const [stats, setStats] = useState<Statistics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const data = await getStatistics()
                setStats(data)
            } catch (error) {
                console.error('Failed to fetch statistics:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <Box key={i} borderWidth="1px" p="4" rounded="md" bg="bg.subtle" minH="20">
                        {/* Loading skeleton */}
                    </Box>
                ))}
            </SimpleGrid>
        )
    }

    if (!stats) {
        return null
    }

    const statItems = [
        {
            label: 'Locations',
            value: stats.locations_count,
            icon: FiMapPin,
            colorPalette: 'blue',
            href: '/locations'
        },
        {
            label: 'Totes',
            value: stats.totes_count,
            icon: FiPackage,
            colorPalette: 'yellow',
            href: '/'
        },
        {
            label: 'Items',
            value: stats.items_count,
            icon: FiLayers,
            colorPalette: 'purple',
            href: '/items'
        },
        {
            label: 'Checked Out',
            value: stats.checked_out_items_count,
            icon: FiCheckSquare,
            colorPalette: 'orange',
            href: '/checked-out'
        }
    ]

    return (
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            {statItems.map((item) => (
                <Stat.Root 
                    key={item.label}
                    borderWidth="1px" 
                    borderColor="border"
                    p="4" 
                    rounded="md" 
                    bg="bg.canvas"
                    _hover={{ bg: 'bg.subtle' }}
                    transition="background-color 0.2s"
                >
                    <RouterLink to={item.href}>
                    <HStack justify="space-between">
                        <Stat.Label fontSize="sm">
                            {item.label}
                        </Stat.Label>
                        <Icon color={`${item.colorPalette}.500`} size="lg">
                            <item.icon />
                        </Icon>
                    </HStack>
                    <Stat.ValueText fontSize="2xl" fontWeight="bold" mt={2}>
                        {item.value.toLocaleString()}
                    </Stat.ValueText>
                    </RouterLink>
                </Stat.Root>
            ))}
        </SimpleGrid>
    )
}