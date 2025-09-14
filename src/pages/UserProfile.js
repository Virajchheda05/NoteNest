// src/pages/UserProfile.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  Rating,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Skeleton,
  Badge
} from '@mui/material';
import {
  ArrowBack,
  School,
  Edit,
  Delete,
  Visibility,
  Download,
  Flag,
  Star,
  Timeline,
  Assessment,
  Settings,
  FileUpload,
  RateReview,
  Person,
  Save,
  Cancel
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Use only named imports from the fixed service
import { 
  getUserDashboardData,
  getUserNotes, 
  getUserRecentActivity,
  getUserReviewsGiven,
  getUserReviewsReceived,
  getUserReportsSubmitted,
  updateUserProfile,
  updateUserNote,
  deleteUserNote
} from '../services/profileService';
import { SUBJECTS, ACADEMIC_LEVELS } from '../utils/constants';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Profile data states
  const [profileData, setProfileData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [userNotes, setUserNotes] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [reviewsGiven, setReviewsGiven] = useState([]);
  const [reviewsReceived, setReviewsReceived] = useState([]);
  const [reportsSubmitted, setReportsSubmitted] = useState([]);

  // Edit states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({});
  const [editNoteDialog, setEditNoteDialog] = useState({ open: false, note: null });
  const [deleteNoteDialog, setDeleteNoteDialog] = useState({ open: false, note: null });
  
  // Notification states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading profile data for:', user.uid);
      
      // Load all data in parallel
      const [dashboard, notes, activity, given, received, reports] = await Promise.all([
        getUserDashboardData(user.uid),
        getUserNotes(user.uid, false),
        getUserRecentActivity(user.uid, 20),
        getUserReviewsGiven(user.uid, 30),
        getUserReviewsReceived(user.uid),
        getUserReportsSubmitted(user.uid)
      ]);

      console.log('Loaded data:', {
        profile: dashboard.profile,
        stats: dashboard.stats,
        notes: notes.length,
        activity: activity.length,
        reviewsGiven: given.length,
        reviewsReceived: received.length,
        reports: reports.length
      });

      setDashboardData(dashboard);
      setProfileData(dashboard.profile);
      setUserNotes(notes);
      setUserActivity(activity);
      setReviewsGiven(given);
      setReviewsReceived(received);
      setReportsSubmitted(reports);

    } catch (error) {
      console.error('Error loading profile data:', error);
      setError('Failed to load profile data: ' + error.message);
      showSnackbar('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      console.log('Updating profile:', editProfileData);
      
      await updateUserProfile(user.uid, editProfileData);
      setProfileData({ ...profileData, ...editProfileData });
      setEditDialogOpen(false);
      showSnackbar('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showSnackbar('Failed to update profile: ' + error.message, 'error');
    }
  };

  const handleEditNote = async () => {
    try {
      const { note } = editNoteDialog;
      console.log('Updating note:', note.id);
      
      await updateUserNote(note.id, user.uid, {
        title: note.title,
        description: note.description,
        tags: note.tags
      });

      // Refresh notes list
      const updatedNotes = await getUserNotes(user.uid, false);
      setUserNotes(updatedNotes);
      
      setEditNoteDialog({ open: false, note: null });
      showSnackbar('Note updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating note:', error);
      showSnackbar('Failed to update note: ' + error.message, 'error');
    }
  };

  const handleDeleteNote = async () => {
    try {
      const { note } = deleteNoteDialog;
      console.log('Deleting note:', note.id);
      
      await deleteUserNote(note.id, user.uid);

      // Refresh notes list
      const updatedNotes = await getUserNotes(user.uid, false);
      setUserNotes(updatedNotes);
      
      setDeleteNoteDialog({ open: false, note: null });
      showSnackbar('Note deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting note:', error);
      showSnackbar('Failed to delete note: ' + error.message, 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    try {
      if (typeof date === 'string') return date; // Already formatted
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('powerpoint')) return '📊';
    return '📄';
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'note_upload': return <FileUpload sx={{ color: '#2E7D32' }} />;
      case 'note_download': return <Download sx={{ color: '#1976D2' }} />;
      case 'review_given': return <RateReview sx={{ color: '#FF9800' }} />;
      case 'review_received': return <Star sx={{ color: '#FFD700' }} />;
      case 'note_edited': return <Edit sx={{ color: '#9C27B0' }} />;
      case 'note_deleted': return <Delete sx={{ color: '#F44336' }} />;
      default: return <Timeline sx={{ color: '#666' }} />;
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ width: '100%' }}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 50%, #E3F2FD 100%)'
      }}>
        <AppBar position="static" elevation={0} sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(46, 125, 50, 0.1)'
        }}>
          <Toolbar>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2, color: '#2E7D32' }}>
              <ArrowBack />
            </IconButton>
            <School sx={{ fontSize: 32, color: '#2E7D32', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1B5E20', flexGrow: 1 }}>
              My Profile
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="circular" width={80} height={80} />
                  <Box>
                    <Skeleton variant="text" height={40} width={200} />
                    <Skeleton variant="text" height={20} width={150} />
                  </Box>
                </Box>
              </Card>
            </Grid>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: 120 }}>
                  <CardContent>
                    <Skeleton variant="text" height={30} />
                    <Skeleton variant="text" height={50} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 50%, #E3F2FD 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="sm">
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ backgroundColor: '#2E7D32' }}
          >
            Retry
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 50%, #E3F2FD 100%)'
    }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ 
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(46, 125, 50, 0.1)'
      }}>
        <Toolbar>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2, color: '#2E7D32' }}>
            <ArrowBack />
          </IconButton>
          <School sx={{ fontSize: 32, color: '#2E7D32', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1B5E20', flexGrow: 1 }}>
            My Profile
          </Typography>
          <IconButton onClick={() => {
            setEditProfileData(profileData || {});
            setEditDialogOpen(true);
          }} sx={{ color: '#2E7D32' }}>
            <Edit />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Profile Header */}
        <Card sx={{ mb: 4, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                backgroundColor: '#2E7D32',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}>
                {profileData?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1B5E20', mb: 1 }}>
                  {profileData?.displayName || user?.email?.split('@')[0] || 'Complete Your Profile'}
                </Typography>
                <Typography variant="body1" sx={{ color: '#4A5C3A', mb: 1 }}>
                  {profileData?.university && profileData?.major
                    ? `${profileData.major} at ${profileData.university}`
                    : user?.email || 'No email available'
                  }
                </Typography>
                {profileData?.academicYear && (
                  <Chip 
                    label={profileData.academicYear} 
                    size="small"
                    sx={{ backgroundColor: '#E3F2FD', color: '#1976d2', mr: 1 }}
                  />
                )}
                <Chip 
                  label={dashboardData?.stats?.contributionLevel || 'Newcomer'}
                  sx={{ backgroundColor: '#E8F5E8', color: '#1B5E20', fontWeight: 'bold' }}
                />
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                  {dashboardData?.stats?.contributionScore || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Contribution Points
                </Typography>
              </Box>
            </Box>

            {profileData?.bio && (
              <Typography variant="body1" sx={{ color: '#4A5C3A', fontStyle: 'italic' }}>
                "{profileData.bio}"
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Statistics Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C8 100%)' }}>
              <CardContent>
                <FileUpload sx={{ fontSize: 40, color: '#2E7D32', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#1B5E20', fontWeight: 'bold' }}>
                  {dashboardData?.stats?.totalNotesUploaded || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#4A5C3A' }}>
                  Notes Uploaded
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)' }}>
              <CardContent>
                <Download sx={{ fontSize: 40, color: '#1976D2', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#1B5E20', fontWeight: 'bold' }}>
                  {dashboardData?.stats?.totalNotesDownloaded || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#4A5C3A' }}>
                  Notes Downloaded
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)' }}>
              <CardContent>
                <Star sx={{ fontSize: 40, color: '#FF9800', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#1B5E20', fontWeight: 'bold' }}>
                  {dashboardData?.stats?.totalReviewsGiven || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#4A5C3A' }}>
                  Reviews Given
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)' }}>
              <CardContent>
                <RateReview sx={{ fontSize: 40, color: '#9C27B0', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#1B5E20', fontWeight: 'bold' }}>
                  {dashboardData?.stats?.totalReviewsReceived || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#4A5C3A' }}>
                  Reviews Received
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs Section */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                color: '#4A5C3A',
                '&.Mui-selected': { color: '#2E7D32' }
              },
              '& .MuiTabs-indicator': { backgroundColor: '#2E7D32' }
            }}
          >
            <Tab label={
              <Badge badgeContent={userNotes.length || null} color="primary">
                My Notes
              </Badge>
            } />
            <Tab label={
              <Badge badgeContent={userActivity.length || null} color="primary">
                Activity
              </Badge>
            } />
            <Tab label={
              <Badge badgeContent={(reviewsGiven.length + reviewsReceived.length) || null} color="primary">
                Reviews
              </Badge>
            } />
            <Tab label={
              <Badge badgeContent={reportsSubmitted.length || null} color="primary">
                Reports
              </Badge>
            } />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={currentTab} index={0}>
          <Typography variant="h5" sx={{ color: '#1B5E20', mb: 3, fontWeight: 'bold' }}>
            My Uploaded Notes ({userNotes.length})
          </Typography>
          
          {userNotes.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                No notes uploaded yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                Share your study materials with the community to earn contribution points!
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/upload')}
                sx={{ backgroundColor: '#2E7D32' }}
              >
                Upload Your First Note
              </Button>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {userNotes.map((note) => (
                <Grid item xs={12} sm={6} md={4} key={note.id}>
                  <Card sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 30px rgba(46, 125, 50, 0.15)'
                    }
                  }}>
                    <Box sx={{ 
                      height: 80,
                      background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <Typography sx={{ opacity: 0.3, fontSize: '2rem' }}>
                        {getFileIcon(note.files?.[0]?.fileType)}
                      </Typography>
                      
                      {note.isHidden && (
                        <Chip
                          label="Hidden"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: '#f44336',
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        color: '#1B5E20',
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {note.title}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                        <Chip label={note.subject || 'General'} size="small" sx={{ 
                          backgroundColor: '#E8F5E8', color: '#1B5E20', fontSize: '0.7rem' 
                        }} />
                        <Chip label={note.academicLevel || 'Unknown'} size="small" sx={{ 
                          backgroundColor: '#E3F2FD', color: '#1976d2', fontSize: '0.7rem' 
                        }} />
                      </Box>

                      <Typography variant="body2" sx={{ 
                        color: '#4A5C3A',
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {note.description || 'No description'}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Rating value={note.averageRating || 0} readOnly size="small" />
                          <Typography variant="caption">({note.totalRatings || 0})</Typography>
                        </Box>
                        <Typography variant="caption">
                          {note.downloadCount || 0} downloads
                        </Typography>
                      </Box>

                      <Typography variant="caption" sx={{ color: '#666' }}>
                        Uploaded: {formatDate(note.createdAt)}
                      </Typography>
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => setEditNoteDialog({ open: true, note: { ...note } })}
                            sx={{
                              color: '#2E7D32',
                              borderColor: '#2E7D32',
                              fontSize: '0.75rem'
                            }}
                          >
                            Edit
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            startIcon={<Delete />}
                            onClick={() => setDeleteNoteDialog({ open: true, note })}
                            sx={{
                              color: '#f44336',
                              borderColor: '#f44336',
                              fontSize: '0.75rem'
                            }}
                          >
                            Delete
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Typography variant="h5" sx={{ color: '#1B5E20', mb: 3, fontWeight: 'bold' }}>
            Recent Activity ({userActivity.length})
          </Typography>
          
          {userActivity.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#666' }}>
                No recent activity
              </Typography>
            </Card>
          ) : (
            <List>
              {userActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ backgroundColor: '#E8F5E8' }}>
                        {getActivityIcon(activity.activityType)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.description}
                      secondary={activity.formattedDate || formatDate(activity.createdAt)}
                      primaryTypographyProps={{ color: '#1B5E20' }}
                      secondaryTypographyProps={{ color: '#666' }}
                    />
                  </ListItem>
                  {index < userActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Typography variant="h5" sx={{ color: '#1B5E20', mb: 3, fontWeight: 'bold' }}>
            My Reviews
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '400px', overflow: 'auto' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#1B5E20', mb: 2 }}>
                    Reviews Given ({reviewsGiven.length})
                  </Typography>
                  
                  {reviewsGiven.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', mt: 4 }}>
                      No reviews given yet
                    </Typography>
                  ) : (
                    <List dense>
                      {reviewsGiven.map((review) => (
                        <ListItem key={review.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Rating value={review.rating} readOnly size="small" />
                                <Typography variant="caption">
                                  {review.formattedDate || formatDate(review.createdAt)}
                                </Typography>
                              </Box>
                            }
                            secondary={review.comment || 'No comment'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '400px', overflow: 'auto' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#1B5E20', mb: 2 }}>
                    Reviews Received ({reviewsReceived.length})
                  </Typography>
                  
                  {reviewsReceived.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', mt: 4 }}>
                      No reviews received yet
                    </Typography>
                  ) : (
                    <List dense>
                      {reviewsReceived.map((review) => (
                        <ListItem key={review.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                  {review.noteTitle}
                                </Typography>
                                <Rating value={review.rating} readOnly size="small" />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                  by {review.userName} • {review.formattedDate || formatDate(review.createdAt)}
                                </Typography>
                                {review.comment && (
                                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    "{review.comment}"
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Typography variant="h5" sx={{ color: '#1B5E20', mb: 3, fontWeight: 'bold' }}>
            Content Reports ({reportsSubmitted.length})
          </Typography>
          
          {reportsSubmitted.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#666' }}>
                No reports submitted
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                Help keep our community safe by reporting inappropriate content.
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {reportsSubmitted.map((report) => (
                <Grid item xs={12} md={6} key={report.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip 
                          label={report.reason} 
                          color={report.status === 'pending' ? 'warning' : report.status === 'resolved' ? 'success' : 'default'}
                          size="small"
                        />
                        <Chip 
                          label={report.status} 
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: '#666', mb: 1, fontWeight: 'bold' }}>
                        Note: {report.noteTitle}
                      </Typography>
                      
                      {report.description && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          "{report.description}"
                        </Typography>
                      )}
                      
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        Reported: {report.formattedDate || formatDate(report.createdAt)}
                      </Typography>
                      
                      {report.reviewedAt && (
                        <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                          Reviewed: {report.formattedReviewDate || formatDate(report.reviewedAt)}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Container>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Display Name"
                value={editProfileData.displayName || ''}
                onChange={(e) => setEditProfileData({...editProfileData, displayName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="University"
                value={editProfileData.university || ''}
                onChange={(e) => setEditProfileData({...editProfileData, university: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Major"
                value={editProfileData.major || ''}
                onChange={(e) => setEditProfileData({...editProfileData, major: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={editProfileData.academicYear || ''}
                  label="Academic Year"
                  onChange={(e) => setEditProfileData({...editProfileData, academicYear: e.target.value})}
                >
                  {ACADEMIC_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Bio"
                placeholder="Tell us about yourself..."
                value={editProfileData.bio || ''}
                onChange={(e) => setEditProfileData({...editProfileData, bio: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateProfile} variant="contained" sx={{ backgroundColor: '#2E7D32' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={editNoteDialog.open} onClose={() => setEditNoteDialog({ open: false, note: null })} maxWidth="md" fullWidth>
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent>
          {editNoteDialog.note && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={editNoteDialog.note.title || ''}
                  onChange={(e) => setEditNoteDialog({
                    ...editNoteDialog,
                    note: { ...editNoteDialog.note, title: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={editNoteDialog.note.description || ''}
                  onChange={(e) => setEditNoteDialog({
                    ...editNoteDialog,
                    note: { ...editNoteDialog.note, description: e.target.value }
                  })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNoteDialog({ open: false, note: null })}>Cancel</Button>
          <Button onClick={handleEditNote} variant="contained" sx={{ backgroundColor: '#2E7D32' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Note Dialog */}
      <Dialog open={deleteNoteDialog.open} onClose={() => setDeleteNoteDialog({ open: false, note: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteNoteDialog.note?.title}"? This action cannot be undone.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
            The note will be soft-deleted and no longer visible to other users, but existing reviews and references will be preserved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteNoteDialog({ open: false, note: null })}>Cancel</Button>
          <Button onClick={handleDeleteNote} variant="contained" color="error">
            Delete Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserProfile;