import { useState } from 'react'
import { Box, Button, Field, Heading, HStack, Input, Link, Stack, Text } from '@chakra-ui/react'
import { requestPasswordRecovery, confirmPasswordRecovery } from '../api'
import { Link as RouterLink } from 'react-router-dom'

export default function PasswordRecoveryPage() {
  const [email, setEmail] = useState('')
  const [requested, setRequested] = useState(false)
  const [serverMsg, setServerMsg] = useState<string | null>(null)
  const [reqErr, setReqErr] = useState<string | null>(null)

  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetMsg, setResetMsg] = useState<string | null>(null)
  const [resetErr, setResetErr] = useState<string | null>(null)

  async function doRequest(e: React.FormEvent) {
    e.preventDefault()
    setReqErr(null)
    setServerMsg(null)
    try {
      const res = await requestPasswordRecovery(email)
      setRequested(true)
      setServerMsg(res.message || 'If the account exists, a recovery token has been generated.')
      // In dev, backend returns recovery_token; show it to aid testing
      if (res.recovery_token) setServerMsg(`Token (dev): ${res.recovery_token}`)
    } catch (err: any) {
      setReqErr(err?.response?.data?.detail || 'Failed to request recovery')
    }
  }

  async function doReset(e: React.FormEvent) {
    e.preventDefault()
    setResetErr(null)
    setResetMsg(null)
    try {
      const res = await confirmPasswordRecovery(token, newPassword)
      setResetMsg(res.message)
    } catch (err: any) {
      setResetErr(err?.response?.data?.detail || 'Failed to reset password')
    }
  }

  return (
    <HStack justify="center" align="center" minH="80vh" p="6">
      <Box p="6" w="sm" borderWidth="1px" rounded="md">
        <Stack gap="6">
          <Box>
            <Heading size="md" mb="3">Password recovery</Heading>
            <form onSubmit={doRequest}>
              <Stack gap="3">
                <Field.Root>
                  <label htmlFor="recover-email" style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem' }}>Email</label>
                  <Input id="recover-email" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
                </Field.Root>
                {reqErr && <Text color="red.500" fontSize="sm">{reqErr}</Text>}
                {serverMsg && <Text color="green.600" fontSize="sm" whiteSpace="pre-wrap">{serverMsg}</Text>}
                <Button type="submit">Send recovery email</Button>
              </Stack>
            </form>
          </Box>

          <Box>
            <Heading size="sm" mb="3">Have a token?</Heading>
            <form onSubmit={doReset}>
              <Stack gap="3">
                <Field.Root>
                  <label htmlFor="recover-token" style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem' }}>Token</label>
                  <Input id="recover-token" value={token} onChange={(e) => setToken(e.currentTarget.value)} required />
                </Field.Root>
                <Field.Root>
                  <label htmlFor="recover-password" style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem' }}>New password</label>
                  <Input id="recover-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.currentTarget.value)} required />
                </Field.Root>
                {resetErr && <Text color="red.500" fontSize="sm">{resetErr}</Text>}
                {resetMsg && <Text color="green.600" fontSize="sm">{resetMsg}</Text>}
                <Button type="submit">Reset password</Button>
              </Stack>
            </form>
          </Box>

          <Box>
            <Link asChild color="blue.500"><RouterLink to="/login">Back to login</RouterLink></Link>
          </Box>
        </Stack>
      </Box>
    </HStack>
  )
}
