"use client"

import { useState } from "react"
import { assignTutor } from "@/app/lib/actions"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus } from "lucide-react"

export function AssignTutorDialog({ 
    learnerId, 
    learnerName, 
    currentTutorId,
    instructors 
}: { 
    learnerId: string, 
    learnerName: string,
    currentTutorId?: string | null,
    instructors: { id: string, name: string | null }[]
}) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedTutor, setSelectedTutor] = useState<string>(currentTutorId || "none")

    const handleAssign = async () => {
        setIsSubmitting(true)
        const result = await assignTutor(learnerId, selectedTutor === "none" ? null : selectedTutor)
        setIsSubmitting(false)
        
        if (result?.success) {
            toast.success("Tutor assigned successfully!")
            setOpen(false)
        } else {
            toast.error(result?.message || "Failed to assign tutor")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <UserPlus className="h-4 w-4" />
                    <span>Assign Tutor</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Tutor</DialogTitle>
                    <DialogDescription>
                        Assign an instructor to {learnerName || "this learner"} to provide personalized curriculum.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-sm font-medium text-right">Instructor:</span>
                        <div className="col-span-3">
                            <Select value={selectedTutor} onValueChange={setSelectedTutor} disabled={isSubmitting}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an instructor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Tutor (Global Curriculum)</SelectItem>
                                    {instructors.map(instructor => (
                                        <SelectItem key={instructor.id} value={instructor.id}>
                                            {instructor.name || "Unknown Instructor"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Assignment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
