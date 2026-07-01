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
    where: { id: 'game-ceit' },
    update: { coverImage: 'uploads/images/ceit-thumb.svg' },
    create: {
      id: 'game-ceit',
      title: 'CEIT Game',
      shortDesc: 'Interactive CEIT Metaverse experience',
      fullDesc: 'Explore the CEIT Metaverse in this immersive Unity WebGL game. Navigate through virtual environments and experience the future of education.',
      gameType: 'Unity',
      tags: ['unity', 'metaverse', 'education', '3d'],
      coverImage: 'uploads/images/ceit-thumb.svg',
      gameFile: 'games/ceit',
      creatorId: user.id,
    },
  });

  const game2 = await prisma.game.upsert({
    where: { id: 'game-nuksuksa' },
    update: { coverImage: 'uploads/images/nuksuksa-thumb.svg' },
    create: {
      id: 'game-nuksuksa',
      title: 'Nuksuksa Game',
      shortDesc: 'Nuksuksa interactive experience',
      fullDesc: 'An engaging Unity WebGL game featuring the Nuksuksa environment. Discover and interact with various elements in this virtual world.',
      gameType: 'Unity',
      tags: ['unity', 'adventure', '3d', 'interactive'],
      coverImage: 'uploads/images/nuksuksa-thumb.svg',
      gameFile: 'games/nuksuksa',
      creatorId: user.id,
    },
  });

  const game3 = await prisma.game.upsert({
    where: { id: 'game-sfada' },
    update: { coverImage: 'uploads/images/sfada-thumb.svg' },
    create: {
      id: 'game-sfada',
      title: 'SFADA Game',
      shortDesc: 'SFADA virtual world',
      fullDesc: 'Experience the SFADA virtual environment in this Unity WebGL game. Explore, interact, and discover the unique features of this digital space.',
      gameType: 'Unity',
      tags: ['unity', 'exploration', '3d', 'virtual'],
      coverImage: 'uploads/images/sfada-thumb.svg',
      gameFile: 'games/sfada',
      creatorId: user.id,
    },
  });

  console.log('✅ Seed completed:');
  console.log('  - user:', user.email);
  console.log('  - games:', game1.id, game2.id, game3.id);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
