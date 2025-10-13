import { useState, useEffect } from 'react'
import { Box, Button, Heading, Text, HStack, VStack, Flex } from '@chakra-ui/react'
import { FiX, FiUserPlus } from 'react-icons/fi'
import { useAuth } from '../auth'
import { listUsers, createUser, updateUser, deleteUser, sendVerification } from '../api'
import type { User } from '../types'
import type { CreateUserForm, UpdateUserForm } from '../api'
import UserForm from '../components/UserForm'
import UsersTable from '../components/UsersTable'

function useSimpleDisclosure(initial = false) {
    const [open, setOpen] = useState(initial)
    return { open, onOpen: () => setOpen(true), onClose: () => setOpen(false) }
}

export default function UsersPage() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [deletingUser, setDeletingUser] = useState<User | null>(null)
    const [sendingVerification, setSendingVerification] = useState<string | null>(null)
    const [formLoading, setFormLoading] = useState(false)
    const createModal = useSimpleDisclosure()
    const editModal = useSimpleDisclosure()
    const deleteModal = useSimpleDisclosure()

    // Only show page to superusers
    if (!currentUser?.is_superuser) {
        return (
            <Box textAlign="center" py={10}>
                <Text fontSize="lg" color="gray.500">
                    Access denied. This page is only available to superusers.
                </Text>
            </Box>
        )
    }

    useEffect(() => {
        loadUsers()
    }, [])

    async function loadUsers() {
        try {
            setError('')
            setLoading(true)
            const data = await listUsers()
            setUsers(data)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateUser(formData: CreateUserForm | UpdateUserForm) {
        setFormLoading(true)
        try {
            const newUser = await createUser(formData as CreateUserForm)
            setUsers(prev => [...prev, newUser])
            createModal.onClose()
        } catch (err: any) {
            throw err // Let the form handle the error
        } finally {
            setFormLoading(false)
        }
    }

    async function handleUpdateUser(formData: CreateUserForm | UpdateUserForm) {
        if (!editingUser) return
        
        setFormLoading(true)
        try {
            const updatedUser = await updateUser(editingUser.id, formData as UpdateUserForm)
            setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u))
            editModal.onClose()
            setEditingUser(null)
        } catch (err: any) {
            throw err // Let the form handle the error
        } finally {
            setFormLoading(false)
        }
    }

    async function handleDeleteUser() {
        if (!deletingUser) return

        try {
            await deleteUser(deletingUser.id)
            setUsers(prev => prev.filter(u => u.id !== deletingUser.id))
            deleteModal.onClose()
            setDeletingUser(null)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete user')
        }
    }

    async function handleSendVerification(user: User) {
        try {
            setSendingVerification(user.id)
            const res = await sendVerification(user.id)
            console.log('Verification email prepared:', res)
        } catch (e: any) {
            console.error('Failed to send verification', e?.response?.data || e)
        } finally {
            setSendingVerification(null)
        }
    }

    if (loading) {
        return <Text>Loading users...</Text>
    }

    return (
        <VStack align="stretch" gap={6}>
            <HStack justify="space-between">
                <Heading size="xl"  fontWeight="bold">Users</Heading>
                <Button onClick={createModal.onOpen} colorPalette={"yellow"}>
                    <FiUserPlus style={{ marginRight: '8px' }} />
                    Add User
                </Button>
            </HStack>

            {error && (
                <Box bg="red.50" border="1px solid" borderColor="red.200" p={3} borderRadius="md">
                    <Text color="red.600" fontSize="sm">{error}</Text>
                </Box>
            )}

            <UsersTable
                users={users}
                currentUserId={currentUser?.id}
                onEdit={(u) => { setEditingUser(u); editModal.onOpen() }}
                onDelete={(u) => { setDeletingUser(u); deleteModal.onOpen() }}
                onSendVerification={handleSendVerification}
            />

            {/* Create User Modal */}
            {createModal.open && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1000}>
                    <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
                        <Flex justify="space-between" align="center" mb={4}>
                            <Heading size="md">Create New User</Heading>
                            <Button size="xs" variant="ghost" onClick={createModal.onClose}><FiX /></Button>
                        </Flex>
                        <UserForm
                            onSubmit={handleCreateUser}
                            onCancel={createModal.onClose}
                            loading={formLoading}
                        />
                    </Box>
                </Box>
            )}

            {/* Edit User Modal */}
            {editModal.open && editingUser && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1000}>
                    <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
                        <Flex justify="space-between" align="center" mb={4}>
                            <Heading size="md">Edit User</Heading>
                            <Button size="xs" variant="ghost" onClick={() => { editModal.onClose(); setEditingUser(null) }}><FiX /></Button>
                        </Flex>
                        <UserForm
                            user={editingUser}
                            onSubmit={handleUpdateUser}
                            onCancel={() => { editModal.onClose(); setEditingUser(null) }}
                            loading={formLoading}
                        />
                    </Box>
                </Box>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.open && deletingUser && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1000}>
                    <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
                        <Flex justify="space-between" align="center" mb={4}>
                            <Heading size="md">Delete User</Heading>
                            <Button size="sm" variant="ghost" onClick={() => { deleteModal.onClose(); setDeletingUser(null) }}><FiX /></Button>
                        </Flex>
                        <VStack gap={4}>
                            <Text>
                                Are you sure you want to delete user "{deletingUser.email}"? This action cannot be undone.
                            </Text>
                            <HStack gap={2} justify="end" w="full">
                                <Button variant="outline" onClick={() => { deleteModal.onClose(); setDeletingUser(null) }}>
                                    Cancel
                                </Button>
                                <Button colorPalette="red" onClick={handleDeleteUser}>
                                    Delete User
                                </Button>
                            </HStack>
                        </VStack>
                    </Box>
                </Box>
            )}
        </VStack>
    )
}
