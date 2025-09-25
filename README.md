<img width="1920" height="926" alt="image" src="https://github.com/user-attachments/assets/f72484f1-89f0-4f7b-bae1-b7fffa7b1e83" />

<img width="1920" height="923" alt="image" src="https://github.com/user-attachments/assets/75b74c7d-820e-4789-9227-e2ab3e34cb3d" />

<img width="1920" height="919" alt="image" src="https://github.com/user-attachments/assets/338e0bc8-f5db-4e24-9915-97ec451498cb" />

<img width="1910" height="922" alt="image" src="https://github.com/user-attachments/assets/073e852a-a3f8-46fb-a3ab-61b9c9f01ed2" />

# NoteNest - Collaborative Study Platform

A comprehensive web-based platform designed to facilitate academic note sharing and collaborative learning among college students. Built using React.js frontend with Firebase backend services, NoteNest transforms traditional disorganized note sharing into a structured, quality-controlled educational ecosystem.

## 🌐 Live Demo

**[View Live Application](https://note-nest-phi.vercel.app/)**

Experience NoteNest in action! The live demo includes all core features including note upload, AI flashcard generation, and collaborative learning tools.
## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Core Functionality](#core-functionality)
- [Contributing](#contributing)
- [Future Enhancements](#future-enhancements)
- [License](#license)

## Features

### Core Features
- **Secure User Authentication** - Firebase Auth with email/password registration
- **File Upload & Management** - Support for PDF, Word, PowerPoint, and text files (up to 10MB)
- **Advanced Search & Filtering** - Multi-criteria search by subject, academic level, ratings
- **Rating & Review System** - Community-driven quality control with star ratings and comments
- **AI-Powered Flashcard Generation** - Automatic flashcard creation using Google Gemini API
- **Content Moderation** - User reporting system with automatic content hiding (7+ reports)
- **User Profiles & Statistics** - Comprehensive dashboards tracking contributions and activity

### Advanced Features
- **Real-time Synchronization** - Live updates across all connected devices
- **Contribution Point System** - Gamified engagement with level progression
- **Study Mode** - Interactive flashcard studying with progress tracking
- **Responsive Design** - Cross-device compatibility for mobile and desktop
- **Content Analytics** - Download tracking and usage statistics

## Technology Stack

### Frontend
- **React.js 18** - Component-based UI development
- **Material-UI (MUI)** - Modern design system and components
- **React Router** - Client-side routing and navigation
- **HTML5, CSS3, JavaScript (ES6+)** - Core web technologies

### Backend & Services
- **Firebase Authentication** - User management and security
- **Firebase Firestore** - NoSQL real-time database
- **Firebase Storage** - File storage and CDN
- **Firebase Functions** - Serverless text extraction processing
- **Google Gemini API** - AI-powered content generation

### Development Tools
- **Node.js 16+** - JavaScript runtime environment
- **npm/yarn** - Package management
- **Git** - Version control
- **Vercel** - Deployment and hosting platform

## System Requirements

### Client-Side (User Device)
- **Processor:** Dual-core 1.6 GHz or higher
- **RAM:** 4 GB minimum, 8 GB recommended
- **Storage:** 2 GB available space
- **Network:** Broadband internet (5+ Mbps for file uploads)
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Development Environment
- **Processor:** Quad-core 2.0 GHz or higher
- **RAM:** 8 GB minimum, 16 GB recommended
- **Storage:** 20 GB SSD space
- **OS:** Windows 10+, macOS 10.15+, or Ubuntu 18.04+
- **Node.js:** Version 16.0 or higher

## Installation & Setup

### Prerequisites
1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **Git** - [Download here](https://git-scm.com/)
3. **Firebase Account** - [Create account](https://firebase.google.com/)
4. **Google Gemini API Key** - [Get API key](https://ai.google.dev/)

### Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/notenest.git
   cd notenest
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase (if not already done)
   firebase init
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key
   ```

5. **Start Development Server**
   ```bash
   npm start
   ```
   The application will open at `http://localhost:3000`

## Environment Configuration

### Firebase Configuration

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Enable Authentication, Firestore, and Storage

2. **Authentication Setup**
   - Enable Email/Password authentication
   - Configure authorized domains

3. **Firestore Database Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /notes/{noteId} {
         allow read: if true;
         allow create, update: if request.auth != null;
         allow delete: if request.auth != null && 
           request.auth.uid == resource.data.uploaderId;
       }
       
       match /userProfiles/{userId} {
         allow read, write: if request.auth != null && 
           request.auth.uid == userId;
       }
       
       // Additional rules for other collections...
     }
   }
   ```

4. **Storage Security Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /notes/{fileName} {
         allow read: if true;
         allow write: if request.auth != null && 
           request.resource.size < 10 * 1024 * 1024;
       }
     }
   }
   ```

### Google Gemini API Setup

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Create a new API key
3. Add the key to your environment variables
4. Enable the Gemini API for your project

## Deployment

### Vercel Deployment (Recommended)

1. **Prepare for Deployment**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   - Push your code to GitHub
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically

3. **Environment Variables in Vercel**
   Add all your `REACT_APP_*` environment variables in the Vercel project settings.

### Alternative Deployment Options
- **Firebase Hosting** - `firebase deploy --only hosting`
- **Netlify** - Connect GitHub repository
- **Heroku** - Using buildpack for React apps

## Project Structure

```
notenest/
├── public/                 # Static files
├── src/
│   ├── components/        # Reusable UI components
│   │   └── auth/         # Authentication components
│   ├── context/          # React context providers
│   ├── pages/           # Main application pages
│   │   ├── Dashboard.js
│   │   ├── LandingPage.js
│   │   ├── NotesUpload.js
│   │   ├── NotesSearch.js
│   │   ├── UserProfile.js
│   │   └── FlashcardGenerator.js
│   ├── services/        # API and business logic
│   ├── styles/          # Theme and styling
│   ├── utils/           # Utility functions and constants
│   ├── App.js          # Main application component
│   ├── firebase.js     # Firebase configuration
│   └── index.js        # Application entry point
├── functions/           # Firebase Cloud Functions
├── .env                # Environment variables (not in repo)
├── .gitignore         # Git ignore rules
├── package.json       # Dependencies and scripts
└── README.md         # This file
```

## Core Functionality

### User Authentication
- Email/password registration and login
- Protected routes for authenticated users
- Automatic session management
- User profile creation and management

### Note Management
- Multi-format file upload (PDF, DOC, PPT, TXT)
- Comprehensive metadata (title, description, subject, tags)
- File preview and download functionality
- Content categorization and organization

### Search & Discovery
- Advanced filtering by subject, academic level, rating
- Real-time search with pagination
- Sort options (recent, popular, rating, alphabetical)
- Bookmark and favorites system

### AI Flashcard Generation
- Automatic text extraction from uploaded files
- Intelligent flashcard creation using Gemini AI
- Customizable difficulty levels and card counts
- Interactive study mode with progress tracking

### Community Features
- Star rating system (1-5 stars)
- Written reviews and comments
- Content reporting and moderation
- User reputation and contribution tracking

### Analytics & Insights
- Download tracking and statistics
- User activity logging
- Contribution point system
- Performance metrics and analytics

## Contributing

### Development Guidelines

1. **Code Style**
   - Use ESLint and Prettier for consistent formatting
   - Follow React best practices and hooks patterns
   - Write meaningful commit messages
   - Add comments for complex logic

2. **Feature Development**
   - Create feature branches from main
   - Write unit tests for new functionality
   - Update documentation for API changes
   - Test on multiple devices and browsers

3. **Pull Request Process**
   - Ensure all tests pass
   - Update README if needed
   - Get code review from maintainers
   - Squash commits before merging

### Setting Up Development Environment

```bash
# Fork the repository
git clone https://github.com/your-username/notenest.git
cd notenest

# Create feature branch
git checkout -b feature/new-feature-name

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Future Enhancements

### Planned Features
- **Real-time Collaboration** - Live document editing and sharing
- **Advanced Analytics** - Detailed user behavior insights
- **Mobile Applications** - Native iOS and Android apps
- **Video Content Support** - Upload and streaming capabilities
- **Study Groups** - Collaborative learning spaces
- **Advanced AI Features** - Smart content recommendations
- **Offline Mode** - Progressive Web App capabilities
- **Multi-language Support** - Internationalization

### Technical Improvements
- **Performance Optimization** - Lazy loading and caching
- **Enhanced Security** - Advanced authentication methods
- **Scalability** - Database optimization and CDN integration
- **Accessibility** - WCAG compliance improvements
- **Testing** - Comprehensive unit and integration tests

## API Documentation

### Core Endpoints

**Authentication**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

**Notes Management**
- `GET /api/notes` - Fetch notes with filtering
- `POST /api/notes` - Upload new note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

**User Management**
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/stats` - Get user statistics

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub

## Acknowledgments

- Google Gemini AI for intelligent content generation
- Firebase for backend infrastructure
- Material-UI for design components
- React community for excellent documentation

---

**NoteNest** - Transforming collaborative learning through intelligent note sharing.

Built with ❤️ for students, by students.
