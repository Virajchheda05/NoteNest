// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import theme from './styles/theme';

// Pages
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import NotesUpload from "./pages/NotesUpload";
import NotesSearch from "./pages/NotesSearch";
import UserProfile from "./pages/UserProfile";
import FlashcardGenerator from "./pages/FlashcardGenerator";

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <NotesUpload />
              </ProtectedRoute>
            } />
            {/* Uncomment these as you build them */}
            <Route path="/search" element={
              <ProtectedRoute>
                <NotesSearch />
              </ProtectedRoute>
            } />
             
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            
            <Route path="/flashcards" element={
              <ProtectedRoute>
                <FlashcardGenerator />
              </ProtectedRoute>
            } /> 
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;