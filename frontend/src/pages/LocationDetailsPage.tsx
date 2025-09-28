import { useParams } from 'react-router-dom'
import { Container, Heading, Text } from '@chakra-ui/react'
import LocationDetails from '../components/LocationDetails'

export default function LocationDetailsPage() {
    const { locationId } = useParams<{ locationId: string }>()

    if (!locationId) {
        return (
            <Container maxW="6xl" py={6}>
                <Text>Invalid location ID</Text>
            </Container>
        )
    }

    return (
        <Container maxW="6xl" py={6}>
            <LocationDetails locationId={locationId} />
        </Container>
    )
}