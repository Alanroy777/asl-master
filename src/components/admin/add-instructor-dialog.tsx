'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createInstructor } from '@/app/lib/actions'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

export function AddInstructorDialog() {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setIsPending(true)
        
        const formData = new FormData(e.currentTarget)
        const result = await createInstructor(null, formData)
        
        if (result) {
            setError(result)
            setIsPending(false)
        } else {
            toast.success("Instructor added successfully!")
            setOpen(false)
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!isPending) setOpen(v)
            if (!v) setError(null) // Clear error on close
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Instructor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Instructor</DialogTitle>
                    <DialogDescription>
                        Create a new instructor account with their details and background.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" required placeholder="Jane Doe" disabled={isPending} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" placeholder="+1 (555) 000-0000" disabled={isPending} />
                        </div>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required placeholder="jane@example.com" disabled={isPending} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Address / Location</Label>
                        <Input id="address" name="address" placeholder="City, State" disabled={isPending} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="qualification">Qualification</Label>
                        <Input id="qualification" name="qualification" placeholder="e.g. BA in Deaf Studies" disabled={isPending} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="background">ASL Proficiency Background</Label>
                        <Select name="background" disabled={isPending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select proficiency level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Native">Native Signer</SelectItem>
                                <SelectItem value="Fluent">Fluent Signer</SelectItem>
                                <SelectItem value="Certified">Certified Interpreter</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {error && <div className="text-sm text-destructive bg-destructive/15 p-3 rounded-md">{error}</div>}
                    
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Account
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
