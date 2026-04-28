
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Levels ---')
    const levels = await prisma.level.findMany({ orderBy: { orderIndex: 'asc' } })
    console.log(levels)

    if (levels.length > 0) {
        console.log('\n--- Lessons in First Level ---')
        const lessons = await prisma.lesson.findMany({
            where: { levelId: levels[0].id },
            include: { signs: true }
        })
        console.dir(lessons, { depth: null })
    } else {
        console.log('No levels found.')
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
