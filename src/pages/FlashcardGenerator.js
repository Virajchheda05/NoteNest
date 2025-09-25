import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
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
  Skeleton,
  AppBar,
  Toolbar,
  CircularProgress,
  LinearProgress,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  School,
  ArrowBack,
  AutoAwesome,
  Quiz,
  Edit,
  Delete,
  PlayArrow,
  Psychology,
  SmartToy,
  Description,
  Close,
  ThumbUp,
  ThumbDown,
  Timer
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { getUserNotes } from '../services/profileService';
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from 'firebase/functions';

const auth = getAuth();
const functions = getFunctions();
const generateFlashcardsFunction = httpsCallable(functions, 'generateFlashcardsFromNote');

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ width: '100%' }}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const FlashcardGenerator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userNotes, setUserNotes] = useState([]);
  const [flashcardSets, setFlashcardSets] = useState([]);
  
  const [selectedNote, setSelectedNote] = useState(null);
  const [generationStep, setGenerationStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [generationSettings, setGenerationSettings] = useState({
    difficulty: 'medium',
    cardCount: 10
  });
  const [generatedCards, setGeneratedCards] = useState([]);
  
  const [studyMode, setStudyMode] = useState(false);
  const [studySet, setStudySet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyProgress, setStudyProgress] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  });
  const [studyStartTime, setStudyStartTime] = useState(null);
  const [studyTimer, setStudyTimer] = useState(0);
  
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [setName, setSetName] = useState('');
  const [setDescription, setSetDescription] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadFlashcardSets = useCallback(async () => {
    try {
      console.log('📚 Loading flashcard sets for user:', user.uid);
      const setsRef = collection(db, 'flashcardSets');
      const setsQuery = query(setsRef, where('userId', '==', user.uid));
      
      const querySnapshot = await getDocs(setsQuery);
      let sets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      sets = sets.sort((a, b) => b.createdAt - a.createdAt);
      console.log('✅ Loaded flashcard sets:', sets.length);
      return sets;
    } catch (error) {
      console.error('❌ Error loading flashcard sets:', error);
      showSnackbar('Failed to load flashcard sets', 'error');
      return [];
    }
  }, [user.uid, showSnackbar]);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading flashcard data for user:', user.uid);
      
      const [notes, sets] = await Promise.all([
        getUserNotes(user.uid, false),
        loadFlashcardSets()
      ]);
      
      setUserNotes(notes);
      setFlashcardSets(sets);
      console.log('✅ Loaded:', notes.length, 'notes and', sets.length, 'flashcard sets');
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.uid, loadFlashcardSets, showSnackbar]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  useEffect(() => {
    let interval;
    if (studyMode && studyStartTime) {
      interval = setInterval(() => {
        setStudyTimer(Math.floor((Date.now() - studyStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [studyMode, studyStartTime]);
  
  const handleStartGeneration = async () => {
    setGenerationStep(1);
  };
  
  const handleExtractAndGenerate = async () => {
    const user = auth.currentUser;
    if (!user) {
      showSnackbar('Please log in to generate flashcards.', 'error');
      return;
    }
    
    if (!selectedNote.files || selectedNote.files.length === 0) {
      showSnackbar('No files found in this note', 'error');
      return;
    }

    setGenerating(true);
    setGenerationStep(2);
    showSnackbar('Generating flashcards with Gemini AI...', 'info');

    try {
      const idToken = await user.getIdToken();
      const result = await generateFlashcardsFunction({
        idToken: idToken,
        fileUrl: selectedNote.files[0].fileUrl,
        fileType: selectedNote.files[0].fileType,
        generationSettings: generationSettings,
      });

      const { flashcards } = result.data;
      if (flashcards && flashcards.length > 0) {
        setGeneratedCards(flashcards);
        setGenerationStep(3);
        showSnackbar(`Successfully generated ${flashcards.length} flashcards!`, 'success');
      } else {
        throw new Error('No flashcards were generated by the AI.');
      }

    } catch (error) {
      console.error('❌ Flashcard generation failed:', error);
      setGenerationStep(1);
      showSnackbar(`Flashcard generation failed: ${error.message}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const saveFlashcardSet = useCallback(async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!setName.trim() || generatedCards.length === 0) {
      showSnackbar('Please provide a name and generate cards first', 'warning');
      return;
    }

    try {
      console.log('💾 Saving flashcard set:', setName);
      
      const setData = {
        name: setName.trim(),
        description: setDescription.trim(),
        cards: generatedCards,
        userId: user.uid,
        sourceNoteId: selectedNote?.id || null,
        sourceNoteTitle: selectedNote?.title || null,
        totalCards: generatedCards.length,
        subject: selectedNote?.subject || 'General',
        difficulty: generationSettings.difficulty,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        studyCount: 0,
        lastStudied: null,
        isPublic: false
      };

      const setRef = await addDoc(collection(db, 'flashcardSets'), setData);
      console.log('✅ Saved with ID:', setRef.id);
      
      const newSet = {
        id: setRef.id,
        ...setData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setFlashcardSets(prev => [newSet, ...prev]);

      const statsRef = doc(db, 'userStats', user.uid);
      await updateDoc(statsRef, {
        contributionScore: increment(5),
        updatedAt: serverTimestamp()
      });
      setSaveDialogOpen(false);
      setSetName('');
      setSetDescription('');
      showSnackbar('Flashcard set saved successfully!', 'success');
      setCurrentTab(2);
    } catch (error) {
      console.error('❌ Save failed:', error);
      showSnackbar('Failed to save: ' + error.message, 'error');
    }
  }, [setName, setDescription, generatedCards, user.uid, selectedNote, generationSettings.difficulty, showSnackbar]);

  const finishStudySession = async () => {
    try {
      const setRef = doc(db, 'flashcardSets', studySet.id);
      await updateDoc(setRef, {
        studyCount: increment(1),
        lastStudied: serverTimestamp()
      });
      const accuracy = Math.round((studyProgress.correct / studyProgress.total) * 100);
      showSnackbar(`Study complete! Score: ${studyProgress.correct}/${studyProgress.total} (${accuracy}%)`, 'success');
      
      setStudyMode(false);
      setCurrentTab(2);
    } catch (error) {
      console.error('❌ Study completion failed:', error);
    }
  };
  
  const handleStudyAnswer = useCallback((isCorrect) => {
    console.log('📝 Answer:', isCorrect ? 'Correct' : 'Incorrect');
    
    setStudyProgress(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    if (currentCardIndex < studySet.cards.length - 1) {
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
        setShowAnswer(false);
      }, 1000);
    } else {
      setTimeout(() => {
        finishStudySession();
      }, 1000);
    }
  }, [currentCardIndex, studySet?.cards.length, finishStudySession]);

  const startStudyMode = useCallback((flashcardSet) => {
    console.log('🎓 Starting study mode:', flashcardSet.name);
    setStudySet(flashcardSet);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setStudyProgress({ correct: 0, incorrect: 0, total: flashcardSet.cards.length });
    setStudyStartTime(Date.now());
    setStudyTimer(0);
    setStudyMode(true);
  }, []);

  const deleteFlashcardSet = useCallback(async (setId) => {
    try {
      await deleteDoc(doc(db, 'flashcardSets', setId));
      setFlashcardSets(prev => prev.filter(set => set.id !== setId));
      showSnackbar('Flashcard set deleted', 'success');
    } catch (error) {
      console.error('❌ Delete failed:', error);
      showSnackbar('Failed to delete flashcard set', 'error');
    }
  }, [showSnackbar]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getFileIcon = useCallback((fileType) => {
    if (!fileType) return '📄';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('powerpoint')) return '📊';
    return '📄';
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 50%, #E3F2FD 100%)'
      }}>
        <AppBar position="static" elevation={0} sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)'
        }}>
          
          <Toolbar>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2, color: '#2E7D32' }}>
              <ArrowBack />
            </IconButton>
            <School sx={{ fontSize: 32, color: '#2E7D32', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1B5E20' }}>
              Flashcards
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: 200 }}>
                  <CardContent>
                    <Skeleton variant="rectangular" height={60} />
                    <Skeleton variant="text" height={30} sx={{ mt: 2 }} />
                    <Skeleton variant="text" height={20} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  const MyNotesTab = () => (
  <>
    <Typography variant="h4" sx={{ color: '#1B5E20', mb: 4, fontWeight: 'bold' }}>
      Select Notes for AI Flashcard Generation
    </Typography>
    
    {userNotes.length === 0 ? (
      <Card sx={{ 
        p: 6, 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f8fffe 0%, #f1f8e9 100%)',
        border: '2px dashed #2E7D32',
        borderRadius: 3
      }}>
        <Description sx={{ fontSize: 80, color: '#2E7D32', mb: 3, opacity: 0.7 }} />
        <Typography variant="h5" sx={{ color: '#1B5E20', mb: 2, fontWeight: 'bold' }}>
          No notes uploaded yet
        </Typography>
        <Typography variant="body1" sx={{ color: '#4A5C3A', mb: 3 }}>
          Upload your first notes to start generating AI flashcards
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/upload')}
          sx={{ 
            backgroundColor: '#2E7D32',
            px: 4,
            py: 1.5,
            borderRadius: 2
          }}
        >
          Upload Notes
        </Button>
      </Card>
    ) : (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
          lg: 'repeat(5, 1fr)',
          xl: 'repeat(6, 1fr)'
        },
        gap: 2,
        alignItems: 'start'
      }}>
        {userNotes.map((note) => (
          <Card key={note.id} sx={{ 
            height: 240, // Reduced height
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: selectedNote?.id === note.id ? '3px solid #2E7D32' : '1px solid #e0e0e0',
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': { 
              transform: 'translateY(-6px)',
              boxShadow: '0 10px 25px rgba(46, 125, 50, 0.15)',
              borderColor: selectedNote?.id === note.id ? '#2E7D32' : '#4CAF50'
            }
          }}>
            {/* Header Section - Reduced Height */}
            <Box sx={{ 
              height: 60, // Reduced from 80px
              background: selectedNote?.id === note.id 
                ? 'linear-gradient(135deg, #C8E6C9 0%, #E8F5E8 100%)' 
                : 'linear-gradient(135deg, #F1F8E9 0%, #E8F5E8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid rgba(46, 125, 50, 0.1)',
              position: 'relative'
            }}>
              <Typography sx={{ 
                opacity: selectedNote?.id === note.id ? 0.7 : 0.4, 
                fontSize: '1.8rem', // Reduced font size
                color: '#2E7D32'
              }}>
                {getFileIcon(note.files?.[0]?.fileType)}
              </Typography>
              
              {/* Selection indicator */}
              {selectedNote?.id === note.id && (
                <Box sx={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20, // Smaller indicator
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem'
                }}>
                  ✓
                </Box>
              )}
            </Box>

            {/* Content Section - More Compact */}
            <CardContent sx={{ 
              flexGrow: 1,
              p: 2, // Reduced padding
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box>
                {/* Title - Smaller */}
                <Typography variant="subtitle1" sx={{ // Changed from h6
                  fontWeight: 'bold',
                  color: selectedNote?.id === note.id ? '#1B5E20' : '#2E7D32',
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: 1.2,
                  minHeight: '2.4em',
                  fontSize: '0.95rem'
                }}>
                  {note.title}
                </Typography>

                {/* Subject Tag - Smaller */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 0.5, 
                  mb: 1,
                  minHeight: '22px',
                  alignItems: 'flex-start'
                }}>
                  <Chip 
                    label={note.subject || 'General'} 
                    size="small" 
                    sx={{ 
                      backgroundColor: selectedNote?.id === note.id ? '#2E7D32' : '#E8F5E8',
                      color: selectedNote?.id === note.id ? 'white' : '#1B5E20',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      height: '20px'
                    }} 
                  />
                  {note.files && note.files.length > 0 && (
                    <Chip 
                      label={`${note.files.length} file${note.files.length > 1 ? 's' : ''}`}
                      size="small" 
                      sx={{ 
                        backgroundColor: '#E3F2FD',
                        color: '#1976d2',
                        fontSize: '0.65rem',
                        height: '20px'
                      }} 
                    />
                  )}
                </Box>

                {/* Description - Shorter */}
                <Typography variant="body2" sx={{ 
                  color: '#4A5C3A',
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1, // Reduced to 1 line
                  WebkitBoxOrient: 'vertical',
                  lineHeight: 1.3,
                  minHeight: '1.3em',
                  fontSize: '0.8rem'
                }}>
                  {note.description || 'No description available'}
                </Typography>
              </Box>

              {/* Metadata - Compact */}
              <Box>
                <Typography variant="caption" sx={{ 
                  color: '#666',
                  display: 'block',
                  mb: 0.5,
                  fontSize: '0.7rem'
                }}>
                  {note.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                  {note.averageRating > 0 && (
                    <Box component="span" sx={{ ml: 1, color: '#FF9800', fontWeight: 'bold' }}>
                      ★ {note.averageRating.toFixed(1)}
                    </Box>
                  )}
                </Typography>
              </Box>
            </CardContent>

            {/* Action Section - Compact */}
            <Box sx={{ 
              p: 2, 
              pt: 0
            }}>
              <Button
                fullWidth
                variant={selectedNote?.id === note.id ? "contained" : "outlined"}
                size="small" // Made button smaller
                onClick={() => {
                  setSelectedNote(note);
                  setCurrentTab(1);
                  setGenerationStep(0);
                  setExtractedText('');
                  setGeneratedCards([]);
                }}
                sx={{
                  color: selectedNote?.id === note.id ? 'white' : '#2E7D32',
                  backgroundColor: selectedNote?.id === note.id ? '#2E7D32' : 'transparent',
                  borderColor: '#2E7D32',
                  fontWeight: 'bold',
                  py: 0.5, // Reduced padding
                  borderRadius: 1.5,
                  fontSize: '0.8rem', // Smaller font
                  '&:hover': {
                    backgroundColor: selectedNote?.id === note.id ? '#1B5E20' : 'rgba(46, 125, 50, 0.04)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                {selectedNote?.id === note.id ? 'Selected ✓' : 'Select'}
              </Button>
            </Box>
          </Card>
        ))}
      </Box>
    )}
  </>
);

  const GenerateCardsTab = () => (
    <>
      <Typography variant="h4" sx={{ color: '#1B5E20', mb: 3, fontWeight: 'bold' }}>
        Generate AI Flashcards with Gemini
      </Typography>

      {!selectedNote ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <AutoAwesome sx={{ fontSize: 64, color: '#2E7D32', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
            No note selected
          </Typography>
          <Button
            variant="contained"
            onClick={() => setCurrentTab(0)}
            sx={{ backgroundColor: '#2E7D32' }}
          >
            Select Note
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
                <Grid item xs={12} md={5}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    flexDirection: 'column',
                    p: 2,
                    borderRight: { md: '1px solid #e0e0e0' }
                  }}>
                    <Typography sx={{ opacity: 0.8, fontSize: '3rem', color: '#1B5E20', mb: 1 }}>
                      {getFileIcon(selectedNote.files?.[0]?.fileType)}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1B5E20', mb: 0.5 }}>
                      {selectedNote.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      {selectedNote.subject} • {selectedNote.files?.length || 0} file(s)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4A5C3A', textAlign: 'center' }}>
                      AI will extract text from your file and generate intelligent flashcards.
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Box sx={{ p: 2 }}>
                    <Stepper activeStep={generationStep} sx={{ mb: 4 }}>
                      <Step><StepLabel>Extract Text</StepLabel></Step>
                      <Step><StepLabel>Configure Settings</StepLabel></Step>
                      <Step><StepLabel>Generate with AI</StepLabel></Step>
                      <Step><StepLabel>Review & Save</StepLabel></Step>
                    </Stepper>

                    {generationStep === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Description sx={{ fontSize: 64, color: '#2E7D32', mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Generate flashcards from: {selectedNote.files?.[0]?.fileName || 'your file'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                          Click below to start the AI generation process.
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleStartGeneration}
                          sx={{ backgroundColor: '#2E7D32' }}
                        >
                          Start AI Generation
                        </Button>
                      </Box>
                    )}

                    {generationStep === 1 && (
                      <Box>
                        <Typography variant="h6" sx={{ mb: 3 }}>
                          Configure AI Generation Settings
                        </Typography>
                        
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Difficulty Level</InputLabel>
                              <Select
                                value={generationSettings.difficulty}
                                label="Difficulty Level"
                                onChange={(e) => setGenerationSettings({
                                  ...generationSettings,
                                  difficulty: e.target.value
                                })}
                              >
                                <MenuItem value="easy">Easy</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="hard">Hard</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Number of Cards"
                              value={generationSettings.cardCount}
                              onChange={(e) => setGenerationSettings({
                                ...generationSettings,
                                cardCount: Math.min(20, Math.max(5, parseInt(e.target.value) || 10))
                              })}
                              inputProps={{ min: 5, max: 20 }}
                              helperText="Between 5 and 20 cards"
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                              <Button
                                variant="outlined"
                                onClick={() => setGenerationStep(0)}
                              >
                                Back
                              </Button>
                              <Button
                                variant="contained"
                                onClick={handleExtractAndGenerate}
                                disabled={generating}
                                sx={{ backgroundColor: '#2E7D32' }}
                              >
                                {generating ? <CircularProgress size={24} color="inherit" /> : 'Generate with Gemini AI'}
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                    
                    {generationStep === 2 && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <SmartToy sx={{ fontSize: 64, color: '#2E7D32', mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Gemini AI is processing your content...
                        </Typography>
                        <LinearProgress sx={{ mb: 2, maxWidth: 400, mx: 'auto' }} />
                        
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Analyzing content and generating intelligent flashcards
                        </Typography>
                      </Box>
                    )}

                    {generationStep === 3 && generatedCards.length > 0 && (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h6">
                            ✅ Generated {generatedCards.length} AI Flashcards
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setSaveDialogOpen(true);
                                setSetName(`${selectedNote.title} - AI Flashcards`);
                              }}
                            >
                              Save Set
                            </Button>
                            <Button
                              variant="contained"
                              onClick={() => setGenerationStep(1)}
                              sx={{ backgroundColor: '#2E7D32' }}
                            >
                              Generate New
                            </Button>
                          </Box>
                        </Box>

                        <Grid container spacing={2}>
                          {generatedCards.map((card, index) => (
                            <Grid item xs={12} md={6} key={index}>
                              <Card sx={{ 
                                height: 280, 
                                display: 'flex', 
                                flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-2px)' }
                              }}>
                                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Chip 
                                      label="Gemini AI" 
                                      size="small"
                                      sx={{ backgroundColor: '#4285F4', color: 'white' }}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Chip 
                                        label={card.difficulty} 
                                        size="small"
                                        color="default"
                                      />
                                      <IconButton 
                                        size="small" 
                                        onClick={() => {
                                          setEditingCard({...card, index});
                                          setEditDialogOpen(true);
                                        }}
                                      >
                                        <Edit fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                  
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1B5E20' }}>
                                    Question:
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    mb: 2, 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    minHeight: '60px'
                                  }}>
                                    {card.front}
                                  </Typography>
                                  
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1B5E20' }}>
                                    Answer:
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 4,
                                    WebkitBoxOrient: 'vertical',
                                    minHeight: '80px'
                                  }}>
                                    {card.back}
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>
      )}
    </>
  );

  const FlashcardSetsTab = () => (
  <>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
      <Typography variant="h4" sx={{ color: '#1B5E20', fontWeight: 'bold' }}>
        My Flashcard Sets ({flashcardSets.length})
      </Typography>
      <Button
        variant="contained"
        onClick={() => setCurrentTab(0)}
        sx={{ 
          backgroundColor: '#2E7D32',
          px: 3,
          py: 1,
          borderRadius: 2
        }}
      >
        Create New Set
      </Button>
    </Box>

    {flashcardSets.length === 0 ? (
      <Card sx={{ 
        p: 6, 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f8fffe 0%, #f1f8e9 100%)',
        border: '2px dashed #2E7D32',
        borderRadius: 3
      }}>
        <Quiz sx={{ fontSize: 80, color: '#2E7D32', mb: 3, opacity: 0.7 }} />
        <Typography variant="h5" sx={{ color: '#1B5E20', mb: 2, fontWeight: 'bold' }}>
          No flashcard sets yet
        </Typography>
        <Typography variant="body1" sx={{ color: '#4A5C3A', mb: 3 }}>
          Create your first AI-generated flashcard set from your notes
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => setCurrentTab(0)}
          sx={{ 
            backgroundColor: '#2E7D32',
            px: 4,
            py: 1.5,
            borderRadius: 2
          }}
        >
          Generate Your First Set
        </Button>
      </Card>
    ) : (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
          lg: 'repeat(5, 1fr)',
          xl: 'repeat(6, 1fr)'
        },
        gap: 2,
        alignItems: 'start'
      }}>
        {flashcardSets.map((set) => (
          <Card key={set.id} sx={{ 
            height: 250, // Reduced height
            width: '100%', // Fixed width
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            borderRadius: 3,
            overflow: 'hidden',
            '&:hover': { 
              transform: 'translateY(-8px)',
              boxShadow: '0 12px 32px rgba(46, 125, 50, 0.15)'
            }
          }}>
              {/* Header Section - Reduced Height */}
              <Box sx={{ 
                height: 70, // Reduced from 100px
                background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                borderBottom: '1px solid rgba(46, 125, 50, 0.1)'
              }}>
                <Quiz sx={{ fontSize: 36, color: '#2E7D32', opacity: 0.4 }} /> {/* Smaller icon */}
                
                {/* Cards count badge */}
                <Box sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  px: 1,
                  py: 0.3,
                  borderRadius: 1.5,
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  {set.totalCards} cards
                </Box>
              </Box>

              {/* Content Section - More Compact */}
              <CardContent sx={{ 
                flexGrow: 1,
                p: 2, // Reduced padding
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Box>
                  {/* Title - Smaller */}
                  <Typography variant="subtitle1" sx={{ // Changed from h6
                    fontWeight: 'bold',
                    color: '#1B5E20',
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.2,
                    minHeight: '2.4em',
                    fontSize: '0.95rem'
                  }}>
                    {set.name}
                  </Typography>

                  {/* Tags - Smaller */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5, 
                    mb: 1, 
                    flexWrap: 'wrap',
                    minHeight: '20px'
                  }}>
                    <Chip 
                      label={set.subject || 'General'} 
                      size="small" 
                      sx={{ 
                        backgroundColor: '#E8F5E8', 
                        color: '#1B5E20', 
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        height: '18px'
                      }} 
                    />
                    <Chip 
                      label={set.difficulty || 'medium'} 
                      size="small" 
                      sx={{ 
                        backgroundColor: '#E3F2FD', 
                        color: '#1976d2', 
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        height: '18px'
                      }} 
                    />
                  </Box>

                  {/* Description - Shorter */}
                  <Typography variant="body2" sx={{ 
                    color: '#4A5C3A',
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 1, // Reduced to 1 line
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.3,
                    minHeight: '1.3em',
                    fontSize: '0.8rem'
                  }}>
                    {set.description || 'AI-generated flashcards for effective studying'}
                  </Typography>
                </Box>

                {/* Meta info - Compact */}
                <Box sx={{ mt: 'auto' }}>
                  <Typography variant="caption" sx={{ 
                    color: '#666',
                    display: 'block',
                    mb: 0.5,
                    fontSize: '0.7rem'
                  }}>
                    {set.createdAt?.toLocaleDateString() || 'Recent'}
                    {set.studyCount > 0 && (
                      <Box component="span" sx={{ ml: 1, color: '#2E7D32', fontWeight: 'bold' }}>
                        • {set.studyCount}x studied
                      </Box>
                    )}
                  </Typography>
                </Box>
              </CardContent>

              {/* Actions Section - Compact */}
              <Box sx={{ 
                p: 2, 
                pt: 0
              }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={9}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="medium"
                      startIcon={<PlayArrow />}
                      onClick={() => startStudyMode(set)}
                      sx={{ 
                        backgroundColor: '#2E7D32',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        py: 1,
                        borderRadius: 2,
                        '&:hover': { 
                          backgroundColor: '#1B5E20',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      Study Now
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <IconButton
                      onClick={() => deleteFlashcardSet(set.id)}
                      sx={{ 
                        color: '#f44336',
                        width: '100%',
                        height: '100%',
                        borderRadius: 2,
                        border: '1px solid rgba(244, 67, 54, 0.2)',
                        '&:hover': { 
                          backgroundColor: 'rgba(244, 67, 54, 0.08)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            </Card>
        ))}
      </Box>
    )}
  </>
);

  const StudyModeInterface = () => {
    if (!studySet || studySet.cards.length === 0) return null;
    const currentCard = studySet.cards[currentCardIndex];
    const progress = ((currentCardIndex + (showAnswer ? 0.5 : 0)) / studySet.cards.length) * 100;
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Card sx={{ p: 3, mb: 3, background: 'rgba(46, 125, 50, 0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1B5E20' }}>
              {studySet.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <Timer sx={{ fontSize: 16, mr: 0.5 }} />
                {formatTime(studyTimer)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setStudyMode(false)}
                startIcon={<Close />}
              >
                Exit
              </Button>
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: '#E8F5E8',
              '& .MuiLinearProgress-bar': { backgroundColor: '#2E7D32' }
            }} 
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption">
              Card {currentCardIndex + 1} of {studySet.cards.length}
            </Typography>
            <Typography variant="caption">
              Score: {studyProgress.correct}/{studyProgress.correct + studyProgress.incorrect}
            </Typography>
          </Box>
        </Card>

        <Card sx={{ 
          minHeight: 400, 
          mb: 3,
          cursor: 'pointer'
        }} onClick={() => setShowAnswer(!showAnswer)}>
          {!showAnswer ? (
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: 400,
              background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1B5E20', opacity: 0.7 }}>
                Question
              </Typography>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1B5E20' }}>
                {currentCard.front}
              </Typography>
              <Chip 
                label={`Difficulty: ${currentCard.difficulty}`} 
                sx={{ backgroundColor: '#2E7D32', color: 'white', alignSelf: 'center', mb: 2 }}
              />
              <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                Click to reveal answer
              </Typography>
            </CardContent>
          ) : (
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: 400,
              background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976D2', opacity: 0.7 }}>
                Answer
              </Typography>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1976D2' }}>
                {currentCard.back}
              </Typography>
              <Chip 
                label="AI Generated" 
                sx={{ backgroundColor: '#1976D2', color: 'white', alignSelf: 'center' }}
              />
            </CardContent>
          )}
        </Card>

        {showAnswer && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ textAlign: 'center', mb: 3, color: '#1B5E20' }}>
              How well did you know this?
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => handleStudyAnswer(false)}
                startIcon={<ThumbDown />}
                sx={{ 
                  color: '#f44336', 
                  borderColor: '#f44336',
                  minWidth: 140,
                  '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.04)' }
                }}
              >
                Didn't Know
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => handleStudyAnswer(true)}
                startIcon={<ThumbUp />}
                sx={{ 
                  backgroundColor: '#2E7D32',
                  minWidth: 140,
                  '&:hover': { backgroundColor: '#1B5E20' }
                }}
              >
                Got It!
              </Button>
            </Box>
          </Card>
        )}
      </Box>
    );
  };

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
            AI Flashcard Generator
          </Typography>
          <Psychology sx={{ color: '#2E7D32', mr: 1 }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {studyMode ? (
          <StudyModeInterface />
        ) : (
          <>
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
                <Tab label="My Notes" icon={<Description />} />
                <Tab label="Generate Cards" icon={<AutoAwesome />} />
                <Tab label="My Flashcard Sets" icon={<Quiz />} />
              </Tabs>
            </Paper>

            <TabPanel value={currentTab} index={0}>
              <MyNotesTab />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <GenerateCardsTab />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <FlashcardSetsTab />
            </TabPanel>
          </>
        )}
      </Container>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={saveFlashcardSet}>
          <DialogTitle>Save Flashcard Set</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Set Name"
              fullWidth
              variant="outlined"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              margin="dense"
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={setDescription}
              onChange={(e) => setSetDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={!setName.trim()}
              sx={{ backgroundColor: '#2E7D32' }}
            >
              Save Set
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Flashcard</DialogTitle>
        <DialogContent>
          {editingCard && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Question (Front)"
                  multiline
                  rows={3}
                  value={editingCard.front}
                  onChange={(e) => setEditingCard({
                    ...editingCard,
                    front: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Answer (Back)"
                  multiline
                  rows={4}
                  value={editingCard.back}
                  onChange={(e) => setEditingCard({
                    ...editingCard,
                    back: e.target.value
                  })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (editingCard && editingCard.index !== undefined) {
                const newCards = [...generatedCards];
                newCards[editingCard.index] = editingCard;
                setGeneratedCards(newCards);
              }
              setEditDialogOpen(false);
            }}
            variant="contained"
            sx={{ backgroundColor: '#2E7D32' }}
          >
            Save Changes
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

export default FlashcardGenerator;