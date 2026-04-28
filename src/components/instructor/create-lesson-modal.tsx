'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2 } from "lucide-react"
import { createLesson } from "@/app/lib/actions"
import { toast } from "sonner"

interface Level {
    id: string
    title: string
}

interface CreateLessonModalProps {
    levels: Level[]
}

export function CreateLessonModal({ levels }: CreateLessonModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            const result = await createLesson(null, formData)
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
                <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Chapter
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Chapter</DialogTitle>
                    <DialogDescription>
                        Create a chapter within a specific unit.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Chapter Title</Label>
                        <Input id="title" name="title" placeholder="e.g. Greetings" required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="A brief description of this chapter..." />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="levelId">Unit</Label>
                        <Select name="levelId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                            <SelectContent>
                                {levels.map((level) => (
                                    <SelectItem key={level.id} value={level.id}>
                                        {level.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="orderIndex">Order</Label>
                            <Input id="orderIndex" name="orderIndex" type="number" defaultValue="0" min="0" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="xpReward">XP Reward</Label>
                            <Input id="xpReward" name="xpReward" type="number" defaultValue="50" min="0" required />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox id="isLockedDefault" name="isLockedDefault" defaultChecked />
                        <Label htmlFor="isLockedDefault">Locked by default</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Chapter
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
