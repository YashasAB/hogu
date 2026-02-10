# Overview

Hogu is a dating platform built for Bengaluru with restaurant reservation capabilities. The system provides a monorepo architecture with a React frontend and Express API backend.

**Primary Feature**: Curated dating with photo uploads using Replit Object Storage
**Secondary Feature**: Restaurant reservations accessible at /restaurant-reservations

# User Preferences

Preferred communication style: Simple, everyday language.

# URL Structure

- `/` - Dating homepage (primary)
- `/login` - Dating login
- `/signup` - Dating signup with photo uploads
- `/app` - Dating app dashboard (after login)
- `/restaurant-reservations` - Restaurant booking homepage
- `/restaurant-reservations/explore` - Restaurant map/list
- `/restaurant-reservations/login` - Restaurant user login
- `/restaurant-reservations/r/:slug` - Restaurant detail page
- `/restaurant-login` - Restaurant owner/admin login
- `/admin/:restaurantId` - Restaurant admin dashboard
- `/db-admin` - Database admin panel (requires ADMIN_PASSWORD)

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Styling**: Tailwind CSS for utility-first styling with custom brand tokens
- **State Management**: Built-in React hooks with context for user authentication
- **Routing**: React Router for client-side navigation
- **UI Components**: Custom components with mobile-first responsive design
- **Maps Integration**: Leaflet with react-leaflet for restaurant location visualization
- **Date Handling**: react-day-picker for reservation date selection

## Frontend File Structure
```
apps/web/src/
├── components/           # Shared UI components
│   ├── media/           # Media-related components (PhotoCarousel)
│   ├── DarkDatePicker.tsx
│   ├── TodayNearYou.tsx
│   └── UserReservations.tsx
├── constants/           # App constants (mapConfig.ts)
├── lib/                 # API utilities, upload helpers
├── routing/             # router.tsx - centralized routing
├── sections/            # Feature-based page components
│   ├── dating/          # Dating feature pages
│   │   ├── Home.tsx     # Main dating landing page (/)
│   │   ├── Login.tsx    # Dating login (/login)
│   │   ├── Signup.tsx   # Dating signup with photos (/signup)
│   │   └── App.tsx      # Dating app dashboard (/app)
│   ├── restaurant/      # Restaurant reservation pages
│   │   ├── Home.tsx     # Restaurant home (/restaurant-reservations)
│   │   ├── ExploreRestaurants.tsx
│   │   ├── RestaurantDetail.tsx
│   │   ├── RestaurantLogin.tsx
│   │   └── Profile.tsx
│   └── admin/           # Restaurant admin pages
│       └── RestaurantDashboard.tsx
└── shells/              # Layout wrappers (App.tsx)
```

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **File Uploads**: Multer for handling multipart/form-data with memory storage
- **Image Storage**: Replit Object Storage via Google Cloud Storage (uses DEFAULT_OBJECT_STORAGE_BUCKET_ID env var)
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling
- **CORS**: Configured for cross-origin requests with credential support

## API Routes
- `/api/dating/*` - Dating endpoints (auth, photos, matches)
- `/api/restaurants/*` - Restaurant data and reservations
- `/api/discover/*` - Restaurant discovery and availability
- `/api/images/*` - Image serving from Object Storage
- `/api/db-admin/*` - Database admin API (protected by ADMIN_PASSWORD)

## Data Model Design
The system uses a comprehensive schema covering:
- **Dating Users**: Profile data, photos (via Object Storage), preferences
- **Restaurant Data**: Restaurant details, photos, areas, seating configurations
- **Inventory System**: Time-slotted availability with capacity management
- **Reservation Flow**: Bookings with status tracking and party size validation
- **Operational Controls**: Opening hours, special closures, booking policies

## Development Workflow
- **Monorepo Structure**: PNPM workspaces with separate web and API applications
- **Package Management**: PNPM for efficient dependency management and workspace linking
- **Build System**: TypeScript compilation with shared base configuration
- **Development Server**: Concurrent development with API on port 8080 and web on port 5000
- **Database Migrations**: Prisma migrate for schema evolution and seeding

## Production Deployment
- **Container**: Node.js 20 runtime environment
- **Build Process**: Multi-stage build with dependency installation, compilation, and database setup
- **Port Configuration**: Dynamic port binding using environment variables
- **Health Checks**: Multiple health endpoints for deployment readiness verification
- **Static Serving**: Express serves built React application in production

# External Dependencies

## Core Technologies
- **React**: Frontend library with hooks and context
- **Express**: Web application framework for Node.js
- **Prisma**: Type-safe database ORM and migration tool
- **TypeScript**: Static type checking across the entire stack

## Database and Storage
- **PostgreSQL**: Production database
- **Replit Object Storage**: Image and asset storage with binary content serving

## File Handling and Processing
- **Multer**: Multipart form data processing for file uploads
- **Buffer**: Node.js binary data handling for image processing
- **MIME Type Detection**: Content-type determination for served images

