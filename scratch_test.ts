import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
    const { data: ls, error } = await supabase
        .from('lesson_signs')
        .select(`
            id,
            "orderIndex",
            "customVideoUrl",
            signs_library (
                id,
                name
            )
        `)
        .limit(2)
        
    console.log("Supabase Test:", ls, "Error:", error?.message)
}

main().catch(console.error)
