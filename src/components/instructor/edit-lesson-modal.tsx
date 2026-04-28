'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Loader2 } from "lucide-react"
import { updateLesson } from "@/app/lib/actions"
import { toast } from "sonner"

interface EditLessonModalProps {
    lesson: {
        id: string
        title: string
        description: string | null
        orderIndex: number
        xpReward: number
        isLockedDefault: boolean
    }
}

export function EditLessonModal({ lesson }: EditLessonModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            const result = await updateLesson(null, formData)
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit Chapter</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Chapter</DialogTitle>
                    <DialogDescription>
                        Update chapter details.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="id" value={lesson.id} />

                    <div className="grid gap-2">
                        <Label htmlFor="title">Chapter Title</Label>
                        <Input id="title" name="title" defaultValue={lesson.title} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" defaultValue={lesson.description || ''} placeholder="Short description..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="orderIndex">Order</Label>
                            <Input id="orderIndex" name="orderIndex" type="number" defaultValue={lesson.orderIndex} min="0" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="xpReward">XP Reward</Label>
                            <Input id="xpReward" name="xpReward" type="number" defaultValue={lesson.xpReward} min="0" required />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="isLockedDefault" name="isLockedDefault" defaultChecked={lesson.isLockedDefault} />
                        <Label htmlFor="isLockedDefault">Locked by default</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
