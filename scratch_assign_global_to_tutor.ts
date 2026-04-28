import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // ID for "dean winchester" (alankroy32@gmail.com)
    const tutorId = "cmln9jkwq0000uoucgdbtwb84";

    console.log("Updating existing levels and lessons to belong to Tutor ID:", tutorId);

    const levelsUpdated = await prisma.level.updateMany({
        where: { createdById: null },
        data: { createdById: tutorId }
    });

    const lessonsUpdated = await prisma.lesson.updateMany({
        where: { createdById: null },
        data: { createdById: tutorId }
    });

    console.log(`Successfully updated ${levelsUpdated.count} levels.`);
    console.log(`Successfully updated ${lessonsUpdated.count} lessons.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
