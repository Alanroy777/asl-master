
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OnboardingPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // Simulate API call to save profile
        setTimeout(() => {
            router.push('/dashboard')
        }, 1000)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Welcome to ASL Platform!</CardTitle>
                    <CardDescription>
                        Let&apos;s personalize your learning experience.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">I am a...</Label>
                            <Select defaultValue="student">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="experience">Experience Level</Label>
                            <Select defaultValue="beginner">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner (New to ASL)</SelectItem>
                                    <SelectItem value="some_knowledge">Some Knowledge</SelectItem>
                                    <SelectItem value="expert">Expert</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="goal">Primary Goal</Label>
                            <Select defaultValue="communication">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select goal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="communication">Basic Communication</SelectItem>
                                    <SelectItem value="career">Career Advancement</SelectItem>
                                    <SelectItem value="fun">Just for Fun</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <div className="text-sm text-muted-foreground self-center">
                            Step 1 of 1
                        </div>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Get Started'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
