const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting seed...');

  const user = await prisma.user.upsert({
    where: { email: 'tester@example.com' },
    update: {},
    create: {
      id: 'user-' + Date.now(),
      username: 'tester',
      email: 'tester@example.com',
      password: 'password-placeholder',
      fullName: 'Test User',
      profilePicture: null,
      bio: 'Seeded user account',
    },
  });

  const game1 = await prisma.game.upsert({
    where: { id: 'game-1' },
    update: {},
    create: {
      id: 'game-1',
      title: 'Sample Game 1',
      shortDesc: 'A seeded sample game',
      fullDesc: 'Detailed seeded game description',
      gameType: 'html5',
      tags: ['seed', 'sample'],
      coverImage: null,
      gameFile: 'games/sample1/index.html',
      creatorId: user.id,
    },
  });

  const game2 = await prisma.game.upsert({
    where: { id: 'game-2' },
    update: {},
    create: {
      id: 'game-2',
      title: 'Sample Game 2',
      shortDesc: 'Another seeded game',
      fullDesc: 'Another detailed seeded game description',
      gameType: 'html5',
      tags: ['seed', 'example'],
      coverImage: null,
      gameFile: 'games/sample2/index.html',
      creatorId: user.id,
    },
  });

  console.log('✅ Seed completed:');
  console.log('  - user:', user.email);
  console.log('  - games:', game1.id, game2.id);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
