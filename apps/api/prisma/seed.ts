import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding option tables...');

  // Cuisine options
  const cuisines = [
    { value: 'NORTH_INDIAN', label: 'North Indian' },
    { value: 'SOUTH_INDIAN', label: 'South Indian' },
    { value: 'ITALIAN', label: 'Italian' },
    { value: 'JAPANESE', label: 'Japanese' },
    { value: 'THAI', label: 'Thai' },
    { value: 'MEXICAN', label: 'Mexican' },
    { value: 'MIDDLE_EASTERN', label: 'Middle Eastern' },
    { value: 'VEGETARIAN_ONLY', label: 'Vegetarian Only' },
    { value: 'VEGAN', label: 'Vegan' },
    { value: 'JAIN', label: 'Jain' },
  ];

  for (let i = 0; i < cuisines.length; i++) {
    await prisma.cuisineOption.upsert({
      where: { value: cuisines[i].value },
      update: { label: cuisines[i].label, sortOrder: i },
      create: { value: cuisines[i].value, label: cuisines[i].label, sortOrder: i },
    });
  }
  console.log('✓ Cuisine options seeded');

  // First date type options
  const firstDateTypes = [
    { value: 'COFFEE', label: 'Coffee' },
    { value: 'QUICK_COCKTAIL', label: 'Quick Cocktail' },
    { value: 'BREAKFAST', label: 'Breakfast' },
    { value: 'LUNCH', label: 'Lunch' },
    { value: 'DINNER', label: 'Dinner' },
    { value: 'GO_KARTING', label: 'Go Karting' },
    { value: 'PAINT_DATE', label: 'Paint Date' },
    { value: 'BOWLING', label: 'Bowling' },
    { value: 'MUSEUM_WALK', label: 'Museum Walk' },
    { value: 'LIVE_MUSIC', label: 'Live Music' },
    { value: 'ICECREAM_WALK', label: 'Ice Cream Walk' },
  ];

  for (let i = 0; i < firstDateTypes.length; i++) {
    await prisma.firstDateTypeOption.upsert({
      where: { value: firstDateTypes[i].value },
      update: { label: firstDateTypes[i].label, sortOrder: i },
      create: { value: firstDateTypes[i].value, label: firstDateTypes[i].label, sortOrder: i },
    });
  }
  console.log('✓ First date type options seeded');

  // Diet options
  const diets = [
    { value: 'VEG', label: 'Vegetarian' },
    { value: 'EGG', label: 'Eggetarian' },
    { value: 'NON_VEG', label: 'Non-Vegetarian' },
    { value: 'VEGAN', label: 'Vegan' },
    { value: 'JAIN', label: 'Jain' },
  ];

  for (let i = 0; i < diets.length; i++) {
    await prisma.dietOption.upsert({
      where: { value: diets[i].value },
      update: { label: diets[i].label, sortOrder: i },
      create: { value: diets[i].value, label: diets[i].label, sortOrder: i },
    });
  }
  console.log('✓ Diet options seeded');

  // Drinking options
  const drinkingOptions = [
    { value: 'NEVER', label: 'Never' },
    { value: 'SOCIALLY', label: 'Socially' },
    { value: 'OFTEN', label: 'Often' },
  ];

  for (let i = 0; i < drinkingOptions.length; i++) {
    await prisma.drinkingOption.upsert({
      where: { value: drinkingOptions[i].value },
      update: { label: drinkingOptions[i].label, sortOrder: i },
      create: { value: drinkingOptions[i].value, label: drinkingOptions[i].label, sortOrder: i },
    });
  }
  console.log('✓ Drinking options seeded');

  // Smoking options
  const smokingOptions = [
    { value: 'NO', label: 'No' },
    { value: 'SOCIALLY', label: 'Socially' },
    { value: 'YES', label: 'Yes' },
  ];

  for (let i = 0; i < smokingOptions.length; i++) {
    await prisma.smokingOption.upsert({
      where: { value: smokingOptions[i].value },
      update: { label: smokingOptions[i].label, sortOrder: i },
      create: { value: smokingOptions[i].value, label: smokingOptions[i].label, sortOrder: i },
    });
  }
  console.log('✓ Smoking options seeded');

  // Physical activity options
  const physicalOptions = [
    { value: 'RARELY', label: 'Rarely' },
    { value: 'SOMETIMES', label: 'Sometimes' },
    { value: 'REGULAR', label: 'Regular' },
    { value: 'ATHLETE', label: 'Athlete' },
  ];

  for (let i = 0; i < physicalOptions.length; i++) {
    await prisma.physicalActivityOption.upsert({
      where: { value: physicalOptions[i].value },
      update: { label: physicalOptions[i].label, sortOrder: i },
      create: { value: physicalOptions[i].value, label: physicalOptions[i].label, sortOrder: i },
    });
  }
  console.log('✓ Physical activity options seeded');

  // Date budget options
  const budgetOptions = [
    { value: '500-1000', label: '₹500–1,000' },
    { value: '1000-2500', label: '₹1,000–2,500' },
    { value: '2500-5000', label: '₹2,500–5,000' },
    { value: '5000+', label: '₹5,000+' },
  ];

  for (let i = 0; i < budgetOptions.length; i++) {
    await prisma.dateBudgetOption.upsert({
      where: { value: budgetOptions[i].value },
      update: { label: budgetOptions[i].label, sortOrder: i },
      create: { value: budgetOptions[i].value, label: budgetOptions[i].label, sortOrder: i },
    });
  }
  console.log('✓ Date budget options seeded');

  console.log('🌱 All option tables seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
