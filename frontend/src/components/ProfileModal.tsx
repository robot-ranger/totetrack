import { useState } from 'react'
import { Dialog, Button, VStack, Input, Text, HStack, Box, Avatar, CloseButton } from '@chakra-ui/react'
import { useAuth } from '../auth'
import { updateUser } from '../api'
import { FiLogOut, FiSave, FiX } from 'react-icons/fi'

interface ProfileModalProps {
  open: boolean
  onClose: () => void
  onLogout: () => void
}

export function ProfileModal({ open, onClose, onLogout }: ProfileModalProps) {
  const { user, refreshMe } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  if (!user) return null

  async function handleSave() {
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      const body: any = {}
      if (fullName.trim() !== (user!.full_name || '')) body.full_name = fullName.trim()
      if (password.trim()) body.password = password.trim()
      if (Object.keys(body).length) {
        await updateUser(user!.id, body)
        await refreshMe()
        setPassword('')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const D = Dialog as any

  return (
    <D.Root open={open} onOpenChange={(e: any) => { if (!e.open) onClose() }}>
      <D.Backdrop />
      <D.Positioner>
        <D.Content maxW="400px">
          <D.Header>
            <D.Title>Edit Profile</D.Title>
            <D.CloseTrigger asChild>
              <CloseButton size="sm" />
            </D.CloseTrigger>
          </D.Header>
          <D.Body>
            <VStack gap={4} align="stretch">
              <HStack gap={3}>
                <Avatar.Root name={user.full_name || user.email} size="sm" />
                <Box>
                  <Text fontWeight="medium">{user.full_name || 'Unnamed User'}</Text>
                  <Text fontSize="xs" color="fg.muted">Member since {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</Text>
                </Box>
              </HStack>
              {error && <Text fontSize="sm" color="red.500">{error}</Text>}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Email</Text>
                <Input value={user.email} disabled size="sm" />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Full Name</Text>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} size="sm" placeholder="Full name" />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>New Password</Text>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} size="sm" placeholder="Leave blank to keep current" />
              </Box>
              {saved && <Text fontSize="sm" color="green.500">Saved!</Text>}
            </VStack>
          </D.Body>
          <D.Footer>
            <HStack gap={2} justify="space-between" w="full">
              <Button variant="surface" size="sm" colorPalette="red" onClick={onLogout}><FiLogOut/> Logout</Button>
              <Button size="sm" colorPalette={"yellow"} onClick={handleSave} loading={loading} disabled={loading}><FiSave/> Save</Button>
            </HStack>
          </D.Footer>
        </D.Content>
      </D.Positioner>
    </D.Root>
  )
}
