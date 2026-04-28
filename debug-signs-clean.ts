
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    console.log('Fetching data...')
    try {
        const levels = await prisma.level.findMany({
            orderBy: { orderIndex: 'asc' },
            include: {
                lessons: {
                    include: {
                        signs: true
                    }
                }
            }
        })

        console.log(`Found ${levels.length} levels.`)
        fs.writeFileSync('debug-clean.json', JSON.stringify(levels, null, 2), 'utf-8')
        console.log('Wrote to debug-clean.json')
    } catch (error) {
        console.error('Error:', error)
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
