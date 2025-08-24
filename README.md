# ROC Support

A healthcare platform that connects patients with healthcare providers. Built as my Capstone 2 project for Springboard.

## What it does

ROC Support helps patients find and connect with healthcare providers in their area. Patients can search for doctors, save their favorites, and access emergency resources. Healthcare providers can create profiles and connect with patients who need their services.

## Features

- **Patient Portal**: Sign up, search for providers, save favorites, and access emergency resources
- **Provider Portal**: Create detailed profiles with specialties and contact information
- **Search & Filter**: Find providers by location and medical specialty
- **Favorites System**: Patients can bookmark their preferred providers
- **Messaging System**: Basic communication between patients and providers
- **Google Maps Integration**: Links to view provider locations and get directions
- **Emergency Resources**: Quick access to emergency contacts and information

## Tech Stack

**Backend:**
- Node.js with Express
- PostgreSQL database
- JWT authentication
- bcrypt for password hashing
- JSON Schema validation

**Frontend:**
- React 18
- Material-UI (MUI) for styling
- Google Maps integration (via URL links)
- Axios for API calls
- React Router for navigation

## Getting Started

### Prerequisites
- Node.js (18+)
- PostgreSQL

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd Capstone2
```

2. Install backend dependencies
```bash
npm install
```

3. Install frontend dependencies
```bash
cd frontend
npm install
cd ..
```

4. Set up your PostgreSQL database
```bash
createdb roc_support
psql -d roc_support -f ROCsupport-schema.sql
```

5. Create a `.env` file in the root directory with:
```
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://username:password@localhost:5432/roc_support
```

6. Start the backend server
```bash
npm run dev
```

7. In a new terminal, start the frontend
```bash
cd frontend
npm start
```

The backend runs on http://localhost:5000 and the frontend on http://localhost:3000.

## Database Structure

The app uses a unified user system:
- **MasterUsers**: Main user table for authentication
- **Patients**: Patient-specific information
- **HealthcareProviders**: Provider profiles and specialties
- **Supporting tables**: Addresses, phone numbers, medical issues, favorites

## API Endpoints

### Authentication
- `POST /civilians/signup` - Patient registration
- `POST /civilians/login` - Patient login
- `POST /provider/signup` - Provider registration
- `POST /provider/login` - Provider login

### Patient Features
- `GET /search` - Search for providers
- `POST /civilians/favorites/:providerId` - Add/remove favorites
- `GET /civilians/favorites` - Get user's favorite providers

### Provider Features
- `GET /provider/profile` - Get provider profile
- `PUT /provider/profile` - Update provider profile

## What I Learned

This project taught me a lot about:
- Building full-stack applications with separate frontend and backend
- Working with PostgreSQL and designing relational databases
- User authentication and authorization with JWT
- Integrating third-party APIs (Google Maps)
- Managing state in React applications
- API design and RESTful endpoints

## Future Improvements

- Real-time messaging between patients and providers
- Appointment scheduling system
- Provider reviews and ratings
- Insurance verification
- Mobile app version
- Enhanced search filters

## Contact

Built by Zach Karr as part of Springboard's Software Engineering Career Track.

Feel free to reach out if you have questions about the code or want to connect!