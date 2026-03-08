# Overview

Hogu is a dating platform focused on Bengaluru, integrating curated dating experiences with restaurant reservation capabilities. It aims to provide a comprehensive social and dining solution, facilitating connections and real-world meetups. The project utilizes a monorepo architecture with a React frontend and an Express API backend.

**Key capabilities include:**
- Curated dating profiles with photo uploads.
- Integrated restaurant reservation system.
- Advanced matching algorithms and communication tools, including AI-powered introductory messages.
- Dedicated administrative panels for dating and restaurant management.

The business vision is to become a leading platform for dating and social interaction in urban centers, starting with Bengaluru, by offering a seamless experience from initial connection to real-world dates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Architecture
The system is built as a monorepo using PNPM workspaces, separating `web` (frontend) and `api` (backend) applications.
- **Frontend**: React 18 with TypeScript and Vite.
- **Backend**: Node.js with Express.js.
- **Database**: PostgreSQL, managed by Prisma ORM.
- **Styling**: Tailwind CSS for a utility-first approach with custom branding.
- **State Management**: React hooks and context API.
- **Authentication**: JWT-based authentication with bcrypt for password hashing.
- **Image Storage**: Replit Object Storage (Google Cloud Storage) for user photos and restaurant images.

## Frontend Design
- **UI/UX**: Custom components adhering to a mobile-first responsive design.
- **Routing**: React Router for client-side navigation.
- **Maps**: Leaflet with `react-leaflet` for visualizing restaurant locations.
- **Date Selection**: `react-day-picker` for reservation scheduling.
- **URL Structure**:
    - Dating: `/`, `/login`, `/signup`, `/app`
    - Restaurant Reservations: `/restaurant-reservations`, `/restaurant-reservations/explore`, `/restaurant-reservations/r/:slug`
    - Admin: `/admin/:restaurantId`, `/db-admin`, `/dating-admin`

## Backend Design
- **API**: RESTful endpoints with clear HTTP status codes and error handling.
- **CORS**: Configured to support cross-origin requests with credentials.
- **File Uploads**: Multer handles multipart/form-data for image uploads.
- **API Routes**:
    - `/api/dating/*` (authentication, photos, matches)
    - `/api/restaurants/*` (data, reservations)
    - `/api/discover/*` (restaurant availability)
    - `/api/images/*` (image serving)
    - `/api/db-admin/*` (protected database administration)

## Data Model
The database schema supports dating profiles, restaurant details, inventory, reservations, and administrative functions. Key entities include:
- **Dating Users**: Profiles, photos, preferences, age, gender, relationship type, essays.
- **Restaurants**: Details, photos, areas, seating, operating hours.
- **Reservations**: Booking details, status, party size.
- **Dating Matches**: Tracks user interest, match status (MATCHED, INTERESTED, SCHEDULING, CONFIRMED, COMPLETED, UNMATCHED), and scheduling availability.
- **Messaging**: Admin-to-user messages (generic broadcasts), AI-generated intro messages, and per-match private `MatchMessage` threads between admin and each user.
- **Phone OTP Verification**: `PhoneVerified` table stores recently verified phone numbers for the signup gate. Prelude (@prelude.so/sdk) handles OTP delivery and checking.

## AI Agents
- **Intro Agent**: Generates personalized AI introduction messages for new matches using OpenAI (gpt-4o). Female messages are delivered immediately; male messages are stored in `PendingIntroMessage` and delivered upon female interest.
- **Get to Know Agent**: Facilitates guided conversations between matched users, allowing them to update profile fields during interaction. Uses OpenAI (gpt-4o) in JSON mode, applying atomic updates via Prisma transactions. Limited to 5 messages per user per day.

# External Dependencies

## Core Technologies
- **React**: Frontend library.
- **Express**: Backend web framework.
- **Prisma**: ORM for PostgreSQL.
- **TypeScript**: Language for type-safe development.

## Database & Storage
- **PostgreSQL**: Primary database.
- **Replit Object Storage**: For storing and serving user-uploaded images and assets.

## UI & Interaction Libraries
- **Tailwind CSS**: Styling framework.
- **React Router**: Client-side navigation.
- **Leaflet**: Interactive map component.
- **react-leaflet**: React wrapper for Leaflet.
- **react-day-picker**: Date selection UI component.

## Development Tools
- **Vite**: Fast frontend build tool.
- **PNPM**: Package manager for monorepo.
- **concurrently**: For running multiple development processes.

## Authentication & Security
- **jsonwebtoken**: JWT implementation.
- **bcryptjs**: Password hashing.
- **CORS**: Cross-Origin Resource Sharing middleware.

## AI / Machine Learning
- **OpenAI (gpt-4o)**: Utilized by Intro Agent and Get to Know Agent for natural language generation.