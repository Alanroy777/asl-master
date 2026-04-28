'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { deleteLesson } from "@/app/lib/actions"
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

interface DeleteLessonButtonProps {
    lessonId: string
    lessonTitle: string
}

export function DeleteLessonButton({ lessonId, lessonTitle }: DeleteLessonButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [open, setOpen] = useState(false)

    async function handleDelete() {
        setIsLoading(true)
        try {
            const result = await deleteLesson(lessonId)
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
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Chapter</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Chapter "{lessonTitle}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the chapter and ALL its signs. This action cannot be undone.
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
