
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    return NextResponse.json({
        message: "Session Debug Info",
        session,
        timestamp: new Date().toISOString()
    })
}
