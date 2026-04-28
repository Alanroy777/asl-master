'use client'

import { useActionState, useState, useEffect, Suspense } from 'react'
import { resetPassword } from '@/app/lib/emailActions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import AuthLayout from '@/components/auth/auth-layout'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [errorMessage, dispatch, isPending] = useActionState(
        resetPassword,
        null,
    )

    const [isSuccess, setIsSuccess] = useState(false)
    const [wasSubmitted, setWasSubmitted] = useState(false)

    useEffect(() => {
        if (wasSubmitted && !isPending && !errorMessage) {
            setIsSuccess(true)
        }
    }, [isPending, errorMessage, wasSubmitted])

    if (!token) {
        return (
            <div className="flex flex-col space-y-6 text-center">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Invalid Link</h1>
                    <p className="text-sm text-destructive">
                        This password reset link is invalid or missing.
                    </p>
                </div>
                <Button asChild variant="secondary" className="mt-4">
                    <Link href="/forgot-password">
                        Request New Link
                    </Link>
                </Button>
            </div>
        )
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Password Reset</h1>
                    <p className="text-sm text-muted-foreground">
                        Your password has been successfully reset. You can now login.
                    </p>
                </div>
                <Button asChild className="mt-4">
                    <Link href="/login">
                        Login
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your new password below.
                </p>
            </div>

            <div className="grid gap-6">
                <form action={(formData) => {
                    setWasSubmitted(true)
                    dispatch(formData)
                }}>
                    <input type="hidden" name="token" value={token} />
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <PasswordInput id="password" name="password" placeholder="Min. 8 characters" minLength={8} required disabled={isPending} />
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {errorMessage}
                            </div>
                        )}

                        <Button disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reset Password
                        </Button>
                    </div>
                </form>
            </div>

            <div className="text-center text-sm">
                <Link href="/login" className="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                </Link>
            </div>
        </>
    )
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout>
            <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /></div>}>
                <ResetPasswordForm />
            </Suspense>
        </AuthLayout>
    )
}
