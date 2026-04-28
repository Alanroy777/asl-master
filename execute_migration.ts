import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
    const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20260426_learner_progress.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("Executing migration: 20260426_learner_progress.sql");

    // Split by custom delimiter or just run the whole thing
    // Since it contains CREATE FUNCTION/TRIGGER with semicolons, we need to be careful.
    // We'll use a simple split by '--' or similar if needed, but let's try the whole block first.
    // Actually, splitting by '--' is not reliable.
    // Let's try executing the whole block.
    
    try {
        await prisma.$executeRawUnsafe(sql);
        console.log("Migration executed successfully!");
    } catch (e: any) {
        console.error("Migration failed:", e.message);
        console.log("Attempting to split and run chunks...");
        
        // Fallback: very basic split (might fail on functions)
        const chunks = sql.split(";");
        for (let chunk of chunks) {
            const clean = chunk.trim();
            if (!clean) continue;
            try {
                await prisma.$executeRawUnsafe(clean);
            } catch (inner: any) {
                console.warn("Chunk failed (this is expected for function bodies):", inner.message);
            }
        }
    }
}

main().finally(() => prisma.$disconnect());
