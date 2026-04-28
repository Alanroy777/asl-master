'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { createSign } from "@/app/lib/actions"
import { toast } from "sonner"

interface Lesson {
    id: string
    title: string
}

interface CreateSignModalProps {
    lessons: Lesson[]
    defaultLessonId?: string
}

export function CreateSignModal({ lessons, defaultLessonId }: CreateSignModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            const result = await createSign(null, formData)
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add Sign</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Sign</DialogTitle>
                    <DialogDescription>
                        Add a sign to the dictionary and chapter.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="word">Word / Phrase</Label>
                        <Input id="word" name="word" placeholder="e.g. Thank You" required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="A brief description of how to perform the sign..." />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="videoUrl">Video URL</Label>
                        <Input id="videoUrl" name="videoUrl" placeholder="https://..." required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="lessonId">Chapter</Label>
                        <Select name="lessonId" defaultValue={defaultLessonId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a chapter" />
                            </SelectTrigger>
                            <SelectContent>
                                {lessons.map((lesson) => (
                                    <SelectItem key={lesson.id} value={lesson.id}>
                                        {lesson.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" name="category" placeholder="e.g. Greetings" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="difficulty">Difficulty</Label>
                            <Select name="difficulty" defaultValue="1">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Easy</SelectItem>
                                    <SelectItem value="2">Medium</SelectItem>
                                    <SelectItem value="3">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Sign
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
