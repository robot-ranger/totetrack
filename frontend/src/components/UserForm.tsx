import { useState } from 'react'
import {
    Button,
    VStack,
    Input,
    Text,
    HStack,
    Box,
} from '@chakra-ui/react'
import type { User } from '../types'
import type { CreateUserForm, UpdateUserForm } from '../api'

interface UserFormProps {
    user?: User | null
    onSubmit: (data: CreateUserForm | UpdateUserForm) => Promise<void>
    onCancel: () => void
    loading?: boolean
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
                {label}
                {required && <Text as="span" color="red.500">*</Text>}
            </Text>
            {children}
        </Box>
    )
}

export default function UserForm({ user, onSubmit, onCancel, loading }: UserFormProps) {
    const [email, setEmail] = useState(user?.email || '')
    const [fullName, setFullName] = useState(user?.full_name || '')
    const [password, setPassword] = useState('')
    const [isActive, setIsActive] = useState(user?.is_active ?? true)
    const [isSuperuser, setIsSuperuser] = useState(user?.is_superuser || false)
    const [error, setError] = useState('')

    const isEditing = !!user

    async function handleSubmit() {
        try {
            setError('')
            
            if (!email.trim()) {
                setError('Email is required')
                return
            }

            if (!isEditing && !password.trim()) {
                setError('Password is required for new users')
                return
            }

            const formData = isEditing 
                ? {
                    full_name: fullName.trim() || undefined,
                    ...(password.trim() && { password: password.trim() }),
                    is_active: isActive,
                    is_superuser: isSuperuser,
                } as UpdateUserForm
                : {
                    email: email.trim(),
                    full_name: fullName.trim() || undefined,
                    password: password.trim(),
                    is_superuser: isSuperuser,
                } as CreateUserForm

            await onSubmit(formData)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'An error occurred')
        }
    }

    return (
        <VStack gap={4} align="stretch">
            {error && <Text color="red.500" fontSize="sm">{error}</Text>}
            
            <Field label="Email" required>
                <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={isEditing} // Email cannot be changed when editing
                />
            </Field>

            <Field label="Full Name">
                <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                />
            </Field>

            <Field label={isEditing ? "New Password (leave blank to keep current)" : "Password"} required={!isEditing}>
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                />
            </Field>

            {isEditing && (
                <Field label="Account Status">
                    <label>
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            style={{ marginRight: '8px' }}
                        />
                        Active
                    </label>
                </Field>
            )}

            <Field label="Permissions">
                <label>
                    <input
                        type="checkbox"
                        checked={isSuperuser}
                        onChange={(e) => setIsSuperuser(e.target.checked)}
                        style={{ marginRight: '8px' }}
                    />
                    Superuser (full admin access)
                </label>
            </Field>

            <HStack gap={2} justify="end">
                <Button variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} loading={loading} colorPalette={"yellow"}>
                    {isEditing ? 'Update User' : 'Create User'}
                </Button>
            </HStack>
        </VStack>
    )
}
