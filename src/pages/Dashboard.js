// src/pages/Dashboard.js - FIXED IMPORTS
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Upload,
  Search,
  School,
  Person,
  Psychology,
  ExitToApp,
  Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
// ✅ USE NAMED IMPORTS - NO MORE CLASS ISSUES
import { getUserStats, trackNoteUpload, trackNoteDownload } from '../services/profileService';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const [userStats, setUserStats] = useState({
    notesUploaded: 0,
    notesDownloaded: 0,
    contributionPoints: 0
  });

  useEffect(() => {
    const loadUserStats = async () => {
      if (user) {
        try {
          console.log('🔄 Loading stats for user:', user.uid);
          
          const stats = await getUserStats(user.uid);
          console.log('📊 Stats loaded:', stats);
          
          setUserStats({
            notesUploaded: stats.totalNotesUploaded || 0,
            notesDownloaded: stats.totalNotesDownloaded || 0,
            contributionPoints: stats.contributionScore || 0
          });
        } catch (error) {
          console.error('❌ Error loading stats:', error);
        }
      }
    };
    
    loadUserStats();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const dashboardCards = [
    {
      title: 'Upload Notes',
      description: 'Share your study materials with the community',
      icon: <Upload sx={{ fontSize: 40, color: '#2E7D32' }} />,
      path: '/upload',
      gradient: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C8 100%)'
    },
    {
      title: 'Search Notes',
      description: 'Find the perfect study materials for your courses',
      icon: <Search sx={{ fontSize: 40, color: '#2E7D32' }} />,
      path: '/search',
      gradient: 'linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 100%)'
    },
    {
      title: 'My Profile',
      description: 'Manage your account and view your contributions',
      icon: <Person sx={{ fontSize: 40, color: '#2E7D32' }} />,
      path: '/profile',
      gradient: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'
    },
    {
      title: 'Flashcards',
      description: 'Generate smart flashcards from your notes',
      icon: <Psychology sx={{ fontSize: 40, color: '#2E7D32' }} />,
      path: '/flashcards',
      gradient: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 50%, #E3F2FD 100%)'
    }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(46, 125, 50, 0.1)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <School sx={{ fontSize: 32, color: '#2E7D32' }} />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                color: '#1B5E20'
              }}
            >
              NoteNest Dashboard
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton sx={{ color: '#2E7D32' }}>
              <Notifications />
            </IconButton>
            <IconButton 
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ p: 0 }}
            >
              <Avatar sx={{ bgcolor: '#2E7D32' }}>
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => navigate('/profile')}>
                <Person sx={{ mr: 1 }} /> Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography 
            variant="h3" 
            sx={{ 
              color: '#1B5E20',
              fontWeight: 'bold',
              mb: 2
            }}
          >
            Welcome back! 👋
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#4A5C3A',
              mb: 4,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            Ready to continue your learning journey? Choose an action below to get started.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            '@media (max-width: 900px)': {
              justifyContent: 'center'
            }
          }}>
            {dashboardCards.map((card, index) => (
              <Card 
                key={index}
                sx={{ 
                  flex: '1 1 22%',
                  minWidth: '220px',
                  maxWidth: '280px',
                  height: '240px',
                  background: card.gradient,
                  border: '1px solid rgba(46, 125, 50, 0.1)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  '@media (max-width: 900px)': {
                    flex: '1 1 45%',
                  },
                  '@media (max-width: 600px)': {
                    flex: '1 1 100%',
                    maxWidth: '400px'
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(46, 125, 50, 0.15)',
                    '& .card-button': {
                      backgroundColor: '#1B5E20'
                    }
                  }
                }}
                onClick={() => navigate(card.path)}
              >
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      {card.icon}
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#1B5E20',
                        fontWeight: 'bold',
                        mb: 1.5,
                        fontSize: '1.1rem'
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#4A5C3A',
                        lineHeight: 1.4,
                        mb: 2,
                        fontSize: '0.9rem'
                      }}
                    >
                      {card.description}
                    </Typography>
                  </Box>
                  
                  <Button
                    className="card-button"
                    variant="contained"
                    fullWidth
                    sx={{
                      py: 1.2,
                      backgroundColor: '#2E7D32',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#1B5E20'
                      }
                    }}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Stats Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              color: '#1B5E20',
              fontWeight: 'bold',
              mb: 4
            }}
          >
            📊 Your NoteNest Journey
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            maxWidth: 900,
            mx: 'auto'
          }}>
            {[
              { 
                number: userStats.notesUploaded,
                title: 'Notes Uploaded', 
                subtitle: 'Share your knowledge' 
              },
              { 
                number: userStats.notesDownloaded,
                title: 'Notes Downloaded', 
                subtitle: 'Learning resources' 
              },
              { 
                number: userStats.contributionPoints,
                title: 'Contribution Points', 
                subtitle: 'Community impact' 
              }
            ].map((stat, index) => (
              <Card key={index} sx={{ 
                flex: '1 1 280px',
                minWidth: '250px',
                maxWidth: '300px',
                textAlign: 'center', 
                p: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(46, 125, 50, 0.1)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 15px 30px rgba(46, 125, 50, 0.1)'
                }
              }}>
                <Typography variant="h2" sx={{ 
                  color: '#2E7D32', 
                  fontWeight: 'bold',
                  mb: 1,
                  fontSize: '2.5rem'
                }}>
                  {stat.number}
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: '#4A5C3A', 
                  fontWeight: 'bold',
                  mb: 1
                }}>
                  {stat.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {stat.subtitle}
                </Typography>
              </Card>
            ))}
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#1B5E20',
              fontWeight: 'bold',
              mb: 3
            }}
          >
            🚀 Quick Actions
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Upload />}
              onClick={() => navigate('/upload')}
              sx={{
                px: 3,
                py: 1.5,
                color: '#2E7D32',
                borderColor: '#2E7D32',
                '&:hover': {
                  borderColor: '#1B5E20',
                  backgroundColor: 'rgba(46, 125, 50, 0.04)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Upload Notes
            </Button>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<Search />}
              onClick={() => navigate('/search')}
              sx={{
                px: 3,
                py: 1.5,
                backgroundColor: '#2E7D32',
                '&:hover': {
                  backgroundColor: '#1B5E20',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(46, 125, 50, 0.3)'
                }
              }}
            >
              Browse Notes
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;