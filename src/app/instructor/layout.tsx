
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, BookOpen, Users, LogOut, GraduationCap, User as UserIcon } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'

export default function InstructorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-zinc-950">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 font-bold text-xl text-primary">
                        <GraduationCap className="h-6 w-6" />
                        <span>Instructor</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/instructor/dashboard">
                        <Button variant="ghost" className="w-full justify-start gap-2 mb-1">
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/instructor/curriculum">
                        <Button variant="ghost" className="w-full justify-start gap-2 mb-1">
                            <BookOpen className="h-4 w-4" />
                            Curriculum
                        </Button>
                    </Link>
                    <Link href="/instructor/students">
                        <Button variant="ghost" className="w-full justify-start gap-2 mb-1">
                            <Users className="h-4 w-4" />
                            Students
                        </Button>
                    </Link>
                    <Link href="/instructor/profile">
                        <Button variant="ghost" className="w-full justify-start gap-2 mb-1">
                            <UserIcon className="h-4 w-4" />
                            Profile
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
                    <SignOutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
