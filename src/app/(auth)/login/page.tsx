'use client'

import { useActionState, useState } from 'react'
import { authenticate } from '@/app/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import AuthLayout from '@/components/auth/auth-layout'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'

function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(
        authenticate,
        null,
    )

    const [wasSubmitted, setWasSubmitted] = useState(false)

    // Auth actions usually redirect on success, so we mainly listen for errors or pending state end without redirect (which implies failure if not handled)
    // However, authenticate might return a string error. 

    const handleSubmit = (formData: FormData) => {
        setWasSubmitted(true)
        dispatch(formData)
    }

    return (
        <>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email to sign in to your account
                </p>
            </div>

            <div className="grid gap-6">
                <form action={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required disabled={isPending} />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <PasswordInput id="password" name="password" required disabled={isPending} />
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {errorMessage}
                            </div>
                        )}

                        <Button disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In with Email
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

                <Button variant="outline" type="button" disabled={isPending} onClick={() => signIn('google')}>
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Google
                </Button>
            </div>

            <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline underline-offset-4 font-medium text-primary">
                    Sign up
                </Link>
            </div>
        </>
    )
}

export default function LoginPage() {
    return (
        <AuthLayout>
            <LoginForm />
        </AuthLayout>
    )
}
