'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLogin = pathname === "/login"
    const isSignup = pathname === "/signup"

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Brand/Creative */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 text-white p-12 relative overflow-hidden">
                {/* Background Gradient/Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black z-0" />
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }}></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        ASL Learning
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4">
                        Master American Sign Language today.
                    </h1>
                    <p className="text-lg text-zinc-400">
                        Join thousands of learners mastering ASL through real-time feedback and interactive lessons.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-zinc-500">
                    &copy; {new Date().getFullYear()} ASL Learning Platform.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center p-6 md:p-12 bg-background">
                <div className="w-full max-w-[400px] flex flex-col gap-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
