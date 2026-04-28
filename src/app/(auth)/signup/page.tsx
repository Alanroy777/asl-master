'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signup } from '@/app/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import AuthLayout from '@/components/auth/auth-layout'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'

function SignupForm() {
    const [errorMessage, dispatch, isPending] = useActionState(
        signup,
        null,
    )

    // Redirect to login if signup is successful (errorMessage is null after submission)
    // We need a way to track if submission happened. 
    // Re-implementing with a client-side wrapper or Effect.
    // Actually, let's use the 'wasSubmitted' pattern again or just check if !isPending and we had a submission.

    // Better approach: Have the action return { success: boolean, message: string } or similar, 
    // but preserving current signature:
    // We can detecting success if we track 'isPending' transition from true to false AND errorMessage is null.

    const [wasSubmitted, setWasSubmitted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (wasSubmitted && !isPending && !errorMessage) {
            // Success!
            router.push('/login?signup=success')
        }
    }, [isPending, errorMessage, wasSubmitted, router])

    const handleSubmit = (formData: FormData) => {
        setWasSubmitted(true)
        dispatch(formData)
    }

    return (
        <>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email below to create your account
                </p>
            </div>

            <div className="grid gap-6">
                <form action={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" required disabled={isPending} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required disabled={isPending} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput id="password" name="password" placeholder="Min. 6 characters" minLength={6} required disabled={isPending} />
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {errorMessage}
                            </div>
                        )}

                        <Button disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign Up with Email
                        </Button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <Button variant="outline" type="button" disabled={isPending} onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Google
                </Button>
            </div>

            <p className="px-8 text-center text-sm text-muted-foreground">
                By clicking continue, you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                    Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                    Privacy Policy
                </Link>
                .
            </p>

            <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4 font-medium text-primary">
                    Login
                </Link>
            </div>
        </>
    )
}

export default function SignupPage() {
    return (
        <AuthLayout>
            <SignupForm />
        </AuthLayout>
    )
}
