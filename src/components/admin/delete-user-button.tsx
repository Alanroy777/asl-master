'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteUser } from '@/app/lib/actions'
import { Button } from '@/components/ui/button'
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteUserButton({ userId, userName, disabled }: { userId: string, userName: string, disabled?: boolean }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteUser(userId)
            if (result?.success) {
                toast.success('User deleted successfully')
                setIsOpen(false)
                router.refresh()
            } else {
                toast.error(result?.message || 'Failed to delete user')
            }
        } catch (error) {
            toast.error('An error occurred while deleting the user.')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" disabled={disabled || isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user 
                        <strong className="text-foreground"> {userName} </strong> 
                        and all of their data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Delete User
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