## UI and Interaction Libraries
- **Tailwind CSS**: Utility-first styling framework
- **React Router**: Client-side routing and navigation
- **Leaflet**: Interactive maps for restaurant locations
- **react-day-picker**: Date selection component for reservations

## Development Tools
- **Vite**: Fast frontend build tool with HMR
- **ts-node**: TypeScript execution for development
- **concurrently**: Parallel process execution for development servers
- **PNPM**: Fast, disk space efficient package manager

## Authentication and Security
- **jsonwebtoken**: JWT token generation and validation
- **bcryptjs**: Password hashing and verification
- **CORS**: Cross-origin request handling

# Recent Changes

- 2026-02-10: Match visibility: male users only see a match after the female user marks interested; female users see matches immediately
- 2026-02-10: Added dateCity and dateNeighborhoods fields to user profile (signup, edit, admin view, CSV export)
- 2026-02-10: Added separate Export Match Data button in admin portal (exports matches + scheduling availability in legible CSV)
- 2026-02-10: User CSV export does not include scheduling data; match export is separate
- 2026-02-10: Added MatchAvailability table for scheduling: users enter dates free, times free, neighborhoods for SCHEDULING matches
- 2026-02-10: Auto-message sent to both users when match moves to SCHEDULING (triggered by mutual interest)
- 2026-02-10: User match cards show availability form with add/edit/remove for SCHEDULING status
- 2026-02-10: Admin portal shows "View Availability" button on SCHEDULING matches with per-user fill status and details
- 2026-02-10: Hidden Instagram handle from match profile view (only admin can see it)
- 2026-02-09: Added gender field (Male/Female) across full stack: schema, signup, profile edit, admin list/detail, CSV export; admin users organized by gender
- 2026-02-09: Added two-sided interest tracking: user1Interested/user2Interested fields on matches with auto-promote to SCHEDULING when both interested
- 2026-02-09: Added user "I'm interested" button on match cards with status indicators for mutual interest
- 2026-02-09: Added admin per-user interest toggle buttons in matches table with demotion support
- 2026-02-09: Expanded profile preview and match profile views to show all fields (height, relationship type, age prefs, lifestyle, cuisines, interests, languages, essays)
- 2026-02-09: Fixed session cookie to dynamically detect HTTPS for proper cross-origin iframe support
- 2026-02-09: Added age preference (min/max) fields across full stack: schema, signup, profile edit, admin list/detail, CSV export
- 2026-02-07: Added CSV export/download of all user data from dating admin (Download Spreadsheet button)
- 2026-02-07: Added user deletion from dating admin with cascade to all related tables
- 2026-02-07: Added password reset page at /reset-password with token-based authentication (PASSWORD_RESET_TOKEN secret)
- 2026-02-07: Added "Forgot your password?" link on login page
- 2026-02-07: Added phone number disclaimer on signup page explaining importance of real phone numbers
- 2026-02-07: Updated dating admin to fetch and display full user profiles (essays, lifestyle, interests)
- 2026-02-07: Updated db-admin to show all columns with horizontal scrolling
- 2026-02-07: Added auto-welcome message for users with incomplete profile essays on signup
- 2026-02-03: Added admin portal at /dating-admin for matchmakers to browse users, create/manage matches, update status, and send messages
- 2026-02-03: Created AdminMessage table for two-way matchmaker-user messaging with read status tracking
- 2026-02-03: Expanded DatingMatch statuses: MATCHED → INTERESTED → SCHEDULING → CONFIRMED → COMPLETED (plus UNMATCHED)
- 2026-02-03: Updated /app dashboard to group matches by status with colored badges and Messages tab with unread count
- 2026-02-03: Added height field to DatingUser (optional) and updated signup + profile edit forms
- 2026-02-03: Reduced photo requirement from 3 to 1 minimum for signup flexibility
- 2026-02-03: Enhanced profile field placeholders to encourage 100+ character responses
- 2026-02-02: Added dating app dashboard at /app with matches view, profile viewing, and profile editing
- 2026-02-02: Created DatingMatch table for tracking user matches (status: MATCHED, UNMATCHED)
- 2026-02-02: Added profile API endpoints: GET /api/dating/profile/matches, GET /api/dating/profile/me, PUT /api/dating/profile/me
- 2026-02-02: Fixed Prisma schema to use camelCase fields matching database columns (phoneE164, passwordHash, etc.)
- 2026-02-02: Added database admin panel at /db-admin with password protection (ADMIN_PASSWORD secret)
- 2026-02-02: Migrated Object Storage from AWS S3 SDK to Replit GCS integration (sidecar-based auth)
- 2026-02-02: Photo upload presign API now working at /api/dating/uploads/presign
- 2026-02-02: Image serving uses GCS streaming at /api/images/storage/*
- 2025-12-25: Reorganized app structure - dating promoted to homepage (/), restaurant reservations moved to /restaurant-reservations
- 2025-12-25: Created feature-based folder structure (sections/dating/, sections/restaurant/, sections/admin/)
- 2025-12-25: Updated all routing and navigation links for new URL structure

# Future Enhancements

- Twilio OTP integration for phone verification during signup and password reset (credentials needed)
