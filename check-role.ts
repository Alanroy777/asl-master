
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'alanroycodecraft@gmail.com'
    const user = await prisma.user.findUnique({
        where: { email },
        select: { email: true, role: true }
    })
    console.log('Current User State:', user)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
