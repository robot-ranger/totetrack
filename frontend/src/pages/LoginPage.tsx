import { useState } from 'react'
import { Box, Button, Heading, HStack, Input, Link, Stack, Text } from '@chakra-ui/react'
import { login } from '../api'
import { useAuth } from '../auth'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { setToken } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await login(email, password)
      setToken(res.access_token)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <HStack justify="center" align="center" minH="80vh" p="6">
      <Box p="6" w="sm" borderWidth="1px" rounded="md">
        <Heading size="md" mb="4">Sign in</Heading>
        <form onSubmit={onSubmit}>
          <Stack gap="3">
            <Box>
              <label htmlFor="email" style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem' }}>Email</label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.currentTarget.value)} required />
            </Box>
            <Box>
              <label htmlFor="password" style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem' }}>Password</label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.currentTarget.value)} required />
            </Box>
            {error && <Text color="red.500" fontSize="sm">{error}</Text>}
            <Button type="submit" colorPalette={"yellow"} disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
            <Box>
              <Link asChild color="blue.500">
                <RouterLink to="/recover">Forgot password?</RouterLink>
              </Link>
            </Box>
          </Stack>
        </form>
      </Box>
    </HStack>
  )
}
