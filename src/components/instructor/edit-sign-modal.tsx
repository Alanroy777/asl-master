'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Loader2 } from "lucide-react"
import { updateSign } from "@/app/lib/actions"
import { toast } from "sonner"

interface SignData {
    id: string
    word: string
    description: string | null
    videoUrl: string
    category: string
    difficulty: number
}

interface EditSignModalProps {
    sign: SignData
}

export function EditSignModal({ sign }: EditSignModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            const result = await updateSign(null, formData)
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
                    <Edit className="h-3 w-3" />
                    <span className="sr-only">Edit Sign</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Sign</DialogTitle>
                    <DialogDescription>
                        Update the details for "{sign.word}".
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="id" value={sign.id} />

                    <div className="grid gap-2">
                        <Label htmlFor="word">Word / Phrase</Label>
                        <Input id="word" name="word" defaultValue={sign.word} required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" defaultValue={sign.description || ''} placeholder="A brief description of how to perform the sign..." />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="videoUrl">Video URL</Label>
                        <Input id="videoUrl" name="videoUrl" defaultValue={sign.videoUrl} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" name="category" defaultValue={sign.category} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="difficulty">Difficulty</Label>
                            <Select name="difficulty" defaultValue={sign.difficulty.toString()}>
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
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
