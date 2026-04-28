import { config } from 'dotenv'
import path from 'path'
config({ path: path.resolve(process.cwd(), '.env.development') })
config({ path: path.resolve(process.cwd(), '.env') })

import { createClient } from '@supabase/supabase-js'

async function test() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const learnerId = 'cmm0hht0g0000uo742qof24m2' // A valid user id if needed?
    const lessonId = 'cmoduqh2x001cuo0sc0aa88dx'
    
    console.log("Calling RPC...")
    const { data, error } = await supabase.rpc('initialize_lesson_progress', {
        p_learner_id: learnerId,
        p_lesson_id:  lessonId,
    })
    console.log("RPC Error:", error)
    console.log("RPC Data:", data)
}

test()
