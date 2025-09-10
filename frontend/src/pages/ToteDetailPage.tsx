import { useParams } from 'react-router-dom'
import { Box, Heading, Link, Stack, Text } from '@chakra-ui/react'
import ToteDetail from '../components/ToteDetail'

export default function ToteDetailPage() {
  const { toteId } = useParams<{ toteId: string }>()
  if (!toteId) return <Text>Missing tote id.</Text>
  return (
    <Stack gap={6}>
      <Box display="flex" alignItems="center" justifyContent="end" gap={4}>
        <Link href="/">Back to all totes</Link>
      </Box>
      <ToteDetail toteId={toteId} />
    </Stack>
  )
}
