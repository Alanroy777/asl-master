
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Home, BookOpen, Camera, User, Brain, Keyboard } from "lucide-react"
import { SignOutButton } from "@/components/sign-out-button"



export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 lg:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                            <span className="">ASL Learning</span>
                        </Link>
                    </div>
                    <div className="flex-1">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
                            >
                                <Home className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <Link
                                href="/learn"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <BookOpen className="h-4 w-4" />
                                Lessons
                            </Link>
                            <Link
                                href="/practice"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Camera className="h-4 w-4" />
                                Practice
                            </Link>
                            <Link
                                href="/dictionary"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <BookOpen className="h-4 w-4" />
                                Dictionary
                            </Link>
                            <Link
                                href="/vocabulary"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Brain className="h-4 w-4" />
                                Vocabulary
                            </Link>
                            <Link
                                href="/games/fingerspelling"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Keyboard className="h-4 w-4" />
                                Games
                            </Link>
                            <Link
                                href="/profile"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <User className="h-4 w-4" />
                                Profile
                            </Link>

                        </nav>
                    </div>
                    <div className="mt-auto p-4">
                        <SignOutButton />
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <div className="w-full flex-1">
                        <h1 className="text-lg font-semibold">Welcome back!</h1>
                    </div>
                    <div className="block lg:hidden">
                        {/* Mobile Menu Trigger would go here */}
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
