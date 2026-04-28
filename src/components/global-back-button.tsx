'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

export function GlobalBackButton() {
    const router = useRouter()
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // List of paths where the back button shouldn't appear
    const hiddenPaths = ['/', '/login', '/signup', '/dashboard', '/admin', '/instructor', '/games/fingerspelling', '/vocabulary', '/dictionary']

    if (hiddenPaths.includes(pathname)) {
        return null
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-background hover:bg-accent border-2"
                onClick={() => router.back()}
                aria-label="Go back"
            >
                <ArrowLeft className="h-6 w-6" />
            </Button>
        </div>
    )
}
