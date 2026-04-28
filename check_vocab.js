const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const data = await prisma.userSignProgress.findMany({
    include: { sign: true }
  });
  console.log(JSON.stringify(data, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
