'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole } from '@/app/lib/actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface UserRoleSelectProps {
    userId: string;
    currentRole: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
    disabled?: boolean;
}

export function UserRoleSelect({ userId, currentRole, disabled }: UserRoleSelectProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const router = useRouter()

    const handleRoleChange = async (newRole: string) => {
        setIsUpdating(true)
        try {
            const result = await updateUserRole(userId, newRole as 'LEARNER' | 'INSTRUCTOR' | 'ADMIN')
            
            if (result?.success) {
                toast.success('User role updated successfully')
                router.refresh()
            } else {
                toast.error(result?.message || 'Failed to update user role')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Select 
                defaultValue={currentRole} 
                onValueChange={handleRoleChange} 
                disabled={isUpdating || disabled}
            >
                <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="LEARNER">Learner</SelectItem>
                    <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
            </Select>
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
    )
}
