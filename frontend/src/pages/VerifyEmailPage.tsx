import { useEffect, useState } from 'react'
import { Box, Button, Card, Heading, HStack, Icon, Spinner, Text } from '@chakra-ui/react'
import { useSearchParams, Link as RouterLink, useNavigate } from 'react-router-dom'
import { confirmEmailVerification } from '../api'
import { useAuth } from '../auth'
import { FiCheckCircle, FiAlertTriangle, FiHome, FiLogIn } from 'react-icons/fi'

type Status = 'idle' | 'pending' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string>('')
  const { user, refreshMe } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!token) {
        setStatus('error')
        setMessage('Missing verification token in URL.')
        return
      }
      setStatus('pending')
      try {
        await confirmEmailVerification(token)
        if (cancelled) return
        setStatus('success')
        setMessage('Your email has been verified successfully.')
        // Refresh current user if already logged in
        try { await refreshMe() } catch {}
        // Optional redirect after a short delay if logged in
        setTimeout(() => {
          if (!cancelled && user) {
            navigate('/')
          }
        }, 1500)
      } catch (e: any) {
        if (cancelled) return
        setStatus('error')
        const detail = (e?.response?.data?.detail) || e?.message || 'Invalid or expired token.'
        setMessage(String(detail))
      }
    }
    run()
    return () => { cancelled = true }
  }, [token])

  return (
    <Box maxW="lg" mx="auto" mt={16} px={4}>
      <Card.Root>
        <Card.Body>
          <HStack gap={3} mb={2}>
            {status === 'success' && <Icon color="green.500"><FiCheckCircle /></Icon>}
            {status === 'error' && <Icon color="orange.500"><FiAlertTriangle /></Icon>}
            <Heading size="md">Email Verification</Heading>
          </HStack>
          {status === 'pending' && (
            <HStack gap={3} alignItems="center">
              <Spinner />
              <Text>Verifying your email…</Text>
            </HStack>
          )}
          {status !== 'pending' && (
            <Text mb={4}>{message}</Text>
          )}
          <HStack gap={3}>
            {user ? (
              <Button onClick={() => navigate('/')}> 
                <HStack gap={2}><Icon><FiHome /></Icon><Text>Go to dashboard</Text></HStack>
              </Button>
            ) : (
              <Button asChild>
                <RouterLink to="/login">
                  <HStack gap={2}><Icon><FiLogIn /></Icon><Text>Go to login</Text></HStack>
                </RouterLink>
              </Button>
            )}
          </HStack>
        </Card.Body>
      </Card.Root>
    </Box>
  )
}
