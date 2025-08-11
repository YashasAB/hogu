import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.restaurant.count();
  if (count > 0) {
    console.log('Seed: restaurants already exist, skipping.');
    return;
  }

  const r1 = await prisma.restaurant.create({
    data: { name: 'Naru Noodle Bar (Demo)', slug: 'naru-noodle-bar', neighborhood: 'Indiranagar', instagramUrl: 'https://www.instagram.com/naru.demo/', heroImageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=1200' }
  });
  const r2 = await prisma.restaurant.create({
    data: { name: 'Soka (Demo)', slug: 'soka', neighborhood: 'Koramangala', instagramUrl: 'https://www.instagram.com/soka.demo/', heroImageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200' }
  });

  const date = dayjs().format('YYYY-MM-DD');
  const makeSlots = async (restaurantId: string) => {
    const times = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
    for (const time of times) {
      for (const party of [2, 4]) {
        await prisma.inventorySlot.create({
          data: {
            restaurantId, date, time, partySize: party,
            capacityTotal: 4, capacityBooked: 0, cutoffMinutes: 60
          }
        });
      }
    }
  };

  await makeSlots(r1.id);
  await makeSlots(r2.id);

  console.log('Seed: created demo restaurants and inventory for today.');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});


  await prisma.restaurantPhoto.createMany({
    data: [
      { restaurantId: r1.id, url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000', sortOrder: 0 },
      { restaurantId: r1.id, url: 'https://images.unsplash.com/photo-1526312426976-593c128eea49?q=80&w=1000', sortOrder: 1 },
      { restaurantId: r2.id, url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1000', sortOrder: 0 }
    ]
  });
