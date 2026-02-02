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

- 2026-02-02: Added database admin panel at /db-admin with password protection (ADMIN_PASSWORD secret)
- 2026-02-02: Migrated Object Storage from AWS S3 SDK to Replit GCS integration (sidecar-based auth)
- 2026-02-02: Photo upload presign API now working at /api/dating/uploads/presign
- 2026-02-02: Image serving uses GCS streaming at /api/images/storage/*
- 2025-12-25: Reorganized app structure - dating promoted to homepage (/), restaurant reservations moved to /restaurant-reservations
- 2025-12-25: Created feature-based folder structure (sections/dating/, sections/restaurant/, sections/admin/)
- 2025-12-25: Updated all routing and navigation links for new URL structure
