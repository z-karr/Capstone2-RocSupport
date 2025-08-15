# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
ROC Support is a Node.js/Express healthcare platform connecting patients with healthcare providers. The application uses a dual-user architecture with separate authentication flows for patients (civilians) and providers.

## Database Architecture
The application uses PostgreSQL with a unified user system:
- **MasterUsers**: Central user table storing email, password, name, and user type (patient/provider)
- **Patients**: Patient-specific data linked to MasterUsers via user_id
- **HealthcareProviders**: Provider-specific data linked to MasterUsers via user_id  
- **Supporting tables**: Addresses, PhoneNumbers, MedicalIssues, FavoritesContacts, ProviderSupportedIssues

Key relationships:
- Both Patients and HealthcareProviders reference MasterUsers for authentication
- Addresses and PhoneNumbers are shared across user types
- Providers can support multiple medical issues via junction table
- Patients can favorite providers via FavoritesContacts table

## Development Commands

### Backend (Node.js/Express)
- **Start development server**: `npm run dev` (uses nodemon, port 5000)
- **Database connection**: PostgreSQL on localhost:5432 (default database: roc_support)
- **Test command**: Currently placeholder - `npm test` returns error

### Frontend (React)
- **Start development server**: `cd frontend && npm start` (port 3000)
- **Build for production**: `cd frontend && npm run build`
- **Run tests**: `cd frontend && npm test`
- **Frontend directory**: `/frontend/` (symbolic link to `~/SpringBoard/Capstone2-ReactFrontend`)

## Code Structure

### Models (`/models/`)
- `Users.js`: Patient authentication, registration, profile management (references MasterUsers and Patients tables)
- `HealthcareProviders.js`: Provider authentication, registration, profile management with transaction-based operations
- Supporting models: `Addresses.js`, `phoneNumber.js`, `MedicalIssues.js`, `FavoritesContacts.js`

### Routes (`/routes/`)
**Civilian/Patient routes** (`/routes/Civilians/`):
- `authentication.js`: `/civilians/signup`, `/civilians/login`
- `profile.js`: Patient profile management
- `favorites.js`: Favorite providers management
- `homepage.js`: Homepage functionality

**Provider routes** (`/routes/Providers/`):
- `authentication.js`: `/provider/signup`, `/provider/login`, `/provider/logout`
- `profile.js`: Provider profile management

**Shared routes**:
- `EmergencyResources.js`: Emergency resource endpoints

### Authentication & Authorization (`/middleware/`)
- JWT-based authentication using `jsonwebtoken`
- `auth.js`: Provides `authenticateJWT`, `ensureLoggedIn`, `ensureUserType`, `ensureCorrectProvider`
- Tokens contain user_id, type (patient/provider), and role-specific IDs

### Validation (`/middleware/`, `/schemas/`)
- JSON Schema validation using `jsonschema` package
- Schema files in `/schemas/` for all API endpoints
- `validator.js`: Middleware wrapper for schema validation

### Configuration
- `config.js`: Environment-based configuration for database, JWT secret, bcrypt work factor
- Database URI: `postgres://zkarr:12345@localhost:5432/roc_support` (development)
- Port: 5000 (default)

### Database Schema Management
- `ROCsupport-schema.sql`: Complete schema migration from old structure to new unified system
- `ROCsupport-seed.sql`: Seed data (if present)
- Migration includes data preservation from old Users/HealthcareProviders tables to new structure

## Key Implementation Notes

### User Registration Flow
**Patients**: Insert into MasterUsers → Insert into Patients table → Create address/phone records
**Providers**: Transaction-based registration including supported medical issues mapping

### Authentication Flow
Both user types authenticate against MasterUsers table, with type-specific queries joining to Patients or HealthcareProviders tables.

### Error Handling
- Custom error classes in `expressError.js`
- Global error handler in `app.js`
- Database transactions with rollback on errors (especially in provider operations)

### Database Helpers
- `helpers/sql.js`: Contains `sqlForPartialUpdate` for dynamic UPDATE queries
- Used extensively in model update methods

## Testing Structure
Test files exist in routes directory (`.test.js` files) but testing configuration needs setup.

### Frontend (`/frontend/src/`)

**Architecture**: React 17 with functional components and hooks
**Routing**: React Router DOM v5 with role-based routes
**State Management**: React Context (AuthContext) for authentication state
**UI Framework**: Material-UI (MUI) v5 with emotion styling
**HTTP Client**: Axios with configured instance

**Key Directories**:
- `components/`: Reusable UI components (Login, Signup, Profile components)
- `pages/`: Route-specific page components organized by user type (Civilians/, Providers/)
- `api/`: API integration layer (api.js, axiosInstance.js)  
- `context/`: Global state management (AuthContext.js)

**API Integration**:
- `axiosInstance.js`: Pre-configured axios with base URL and token interceptors
- `api.js`: Centralized API methods for all backend endpoints
- Separate methods for civilian/patient vs provider operations

**Authentication Flow**:
- JWT tokens stored in localStorage with expiration checking
- AuthContext provides authentication state across components
- Token automatically attached to requests via axios interceptors
- Role-based routing for civilian vs provider user types

**Component Structure**:
- Shared components: Login, Profile, EmergencyResources, SearchBar
- User-specific pages: CivilianLogin/Signup vs ProviderLogin/Signup
- Favorites functionality for patients to save preferred providers

## Security
- Passwords hashed with bcrypt (work factor 12 in production, 1 in test)
- JWT tokens for session management with expiration checking
- CORS enabled for cross-origin requests
- Input validation via JSON schemas (backend) and controlled components (frontend)
- Token-based authentication with automatic logout on expiration

## Full-Stack Integration Notes
- Frontend runs on port 3000, backend on port 5000
- API calls use relative URLs through configured axios base URL
- Authentication tokens passed via Authorization headers
- Role-based UI rendering based on user type (patient/provider)
- Error handling implemented on both frontend and backend layers