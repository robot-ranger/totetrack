import { useEffect, useMemo, useState } from 'react'
import { Box, Card, HStack, Heading, Separator, Stack, Text, Button, Badge, Input, Spacer, IconButton, Container } from '@chakra-ui/react'
import { useAuth } from '../auth'
import { fetchCheckedOutItems, checkinItem, listTotes, updateUser, requestPasswordRecovery, confirmPasswordRecovery, initSelfVerification } from '../api'
import type { CheckedOutItem, ItemWithCheckoutStatus, Tote } from '../types'
import ItemsTable from '../components/ItemsTable'
import { FiEdit3 } from 'react-icons/fi'

export default function MyProfilePage() {
    const { user, refreshMe } = useAuth()
    const [checkedOut, setCheckedOut] = useState<CheckedOutItem[]>([])
    const [totes, setTotes] = useState<Tote[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [name, setName] = useState<string>(user?.full_name || '')
    const [password, setPassword] = useState('')
    const [password2, setPassword2] = useState('')
    const [message, setMessage] = useState<string>('')
    const [error, setError] = useState<string>('')
    const [editUser, setEditUser] = useState(false)
    const [sendingVerification, setSendingVerification] = useState(false)

    const myItems: ItemWithCheckoutStatus[] = useMemo(() => {
        if (!user) return []
        return checkedOut
            .filter(co => co.user_id === user.id)
            .map(co => ({
                ...co.item,
                is_checked_out: true,
                checked_out_at: co.checked_out_at,
                checked_out_by: co.user,
            }))
    }, [checkedOut, user])

    async function load() {
        setLoading(true)
        try {
            if (!user?.is_verified) {
                // Skip loading functional data for unverified users
                setCheckedOut([])
                setTotes([])
                return
            }
            const [cos, totesList] = await Promise.all([
                fetchCheckedOutItems(),
                listTotes(),
            ])
            setCheckedOut(cos)
            setTotes(totesList)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    async function onCheckin(itemId: string) {
        try {
            await checkinItem(itemId)
            await load()
        } catch (e) {
            console.error('Failed to check in item', e)
        }
    }

    async function onSaveProfile() {
        if (!user) return
        setError('')
        setMessage('')
        setSaving(true)
        try {
            const ops: Promise<any>[] = []

            // Full name update: only superusers can update via /users/{id}
            const trimmedName = name.trim()
            if (trimmedName !== (user.full_name || '')) {
                if (user.is_superuser) {
                    ops.push(updateUser(user.id, { full_name: trimmedName }))
                } else {
                    // Non-superusers cannot change their name with current API
                    setError(prev => (prev ? prev + '\n' : '') + 'Only an admin can change your name.')
                }
            }

            // Password change
            if (password || password2) {
                if (password !== password2) {
                    setSaving(false)
                    setError(prev => (prev ? prev + '\n' : '') + 'Passwords do not match.')
                    return
                }
                if (password.length < 1) {
                    setSaving(false)
                    setError(prev => (prev ? prev + '\n' : '') + 'Password cannot be empty.')
                    return
                }
                if (user.is_superuser) {
                    ops.push(updateUser(user.id, { password }))
                } else {
                    // For non-superusers, use recovery flow to change own password
                    try {
                        const init = await requestPasswordRecovery(user.email)
                        const token = (init as any)?.recovery_token
                        if (!token) throw new Error('Failed to obtain recovery token')
                        await confirmPasswordRecovery(token, password)
                    } catch (e) {
                        console.error('Password change via recovery failed', e)
                        setError(prev => (prev ? prev + '\n' : '') + 'Could not change password. Please try again or contact an admin.')
                    }
                }
            }

            if (ops.length > 0) {
                await Promise.all(ops)
            }

            await refreshMe()
            setMessage('Profile updated')
            setPassword('')
            setPassword2('')
        } catch (e: any) {
            console.error('Failed to save profile', e)
            setError(e?.response?.data?.detail || 'Failed to save profile')
        } finally {
            setSaving(false)
        }
    }

    async function onResendVerification() {
        setError('')
        setMessage('')
        setSendingVerification(true)
        try {
            const res = await initSelfVerification()
            console.log('Verification email prepared', res)
            setMessage('Verification email sent. Please check your inbox.')
        } catch (e: any) {
            console.error('Failed to send verification email', e)
            setError(e?.response?.data?.detail || 'Failed to send verification email')
        } finally {
            setSendingVerification(false)
        }
    }

    if (!user) return null

    return (
        <Stack gap={6}>
            <HStack align="center" w="full">
                <Heading fontSize="xl" fontWeight="bold">
                    My Profile
                </Heading>
                <Badge variant="solid" colorPalette={user.is_superuser ? 'inherit' : 'gray'}>
                    {user.is_superuser ? 'Superuser' : 'User'}
                </Badge>
                <Badge variant="subtle" colorPalette={user.is_verified ? 'green' : 'orange'}>
                    {user.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
            </HStack>
            <Card.Root>
                <Separator />
                <Card.Body>
                    <Stack gap={2} fontSize="sm">
                        <HStack gap={6} wrap="wrap">
                            <Box>
                                <Text color="fg.subtle">Name</Text>
                                <Input disabled={!editUser} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxW="md" />
                            </Box>
                            <Box>
                                <Text color="fg.subtle">Email</Text>
                                <Text fontWeight="medium">{user.email}</Text>
                            </Box>
                            <Box>
                                <Text color="fg.subtle">Account ID</Text>
                                <Text fontWeight="medium">{user.account_id}</Text>
                            </Box>
                            <Spacer />
                            <IconButton size='xs' variant={editUser ? 'solid' : 'ghost'} onClick={() => setEditUser(!editUser)}><FiEdit3 /></IconButton>
                        </HStack>
                        <Stack hidden={!editUser} >
                            <Separator my={2} />
                            <HStack gap={6} wrap="wrap">
                                <Box>
                                    <Text color="fg.subtle">New Password</Text>
                                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" maxW="md" />
                                </Box>
                                <Box>
                                    <Text color="fg.subtle">Confirm Password</Text>
                                    <Input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="••••••••" maxW="md" />
                                </Box>
                            </HStack>
                            {(error || message) && (
                                <Text color={error ? 'red.500' : 'green.600'} fontSize="sm">{error || message}</Text>
                            )}
                            <HStack>
                                <Button size="sm" colorPalette="yellow" onClick={onSaveProfile} loading={saving}>Save Changes</Button>
                            </HStack></Stack>
                    </Stack>
                </Card.Body>
            </Card.Root>
            {!user.is_verified ? (
                <Card.Root>
                    <Card.Body>
                        <Stack gap={3}>
                            <Heading size="sm">Email verification required</Heading>
                            <Text color="fg.subtle">Your email address is not verified yet. You won’t be able to use app features until verification is completed.</Text>
                            {(error || message) && (
                                <Text color={error ? 'red.500' : 'green.600'} fontSize="sm">{error || message}</Text>
                            )}
                            <HStack>
                                <Button size="sm" onClick={onResendVerification} loading={sendingVerification} colorPalette="blue">
                                    Resend Verification Email
                                </Button>
                            </HStack>
                        </Stack>
                    </Card.Body>
                </Card.Root>
            ) : (
                <>
                    <HStack justify="space-between" align="center" w="full" >
                        <Heading size="sm" >My Checked Out Items</Heading>
                    </HStack>
                    <ItemsTable
                        items={myItems}
                        totes={totes}
                        onCheckin={onCheckin}
                    />
                    {myItems.length === 0 && (
                        <Text color="fg.subtle" mt={2}>No items checked out.</Text>
                    )}
                </>
            )}

        </Stack>
    )
}
