// src/components/auth/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        bgcolor="#F1F8E9"
      >
        <CircularProgress sx={{ color: '#2E7D32' }} />
      </Box>
    );
  }

  return user ? children : <Navigate to="/" />;
};

export default ProtectedRoute;