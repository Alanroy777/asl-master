'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Loader2 } from "lucide-react"
import { updateLevel } from "@/app/lib/actions"
import { toast } from "sonner"

interface EditLevelModalProps {
    level: {
        id: string
        title: string
        description: string | null
        orderIndex: number
    }
}

export function EditLevelModal({ level }: EditLevelModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            const result = await updateLevel(null, formData)
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
                <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit Unit</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Unit</DialogTitle>
                    <DialogDescription>
                        Update unit details.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="id" value={level.id} />

                    <div className="grid gap-2">
                        <Label htmlFor="title">Unit Title</Label>
                        <Input id="title" name="title" defaultValue={level.title} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" defaultValue={level.description || ''} placeholder="Short description..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="orderIndex">Order Position</Label>
                        <Input id="orderIndex" name="orderIndex" type="number" defaultValue={level.orderIndex} min="0" required />
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
