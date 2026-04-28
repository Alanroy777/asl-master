
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'alanroycodecraft@gmail.com' },
            select: { email: true, role: true }
        })
        return NextResponse.json({ user })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
