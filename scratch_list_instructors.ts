import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.user.findMany({
        where: { role: "INSTRUCTOR" },
        select: { id: true, name: true, email: true }
    });
    console.log(JSON.stringify(users, null, 2));
}
main().finally(() => prisma.$disconnect());
