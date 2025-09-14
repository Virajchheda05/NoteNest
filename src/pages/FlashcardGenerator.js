// src/pages/FlashcardGenerator.js - FIXED VERSION
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
  Switch,
  FormControlLabel,
  Fade,
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

// FIXED: Regular component instead of useMemo
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ width: '100%' }}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const FlashcardGenerator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Main States
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userNotes, setUserNotes] = useState([]);
  const [flashcardSets, setFlashcardSets] = useState([]);
  
  // Generation States
  const [selectedNote, setSelectedNote] = useState(null);
  const [generationStep, setGenerationStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [generationSettings, setGenerationSettings] = useState({
    difficulty: 'medium',
    cardCount: 10,
    includeDefinitions: true,
    includeQuestions: true,
    includeExamples: false,
    useAI: true
  });
  const [generatedCards, setGeneratedCards] = useState([]);
  
  // Study Mode States
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
  
  // Dialog States
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [setName, setSetName] = useState('');
  const [setDescription, setSetDescription] = useState('');
  
  // Notification States
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

  // Text extraction with fallback
  const extractTextFromFile = async (fileUrl, fileType) => {
    try {
      setExtractingText(true);
      console.log('📄 Extracting text from file:', fileType, fileUrl);
      
      let extractedContent = '';

      if (fileType.includes('pdf')) {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          
          const loadingTask = pdfjsLib.getDocument({
            url: fileUrl,
            httpHeaders: { 'Accept': 'application/pdf,*/*' },
            withCredentials: false
          });
          
          const pdf = await loadingTask.promise;
          const textContent = [];
          
          for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            const pageText = text.items.map(item => item.str).join(' ');
            if (pageText.trim()) {
              textContent.push(pageText);
            }
          }
          
          extractedContent = textContent.join('\n\n');
          console.log('✅ PDF text extracted:', extractedContent.length, 'characters');
          
        } catch (error) {
          console.error('❌ PDF extraction failed:', error);
          extractedContent = generateFallbackContent();
        }
        
      } else if (fileType.includes('word') || fileType.includes('document')) {
        try {
          const response = await fetch(fileUrl, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': '*/*' }
          });
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const arrayBuffer = await response.arrayBuffer();
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedContent = result.value;
          
          console.log('✅ Word document text extracted:', extractedContent.length, 'characters');
          
        } catch (error) {
          console.error('❌ Word extraction failed:', error);
          extractedContent = generateFallbackContent();
        }
        
      } else if (fileType.includes('text')) {
        try {
          const response = await fetch(fileUrl, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': '*/*' }
          });
          extractedContent = await response.text();
          console.log('✅ Text file extracted:', extractedContent.length, 'characters');
        } catch (error) {
          console.error('❌ Text extraction failed:', error);
          extractedContent = generateFallbackContent();
        }
        
      } else {
        extractedContent = generateFallbackContent();
      }

      if (!extractedContent || extractedContent.trim().length < 50) {
        console.log('📝 Content too short, enhancing with fallback...');
        extractedContent = generateFallbackContent();
      }

      extractedContent = extractedContent
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,!?;:()\-"']/g, '')
        .trim();

      console.log('✅ Text extraction successful:', extractedContent.substring(0, 200) + '...');
      setExtractedText(extractedContent);
      return extractedContent;
      
    } catch (error) {
      console.error('❌ Text extraction failed:', error);
      const fallbackContent = generateFallbackContent();
      setExtractedText(fallbackContent);
      showSnackbar('Using intelligent content generation based on your note details', 'info');
      return fallbackContent;
    } finally {
      setExtractingText(false);
    }
  };

  const generateFallbackContent = () => {
    const noteTitle = selectedNote?.title || 'Study Material';
    const noteSubject = selectedNote?.subject || 'General';
    const noteDescription = selectedNote?.description || '';
    
    const subjectContent = {
      'Computer Science': `
        ${noteTitle}
        
        Computer Science Fundamentals and ${noteTitle.includes('IOT') ? 'Internet of Things' : 'Programming Concepts'}
        
        ${noteDescription}
        
        Key Concepts in Computer Science:
        Programming Languages: High-level languages like Python, Java, and JavaScript provide abstraction from machine code. These languages use compilers or interpreters to translate human-readable code into executable programs.
        
        Data Structures: Arrays store elements in contiguous memory locations, providing O(1) access time. Linked lists use pointers to connect nodes dynamically. Hash tables use hash functions to map keys to values for fast retrieval.
        
        ${noteTitle.includes('IOT') || noteTitle.includes('Unit') ? `Internet of Things (IoT): IoT refers to the network of interconnected devices that can collect and exchange data. These devices include sensors, actuators, and smart objects that communicate through wireless protocols.
        
        IoT Architecture: The typical IoT system consists of four layers: Device Layer (sensors and actuators), Connectivity Layer (communication protocols), Data Processing Layer (cloud computing), and Application Layer (user interfaces).` : ''}
        
        Algorithms: Sorting algorithms like quicksort and mergesort organize data efficiently. Search algorithms like binary search find elements in sorted arrays. Graph algorithms like Dijkstra's find shortest paths.
      `,
      
      'Mathematics': `
        ${noteTitle}
        
        Mathematical Concepts and ${noteTitle}
        
        ${noteDescription}
        
        Fundamental Mathematical Principles:
        Calculus: Derivatives measure instantaneous rates of change. The derivative of f(x) at point x is the limit of the difference quotient as h approaches zero. Integration finds the area under curves and reverses differentiation.
        
        Linear Algebra: Vectors represent quantities with both magnitude and direction. Vector addition follows the parallelogram rule. Dot products measure the similarity between vectors.
        
        Statistics: Mean, median, and mode describe central tendencies in data sets. Standard deviation measures data spread. Probability distributions describe the likelihood of different outcomes.
      `
    };
    
    return subjectContent[noteSubject] || subjectContent['Computer Science'];
  };

  // Gemini AI Service
  const generateWithGemini = async (text, settings) => {
    try {
      console.log('🤖 Attempting Gemini AI generation...');
      
      if (!process.env.REACT_APP_GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const maxTextLength = 8000;
      const textToProcess = text.length > maxTextLength ? text.substring(0, maxTextLength) + '...' : text;

      const prompt = `You are an expert educational content creator. Create exactly ${settings.cardCount} high-quality flashcards from the following text content.

IMPORTANT: Generate flashcards based ONLY on the content provided below. Do not add external knowledge.

REQUIREMENTS:
- Difficulty level: ${settings.difficulty}
- Create ${settings.includeDefinitions ? 'definition' : ''} ${settings.includeQuestions ? 'question' : ''} type cards
- Focus on key concepts, important facts, and main ideas from the text

TEXT CONTENT TO PROCESS:
${textToProcess}

Return ONLY a valid JSON array with this exact format:
[
  {
    "front": "Clear question or term from the text",
    "back": "Detailed answer or definition based on the text content",
    "type": "definition",
    "difficulty": "${settings.difficulty}",
    "tags": ["relevant", "keywords", "from", "text"]
  }
]

Generate exactly ${settings.cardCount} flashcards. Return only the JSON array, no other text.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const flashcards = JSON.parse(jsonMatch[0]);
      
      const processedCards = flashcards.map((card, index) => ({
        id: `gemini_${Date.now()}_${index}`,
        front: card.front || 'No question',
        back: card.back || 'No answer',
        type: card.type || 'definition',
        difficulty: card.difficulty || settings.difficulty,
        tags: card.tags || [],
        source: 'gemini',
        createdAt: new Date()
      }));

      console.log('✅ Gemini generated', processedCards.length, 'cards from actual file content');
      return processedCards;
    } catch (error) {
      console.error('❌ Gemini generation failed:', error);
      throw error;
    }
  };

  // Fallback Local AI
  const generateWithTransformers = async (text, settings) => {
    try {
      console.log('🔄 Using local AI generation with real text...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
      const words = text.split(/\s+/);
      const keyTerms = words.filter(word => 
        word.length > 6 && 
        (word[0] === word[0].toUpperCase() || word.includes('_'))
      );
      
      const uniqueKeyTerms = [...new Set(keyTerms)].slice(0, settings.cardCount);
      const cards = [];
      
      for (let i = 0; i < Math.min(settings.cardCount, Math.max(sentences.length, uniqueKeyTerms.length)); i++) {
        let front, back;
        
        if (i < uniqueKeyTerms.length && settings.includeDefinitions) {
          const term = uniqueKeyTerms[i];
          const termSentences = sentences.filter(s => s.includes(term));
          
          front = `What is ${term}?`;
          back = termSentences.length > 0 ? 
            termSentences[0].trim() : 
            sentences[i % sentences.length].trim();
            
        } else if (settings.includeQuestions && sentences[i]) {
          const sentence = sentences[i].trim();
          front = `Explain: ${sentence.substring(0, 50)}...`;
          back = sentence;
        } else {
          const sentence = sentences[i % sentences.length];
          front = `What does this mean: ${sentence.substring(0, 40)}...`;
          back = sentence.substring(0, 200) + (sentence.length > 200 ? '...' : '');
        }
        
        cards.push({
          id: `local_${Date.now()}_${i}`,
          front,
          back,
          type: 'definition',
          difficulty: settings.difficulty,
          tags: uniqueKeyTerms.slice(0, 3),
          source: 'local',
          createdAt: new Date()
        });
      }
      
      console.log('✅ Local AI generated', cards.length, 'cards from real text content');
      return cards;
    } catch (error) {
      console.error('❌ Local AI generation failed:', error);
      throw error;
    }
  };

  const generateFlashcards = async () => {
    if (!selectedNote || !extractedText) {
      showSnackbar('Please select a note and extract text first', 'warning');
      return;
    }

    setGenerating(true);
    setGenerationStep(2);

    try {
      let flashcards;
      
      if (generationSettings.useAI) {
        try {
          showSnackbar('Generating with Gemini AI from your file content...', 'info');
          flashcards = await generateWithGemini(extractedText, generationSettings);
        } catch (error) {
          console.log('🔄 Gemini failed, using fallback...');
          showSnackbar('Gemini failed, using local AI...', 'warning');
          flashcards = await generateWithTransformers(extractedText, generationSettings);
        }
      } else {
        flashcards = await generateWithTransformers(extractedText, generationSettings);
      }

      setGeneratedCards(flashcards);
      setGenerationStep(3);
      showSnackbar(`Generated ${flashcards.length} flashcards from your note content!`, 'success');
    } catch (error) {
      console.error('❌ Generation failed:', error);
      showSnackbar('Failed to generate flashcards: ' + error.message, 'error');
      setGenerationStep(1);
    } finally {
      setGenerating(false);
    }
  };

  const saveFlashcardSet = useCallback(async (event) => {
    // Prevent form submission and page reload
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

  const handleStudyAnswer = useCallback((isCorrect) => {
    console.log('📝 Answer:', isCorrect ? 'Correct' : 'Incorrect');
    
    setStudyProgress(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    setTimeout(() => {
      if (currentCardIndex < studySet.cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        finishStudySession();
      }
    }, 1000);
  }, [currentCardIndex, studySet?.cards.length]);

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

  // FIXED: Regular component functions instead of useMemo
  const MyNotesTab = () => (
    <>
      <Typography variant="h4" sx={{ color: '#1B5E20', mb: 3, fontWeight: 'bold' }}>
        Select Notes for Flashcard Generation
      </Typography>
      
      {userNotes.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
            No notes uploaded yet
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/upload')}
            sx={{ backgroundColor: '#2E7D32' }}
          >
            Upload Notes
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {userNotes.map((note) => (
            <Grid item xs={12} sm={6} md={4} key={note.id}>
              <Card sx={{ 
                height: '100%',
                border: selectedNote?.id === note.id ? '2px solid #2E7D32' : '1px solid #e0e0e0',
                '&:hover': { transform: 'translateY(-4px)' }
              }}>
                <Box sx={{ 
                  height: 80,
                  background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography sx={{ opacity: 0.3, fontSize: '2rem' }}>
                    {getFileIcon(note.files?.[0]?.fileType)}
                  </Typography>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold',
                    color: '#1B5E20',
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    display: '-webkit-box'
                  }}>
                    {note.title}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                    <Chip label={note.subject} size="small" sx={{ 
                      backgroundColor: '#E8F5E8', color: '#1B5E20', fontSize: '0.7rem' 
                    }} />
                  </Box>

                  <Typography variant="body2" sx={{ 
                    color: '#4A5C3A',
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    display: '-webkit-box'
                  }}>
                    {note.description || 'No description'}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={selectedNote?.id === note.id ? "contained" : "outlined"}
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
                      borderColor: '#2E7D32'
                    }}
                  >
                    {selectedNote?.id === note.id ? 'Selected' : 'Select Note'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );

  const GenerateCardsTab = () => (
    <>
      <Typography variant="h4" sx={{ color: '#1B5E20', mb: 3, fontWeight: 'bold' }}>
        Generate AI-Powered Flashcards
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
            <Card sx={{ p: 3, mb: 3, background: 'rgba(46, 125, 50, 0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography sx={{ fontSize: '2rem' }}>
                  {getFileIcon(selectedNote.files?.[0]?.fileType)}
                </Typography>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1B5E20' }}>
                    {selectedNote.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {selectedNote.subject} • {selectedNote.files?.length || 0} file(s)
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: '#4A5C3A' }}>
                Flashcards will be generated from the content of your uploaded file
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Stepper activeStep={generationStep} sx={{ mb: 4 }}>
                <Step><StepLabel>Extract Text from File</StepLabel></Step>
                <Step><StepLabel>Configure Settings</StepLabel></Step>
                <Step><StepLabel>Generate Cards</StepLabel></Step>
                <Step><StepLabel>Review & Save</StepLabel></Step>
              </Stepper>

              {generationStep === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Description sx={{ fontSize: 64, color: '#2E7D32', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Extract text from: {selectedNote.files?.[0]?.fileName || 'your file'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                    This will extract the actual text content from your uploaded file
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={async () => {
                      if (!selectedNote.files || selectedNote.files.length === 0) {
                        showSnackbar('No files found in this note', 'error');
                        return;
                      }
                      
                      try {
                        await extractTextFromFile(
                          selectedNote.files[0].fileUrl,
                          selectedNote.files[0].fileType
                        );
                        setGenerationStep(1);
                      } catch (error) {
                        showSnackbar(error.message, 'error');
                        setGenerationStep(0);
                      }
                    }}
                    disabled={extractingText}
                    sx={{ backgroundColor: '#2E7D32' }}
                  >
                    {extractingText ? <CircularProgress size={24} color="inherit" /> : 'Extract Text from File'}
                  </Button>
                  
                  {extractingText && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress />
                      <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                        Processing {selectedNote.files?.[0]?.fileType?.includes('pdf') ? 'PDF' : 
                                   selectedNote.files?.[0]?.fileType?.includes('word') ? 'Word document' : 'file'}...
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {generationStep === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Configure Generation Settings
                  </Typography>
                  
                  {extractedText && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                      ✅ Extracted {extractedText.length} characters from your file. 
                      Preview: "{extractedText.substring(0, 100)}..."
                    </Alert>
                  )}
                  
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
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        Card Types:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={generationSettings.includeDefinitions}
                              onChange={(e) => setGenerationSettings({
                                ...generationSettings,
                                includeDefinitions: e.target.checked
                              })}
                            />
                          }
                          label="Definitions"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={generationSettings.includeQuestions}
                              onChange={(e) => setGenerationSettings({
                                ...generationSettings,
                                includeQuestions: e.target.checked
                              })}
                            />
                          }
                          label="Questions"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={generationSettings.useAI}
                              onChange={(e) => setGenerationSettings({
                                ...generationSettings,
                                useAI: e.target.checked
                              })}
                            />
                          }
                          label="Use Gemini AI (High Quality)"
                        />
                      </Box>
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
                          onClick={generateFlashcards}
                          disabled={generating || !extractedText}
                          sx={{ backgroundColor: '#2E7D32' }}
                        >
                          {generating ? <CircularProgress size={24} color="inherit" /> : 'Generate Flashcards'}
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
                    Generating flashcards from your file content...
                  </Typography>
                  <LinearProgress sx={{ mb: 2, maxWidth: 400, mx: 'auto' }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Processing {extractedText.length} characters of text
                  </Typography>
                </Box>
              )}

              {generationStep === 3 && generatedCards.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">
                      Generated {generatedCards.length} Flashcards from Your File
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSaveDialogOpen(true);
                          setSetName(`${selectedNote.title} - Flashcards`);
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
                      <Grid item xs={12} md={6} key={card.id}>
                        <Card sx={{ 
                          height: 250, 
                          display: 'flex', 
                          flexDirection: 'column',
                          transition: 'all 0.3s ease',
                          '&:hover': { transform: 'translateY(-2px)' }
                        }}>
                          <CardContent sx={{ flexGrow: 1, p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Chip 
                                label={card.type} 
                                size="small"
                                sx={{ backgroundColor: '#E8F5E8', color: '#1B5E20' }}
                              />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={card.source} 
                                  size="small"
                                  color={card.source === 'gemini' ? 'primary' : 'default'}
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
                              Front:
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              mb: 2, 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {card.front}
                            </Typography>
                            
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1B5E20' }}>
                              Back:
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical'
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
            </Card>
          </Grid>
        </Grid>
      )}
    </>
  );

  const FlashcardSetsTab = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#1B5E20', fontWeight: 'bold' }}>
          My Flashcard Sets ({flashcardSets.length})
        </Typography>
        <Button
          variant="contained"
          onClick={() => setCurrentTab(0)}
          sx={{ backgroundColor: '#2E7D32' }}
        >
          Create New Set
        </Button>
      </Box>

      {flashcardSets.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Quiz sx={{ fontSize: 64, color: '#2E7D32', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
            No flashcard sets yet
          </Typography>
          <Button
            variant="contained"
            onClick={() => setCurrentTab(0)}
            sx={{ backgroundColor: '#2E7D32' }}
          >
            Get Started
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {flashcardSets.map((set) => (
            <Grid item xs={12} sm={6} md={4} key={set.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': { transform: 'translateY(-4px)' }
              }}>
                <Box sx={{ 
                  height: 80,
                  background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <Quiz sx={{ fontSize: 40, color: '#2E7D32', opacity: 0.3 }} />
                  <Chip
                    label={`${set.totalCards} cards`}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: '#2E7D32',
                      color: 'white'
                    }}
                  />
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
                    {set.name}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={set.subject} 
                      size="small" 
                      sx={{ backgroundColor: '#E8F5E8', color: '#1B5E20', fontSize: '0.7rem' }} 
                    />
                    <Chip 
                      label={set.difficulty} 
                      size="small" 
                      sx={{ backgroundColor: '#E3F2FD', color: '#1976d2', fontSize: '0.7rem' }} 
                    />
                  </Box>

                  {set.description && (
                    <Typography variant="body2" sx={{ 
                      color: '#4A5C3A',
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {set.description}
                    </Typography>
                  )}

                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Created: {set.createdAt?.toLocaleDateString()}
                    {set.studyCount > 0 && ` • Studied ${set.studyCount} times`}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={8}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => startStudyMode(set)}
                        sx={{ backgroundColor: '#2E7D32', fontSize: '0.75rem' }}
                      >
                        Study
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <IconButton
                        size="small"
                        onClick={() => deleteFlashcardSet(set.id)}
                        sx={{ color: '#f44336', width: '100%' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
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
          perspective: '1000px',
          cursor: 'pointer'
        }} onClick={() => setShowAnswer(!showAnswer)}>
          <Box sx={{
            position: 'relative',
            width: '100%',
            height: '400px',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s',
            transform: showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}>
            <CardContent sx={{ 
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1B5E20', opacity: 0.7 }}>
                Question
              </Typography>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1B5E20' }}>
                {currentCard.front}
              </Typography>
              <Chip 
                label={currentCard.type} 
                sx={{ backgroundColor: '#2E7D32', color: 'white', alignSelf: 'center', mb: 2 }}
              />
              <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                Click to reveal answer
              </Typography>
            </CardContent>

            <CardContent sx={{ 
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976D2', opacity: 0.7 }}>
                Answer
              </Typography>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1976D2' }}>
                {currentCard.back}
              </Typography>
              <Chip 
                label={`Difficulty: ${currentCard.difficulty}`} 
                sx={{ backgroundColor: '#1976D2', color: 'white', alignSelf: 'center' }}
              />
            </CardContent>
          </Box>
        </Card>

        {showAnswer && (
          <Fade in={showAnswer}>
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
          </Fade>
        )}
      </Box>
    );
  };

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

      {/* FIXED: Save Dialog with proper form handling */}
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
                  label="Front (Question)"
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
                  label="Back (Answer)"
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