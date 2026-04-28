import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'alanroycodecraft@gmail.com'

    console.log(`Checking user: ${email}...`)

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.error('User not found. Please create an account in the UI with this email first!')
        return
    }

    console.log('Current User Role:', user.role)

    // Force update to ADMIN
    const updated = await prisma.user.update({
        where: { email },
        data: {
            role: 'ADMIN' // Upgrading role to ADMIN
        }
    })

    console.log('✅ User role upgraded successfully! You are now an ADMIN:', updated.role)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
