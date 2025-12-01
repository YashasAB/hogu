import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "23pizza";
  const password = "23pizza";
  
  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create restaurant and auth in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the restaurant
    const restaurant = await tx.restaurant.create({
      data: {
        name: "23 Pizza",
        slug: "23pizza",
        emoji: "🍕",
        latitude: 12.9716,
        longitude: 77.5946,
        neighborhood: "Indiranagar",
        category: "Pizza",
        isHot: true,
      },
    });
    
    // Create auth record
    const auth = await tx.restaurantAuth.create({
      data: {
        restaurantId: restaurant.id,
        username,
        passwordHash,
      },
    });
    
    return { restaurant, auth };
  });
  
  console.log("✅ Restaurant created successfully!");
  console.log("Restaurant ID:", result.restaurant.id);
  console.log("Restaurant Name:", result.restaurant.name);
  console.log("Login Username:", username);
  console.log("Login Password:", password);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
