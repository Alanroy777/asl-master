'use client'

import { useActionState, useRef, Suspense } from 'react'
import { verifyOtp } from '@/app/lib/emailActions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import AuthLayout from '@/components/auth/auth-layout'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function VerifyOtpForm() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''
    const [errorMessage, dispatch, isPending] = useActionState(verifyOtp, null)

    // Refs for each digit box
    const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null))

    const handleInput = (index: number, value: string) => {
        // Accept only digits
        if (!/^\d*$/.test(value)) return
        if (value.length === 1 && index < 5) {
            refs[index + 1].current?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
            refs[index - 1].current?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        text.split('').forEach((char, i) => {
            if (refs[i]?.current) {
                refs[i].current!.value = char
            }
        })
        refs[Math.min(text.length, 5)].current?.focus()
    }

    if (!email) {
        return (
            <div className="flex flex-col space-y-4 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Invalid Link</h1>
                <p className="text-sm text-destructive">Email address is missing from this link.</p>
                <Button asChild variant="secondary">
                    <Link href="/forgot-password">Request OTP Again</Link>
                </Button>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Enter OTP</h1>
                <p className="text-sm text-muted-foreground">
                    We sent a 6-digit code to<br />
                    <span className="font-medium text-foreground">{decodeURIComponent(email)}</span>
                </p>
            </div>

            <form action={dispatch} className="grid gap-6">
                {/* Hidden email field */}
                <input type="hidden" name="email" value={decodeURIComponent(email)} />

                {/* 6-digit OTP boxes */}
                <div className="flex justify-center gap-3">
                    {Array.from({ length: 6 }, (_, i) => (
                        <input
                            key={i}
                            ref={refs[i]}
                            name={`otp${i}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            disabled={isPending}
                            onInput={e => handleInput(i, (e.target as HTMLInputElement).value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            onPaste={i === 0 ? handlePaste : undefined}
                            className="w-12 h-14 text-center text-xl font-bold border-2 border-border rounded-xl bg-background focus:border-foreground focus:outline-none transition-colors disabled:opacity-50"
                            style={{ caretColor: 'transparent' }}
                        />
                    ))}
                </div>

                {errorMessage && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center">
                        {errorMessage}
                    </div>
                )}

                <Button disabled={isPending} className="w-full">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify OTP
                </Button>
            </form>

            <div className="text-center text-sm space-y-2">
                <p className="text-muted-foreground">Didn&apos;t receive the code?</p>
                <Link
                    href="/forgot-password"
                    className="font-medium text-foreground hover:underline"
                >
                    Resend OTP
                </Link>
            </div>

            <div className="text-center">
                <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                </Link>
            </div>
        </>
    )
}

export default function VerifyOtpPage() {
    return (
        <AuthLayout>
            <Suspense fallback={
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            }>
                <VerifyOtpForm />
            </Suspense>
        </AuthLayout>
    )
}
