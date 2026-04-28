import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const result = await prisma.$queryRawUnsafe(`SELECT * FROM public.learner_progress`)
        console.log("learner_progress rows:", result)
    } catch (e) {
        console.error("Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
