import { config } from 'dotenv'
import path from 'path'
config({ path: path.resolve(process.cwd(), '.env.development') })
config({ path: path.resolve(process.cwd(), '.env') })

import { initializeLessonProgress, getLessonProgress } from './src/lib/supabase/progressQueries'

async function test() {
    const learnerId = 'some-user-id'
    const lessonId = 'cmoduqh2x001cuo0sc0aa88dx'
    console.log("Initializing...")
    await initializeLessonProgress(learnerId, lessonId)
    console.log("Fetching progress...")
    try {
        const res = await getLessonProgress(learnerId, lessonId)
        console.log("Result:", res)
    } catch (e) {
        console.error("Error:", e)
    }
}

test()
