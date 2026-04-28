import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const levels = await prisma.level.findMany({
        select: {
            id: true,
            title: true,
            createdById: true,
            createdBy: {
                select: {
                    name: true,
                    role: true
                }
            }
        }
    });

    console.log("--- Levels in Database ---");
    console.log(JSON.stringify(levels, null, 2));
    
    const lessons = await prisma.lesson.findMany({
        select: {
            id: true,
            title: true,
            createdById: true,
            createdBy: {
                select: {
                    name: true,
                    role: true
                }
            }
        }
    });
    console.log("--- Lessons in Database ---");
    console.log(JSON.stringify(lessons, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
