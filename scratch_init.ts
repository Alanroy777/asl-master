import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Initializing all learner progress...")
        
        const lessons = await prisma.lesson.findMany({
            include: { lessonSigns: { orderBy: { orderIndex: 'asc' } } }
        })
        
        // We don't know all learnerIds, but we can find unique learners from User table
        const learners = await prisma.user.findMany({
            where: { role: 'LEARNER' }
        })

        if (learners.length === 0) {
            console.log("No learners found. Let's just create a dummy one or use the one we know.")
        }
        
        for (const learner of learners) {
            for (const lesson of lessons) {
                if (lesson.lessonSigns.length === 0) continue;
                
                let firstSign = true;
                for (const ls of lesson.lessonSigns) {
                    const desiredStatus = firstSign ? 'learned' : 'locked'
                    firstSign = false
                    
                    await prisma.$executeRawUnsafe(`
                        INSERT INTO public.learner_progress (learner_id, lesson_id, sign_id, status)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (learner_id, lesson_id, sign_id) DO NOTHING;
                    `, learner.id, lesson.id, ls.id, desiredStatus)
                }
            }
        }
        console.log("Done initializing!")
        
        const result = await prisma.$queryRawUnsafe(`SELECT * FROM public.learner_progress`)
        console.log("learner_progress rows:", result)
    } catch (e) {
        console.error("Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
