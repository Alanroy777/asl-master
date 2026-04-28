'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

const ForgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email address." })
})

const ResetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(8, { message: "Password must be at least 8 characters." })
})

export async function forgotPassword(prevState: string | null | undefined, formData: FormData) {
    const validation = ForgotPasswordSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validation.success) return "Invalid email address."

    const { email } = validation.data

    await new Promise(resolve => setTimeout(resolve, 500))

    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            redirect(`/verify-otp?email=${encodeURIComponent(email)}`)
        }

        await prisma.passwordResetToken.deleteMany({ where: { email } })

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex')
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

        await prisma.passwordResetToken.create({
            data: { email, token: hashedOtp, expiresAt }
        })

        const { createSmtpTransporter, OTP_EMAIL_TEMPLATE } = await import('@/lib/email')
        const transporter = await createSmtpTransporter()
        await transporter.sendMail({
            from: `"ASL Learning" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: "Your ASL Learning OTP Code",
            html: OTP_EMAIL_TEMPLATE(email, otp),
        })

        console.log(`✅ OTP sent to: ${email}`)
    } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error
        console.error("Forgot Password Error:", error)
        return "Failed to send OTP. Please try again later."
    }

    redirect(`/verify-otp?email=${encodeURIComponent(email)}`)
}

export async function verifyOtp(prevState: string | null | undefined, formData: FormData) {
    const email = formData.get('email') as string
    const otpDigits = [
        formData.get('otp0'), formData.get('otp1'), formData.get('otp2'),
        formData.get('otp3'), formData.get('otp4'), formData.get('otp5'),
    ]
    const otp = otpDigits.map(d => (d as string) || '').join('')

    if (!email || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        return "Please enter a valid 6-digit OTP."
    }

    let resetToken = ''

    try {
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex')
        const record = await prisma.passwordResetToken.findFirst({
            where: { email, token: hashedOtp }
        })

        if (!record) return "Invalid OTP. Please check and try again."

        if (new Date() > record.expiresAt) {
            await prisma.passwordResetToken.delete({ where: { id: record.id } })
            return "OTP has expired. Please request a new one."
        }

        await prisma.passwordResetToken.delete({ where: { id: record.id } })

        resetToken = crypto.randomBytes(32).toString('hex')
        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
        const resetExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

        await prisma.passwordResetToken.create({
            data: { email, token: hashedResetToken, expiresAt: resetExpiresAt }
        })
    } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error
        console.error("Verify OTP Error:", error)
        return "Something went wrong. Please try again."
    }

    redirect(`/reset-password?token=${encodeURIComponent(resetToken)}`)
}

export async function resetPassword(prevState: string | null | undefined, formData: FormData) {
    const validation = ResetPasswordSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validation.success) return "Invalid input."

    const { token, password } = validation.data
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    try {
        const existingToken = await prisma.passwordResetToken.findUnique({
            where: { token: hashedToken }
        })

        if (!existingToken || new Date() > existingToken.expiresAt) {
            return "Invalid or expired token."
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.update({
            where: { email: existingToken.email },
            data: { password: hashedPassword }
        })

        await prisma.passwordResetToken.delete({ where: { id: existingToken.id } })
        return null
    } catch (error) {
        console.error("Reset Password Error:", error)
        return "Failed to reset password."
    }
}
