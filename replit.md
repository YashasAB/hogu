# Overview

Hogu is a restaurant reservation platform built for Bengaluru, inspired by Resy's approach to fair access and scarcity management. The system provides a monorepo architecture with a React frontend and Express API backend, designed to handle table reservations, inventory management, and user authentication. The platform focuses on preventing bot abuse, managing restaurant capacity efficiently, and providing a premium dining discovery experience.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Styling**: Tailwind CSS for utility-first styling with custom brand tokens
- **State Management**: Built-in React hooks with context for user authentication
- **Routing**: React Router for client-side navigation
- **UI Components**: Custom components with mobile-first responsive design
- **Maps Integration**: Leaflet with react-leaflet for restaurant location visualization
- **Date Handling**: react-day-picker for reservation date selection

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: Prisma ORM with SQLite for development (designed for PostgreSQL in production)
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **File Uploads**: Multer for handling multipart/form-data with memory storage
- **Image Storage**: Replit Object Storage for restaurant hero images and assets
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling
- **CORS**: Configured for cross-origin requests with credential support

## Data Model Design
The system uses a comprehensive schema covering:
- **User Management**: Users, authentication providers, roles, and RBAC
- **Restaurant Data**: Restaurant details, photos, areas, seating configurations
- **Inventory System**: Time-slotted availability with capacity management
- **Reservation Flow**: Bookings with status tracking and party size validation
- **Operational Controls**: Opening hours, special closures, booking policies

## Development Workflow
- **Monorepo Structure**: PNPM workspaces with separate web and API applications
- **Package Management**: PNPM for efficient dependency management and workspace linking
- **Build System**: TypeScript compilation with shared base configuration
- **Development Server**: Concurrent development with API on port 8080 and web on port 5173
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
- **SQLite**: Development database (with PostgreSQL migration path)
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