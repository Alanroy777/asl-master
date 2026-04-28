import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth } from "@/auth"
import { updateProfile, getUserProfileStats } from "@/app/lib/actions"
import { redirect } from "next/navigation"
import { SubmitButton } from "@/components/submit-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ClientBackButton } from "@/components/client-back-button"

export default async function EditProfilePage() {
    const session = await auth()
    if (!session?.user?.email) redirect('/login')

    const stats = await getUserProfileStats(session.user.email)

    if (!stats) {
        return <div>Profile not found.</div>
    }

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <ClientBackButton fallbackPath="/profile" variant="outline" />
                <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your public profile details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateProfile as any} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" name="name" defaultValue={stats.name || ''} placeholder="Enter your name" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={stats.email || ''} placeholder="Enter your email" />
                            <p className="text-xs text-muted-foreground">Changing your email will update your login credentials.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" defaultValue={stats.phone || ''} placeholder="Enter your phone number" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="age">Age</Label>
                            <Input id="age" name="age" type="number" defaultValue={stats.age || ''} placeholder="Enter your age" />
                        </div>
                        
                        <div className="pt-4 flex justify-end gap-2">
                            <Link href="/profile">
                                <Button variant="outline" type="button">Cancel</Button>
                            </Link>
                            <SubmitButton>Save Changes</SubmitButton>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
