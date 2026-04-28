'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
    fallbackPath: string
    variant?: "ghost" | "outline" | "default" | "secondary" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    className?: string
    children?: React.ReactNode
}

export function ClientBackButton({ 
    fallbackPath, 
    variant = "ghost", 
    size = "icon",
    className,
    children
}: BackButtonProps) {
    const router = useRouter()

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back()
        } else {
            router.push(fallbackPath)
        }
    }

    return (
        <Button 
            variant={variant} 
            size={size} 
            onClick={handleBack}
            className={className}
        >
            {children || <ArrowLeft className="h-4 w-4" />}
        </Button>
    )
}
