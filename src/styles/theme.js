// src/styles/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',      // Forest Green
      light: '#4CAF50',     // Light Green
      dark: '#1B5E20',      // Dark Green
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4A5C3A',      // Sage Green
      light: '#8BC34A',     // Light Lime
      dark: '#2E7D32',      // Dark Forest
      contrastText: '#ffffff',
    },
    background: {
      default: '#F1F8E9',   // Very Light Green
      paper: '#FFFFFF',     // White
    },
    text: {
      primary: '#1B5E20',   // Dark Green
      secondary: '#4A5C3A', // Sage Green
    },
    success: {
      main: '#4CAF50',
    },
    info: {
      main: '#E3F2FD',      // Light Blue
    },
    warning: {
      main: '#FF9800',
    },
    error: {
      main: '#F44336',
    }
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#1B5E20',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      color: '#1B5E20',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      color: '#1B5E20',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#1B5E20',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#1B5E20',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      color: '#4A5C3A',
    },
    body1: {
      color: '#4A5C3A',
      lineHeight: 1.6,
    },
    body2: {
      color: '#4A5C3A',
      lineHeight: 1.5,
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          }
        },
        contained: {
          boxShadow: '0 4px 15px rgba(46, 125, 50, 0.2)',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(46, 125, 50, 0.3)',
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          }
        }
      }
    }
  }
});

export default theme;