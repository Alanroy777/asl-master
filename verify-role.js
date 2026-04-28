
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUser(email) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { email: true, role: true }
    })
    console.log('User:', user)
}

checkUser('alanroycodecraft@gmail.com')
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
