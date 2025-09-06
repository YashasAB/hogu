-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "heroImageUrl" TEXT,
    "instagramUrl" TEXT,
    "website" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuisine_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "cuisine_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_cuisine_tags" (
    "restaurantId" TEXT NOT NULL,
    "cuisineTagId" TEXT NOT NULL,

    CONSTRAINT "restaurant_cuisine_tags_pkey" PRIMARY KEY ("restaurantId","cuisineTagId")
);

-- CreateTable
CREATE TABLE "time_slots" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "holdExpiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_auth" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_auth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_details" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "preferredHood" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dating_users" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "profession" TEXT,
    "dreams" TEXT,
    "fiveYearGoal" TEXT,
    "whatIWantInPartner" TEXT,
    "whyPartnerWouldLikeMe" TEXT,
    "physicalActivity" TEXT,
    "dateBudget" TEXT,
    "instagramHandle" TEXT,
    "diet" TEXT,
    "drinking" TEXT,
    "smoking" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dating_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dating_user_photos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "objectUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dating_user_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dating_user_cuisines" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cuisine" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dating_user_cuisines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dating_user_interests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dating_user_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dating_user_first_date_types" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstDateType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dating_user_first_date_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dating_user_languages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dating_user_languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cuisine_tags_name_key" ON "cuisine_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "time_slots_restaurantId_date_time_partySize_key" ON "time_slots"("restaurantId", "date", "time", "partySize");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_auth_restaurantId_key" ON "restaurant_auth"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_auth_username_key" ON "restaurant_auth"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_userId_key" ON "user_auth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_username_key" ON "user_auth"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_details_userId_key" ON "user_details"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dating_users_phoneE164_key" ON "dating_users"("phoneE164");

-- CreateIndex
CREATE INDEX "idx_dating_user_photos_user" ON "dating_user_photos"("userId");

-- CreateIndex
CREATE INDEX "idx_dating_user_cuisines_user" ON "dating_user_cuisines"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dating_user_cuisines_userId_cuisine_key" ON "dating_user_cuisines"("userId", "cuisine");

-- CreateIndex
CREATE INDEX "idx_dating_user_interests_user" ON "dating_user_interests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dating_user_interests_userId_tag_key" ON "dating_user_interests"("userId", "tag");

-- CreateIndex
CREATE INDEX "idx_dating_user_first_date_types_user" ON "dating_user_first_date_types"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dating_user_first_date_types_userId_firstDateType_key" ON "dating_user_first_date_types"("userId", "firstDateType");

-- CreateIndex
CREATE INDEX "idx_dating_user_languages_user" ON "dating_user_languages"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dating_user_languages_userId_lang_key" ON "dating_user_languages"("userId", "lang");

-- AddForeignKey
ALTER TABLE "restaurant_cuisine_tags" ADD CONSTRAINT "restaurant_cuisine_tags_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_cuisine_tags" ADD CONSTRAINT "restaurant_cuisine_tags_cuisineTagId_fkey" FOREIGN KEY ("cuisineTagId") REFERENCES "cuisine_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "time_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_auth" ADD CONSTRAINT "restaurant_auth_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_auth" ADD CONSTRAINT "user_auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
