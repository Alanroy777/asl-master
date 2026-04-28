const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const data = await prisma.lessonSign.findMany({ select: { id: true, librarySignId: true } });
  console.log(data);
}
main().catch(console.error).finally(() => prisma.$disconnect());
