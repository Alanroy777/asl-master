'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { deleteLevel } from "@/app/lib/actions"
import { toast } from "sonner"
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

interface DeleteLevelButtonProps {
    levelId: string
    levelTitle: string
}

export function DeleteLevelButton({ levelId, levelTitle }: DeleteLevelButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [open, setOpen] = useState(false)

    async function handleDelete() {
        setIsLoading(true)
        try {
            const result = await deleteLevel(levelId)
            if (result.success) {
                toast.success(result.message)
                setOpen(false)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Unit</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Unit "{levelTitle}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the unit and ALL its chapters and signs. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
