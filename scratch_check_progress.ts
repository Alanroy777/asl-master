import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    try {
        const progress = await prisma.$queryRawUnsafe(`SELECT * FROM public.learner_progress LIMIT 10`);
        console.log("--- Learner Progress Rows ---");
        console.log(JSON.stringify(progress, null, 2));
    } catch (e: any) {
        console.error("Error querying learner_progress:", e.message);
    }
}
main().finally(() => prisma.$disconnect());
