'use client'

import { useActionState } from 'react'
import { forgotPassword } from '@/app/lib/emailActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import AuthLayout from '@/components/auth/auth-layout'
import { Loader2, ArrowLeft } from 'lucide-react'

function ForgotPasswordForm() {
    const [errorMessage, dispatch, isPending] = useActionState(forgotPassword, null)

    return (
        <>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email and we&apos;ll send a 6-digit OTP to reset your password.
                </p>
            </div>

            <div className="grid gap-6">
                <form action={dispatch}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                disabled={isPending}
                            />
                        </div>

                        {errorMessage && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {errorMessage}
                            </div>
                        )}

                        <Button disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send OTP
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

export default function ForgotPasswordPage() {
    return (
        <AuthLayout>
            <ForgotPasswordForm />
        </AuthLayout>
    )
}
