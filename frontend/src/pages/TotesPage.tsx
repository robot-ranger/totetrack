import { useEffect, useState } from 'react'
import { listTotes } from '../api'
import type { Tote } from '../types'
import ToteForm from '../components/ToteForm'
import ToteTable from '../components/ToteTable'
import { Box, Heading, Stack, Button, useDisclosure } from '@chakra-ui/react'


export default function TotesPage() {
    const [totes, setTotes] = useState<Tote[]>([])
    const { open, onOpen, onClose } = useDisclosure()


    async function refresh() {
        const t = await listTotes()
        setTotes(t)
    }


    useEffect(() => { refresh() }, [])


    async function handleCreated(_t: Tote) { await refresh() }


    return (
    <Stack gap={6}>
            {/* Add Tote Button + Modal */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Heading size="md">Totes</Heading>
                <Button colorPalette="blue" onClick={onOpen}>Add Tote</Button>
            </Box>

            {open && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1000}>
                    <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Heading size="md">Add a new tote</Heading>
                            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
                        </Box>
                        <ToteForm onCreated={(t) => { handleCreated(t); onClose(); }} />
                    </Box>
                </Box>
            )}

            {/* All Totes Table */}
            <Box p={4} borderWidth="1px" borderRadius="md">
                <Heading size="sm" mb={3}>All totes</Heading>
                <ToteTable totes={totes} />
            </Box>
        </Stack>
    )
}