// src/pages/NotesSearch.js - Enhanced with Rating, Comments & Flag System
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  Rating,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Skeleton,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ButtonGroup,
  Paper,
  Stack
} from '@mui/material';
import {
  Search,
  Download,
  Visibility,
  Star,
  Share,
  Flag,
  School,
  GetApp,
  Close,
  BookmarkBorder,
  Bookmark,
  ArrowBack,
  Sort,
  Notifications,
  ThumbUp,
  ThumbDown,
  MoreVert,
  Send,
  Warning
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { SUBJECTS, ACADEMIC_LEVELS } from '../utils/constants';
import ProfileService from '../services/profileService';
// MOCK DATA for NotesSearch.js (for local testing without Firestore)
const mockNotesWithRatings = [
  {
    id: 'mock1',
    title: 'Linear Algebra Cheat Sheet',
    description: 'A comprehensive, 10-page guide covering vector spaces, linear transformations, eigenvalues and eigenvectors.',
    subject: 'Mathematics',
    academicLevel: 'Undergraduate Year 2',
    university: 'MIT',
    course: 'MATH201',
    uploaderEmail: 'sarah.mathematics@mit.edu',
    downloadCount: 245,
    averageRating: 4.8,
    totalRatings: 23,
    totalComments: 18,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-01-15'),
    tags: ['linear-algebra', 'vectors', 'transformations', 'eigenvalues'],
    files: [{
      fileName: 'linear_algebra_notes.pdf',
      fileType: 'application/pdf',
      fileSize: 2048576,
      fileUrl: '#'
    }],
    status: 'active'
  },
  {
    id: 'mock2',
    title: 'Data Structures and Algorithms - Complete Guide',
    description: 'In-depth coverage of fundamental data structures and algorithm analysis.',
    subject: 'Computer Science',
    academicLevel: 'Undergraduate Year 2',
    university: 'Stanford',
    course: 'CS106B',
    uploaderEmail: 'alex.cs@stanford.edu',
    downloadCount: 892,
    averageRating: 4.9,
    totalRatings: 67,
    totalComments: 45,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-03-20'),
    tags: ['algorithms', 'data-structures', 'cs-fundamentals', 'sorting'],
    files: [{
      fileName: 'DSA_guide.pdf',
      fileType: 'application/pdf',
      fileSize: 4500000,
      fileUrl: '#'
    }],
    status: 'active'
  },
  {
    id: 'mock3',
    title: 'Organic Chemistry Reactions',
    description: 'A summary of all key reactions in sophomore-level organic chemistry, with mechanisms and examples.',
    subject: 'Chemistry',
    academicLevel: 'Undergraduate Year 2',
    university: 'Berkeley',
    course: 'CHEM112A',
    uploaderEmail: 'jessie.chem@berkeley.edu',
    downloadCount: 154,
    averageRating: 4.1,
    totalRatings: 15,
    totalComments: 5,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-04-10'),
    tags: ['organic-chemistry', 'reactions', 'mechanisms', 'ochem'],
    files: [{
      fileName: 'organic_chem_reactions.pdf',
      fileType: 'application/pdf',
      fileSize: 1500000,
      fileUrl: '#'
    }],
    status: 'active'
  },
  {
    id: 'mock4',
    title: 'Introduction to Macroeconomics',
    description: 'Lecture notes covering GDP, inflation, unemployment, and monetary policy.',
    subject: 'Economics',
    academicLevel: 'Undergraduate Year 1',
    university: 'Harvard',
    course: 'ECON1010',
    uploaderEmail: 'mike.econ@harvard.edu',
    downloadCount: 301,
    averageRating: 4.5,
    totalRatings: 32,
    totalComments: 12,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-03-22'),
    tags: ['macroeconomics', 'gdp', 'monetary-policy', 'inflation'],
    files: [{
      fileName: 'macro_notes_lecture1.pdf',
      fileType: 'application/pdf',
      fileSize: 1200000,
      fileUrl: '#'
    }],
    status: 'active'
  },
  {
    id: 'mock5',
    title: 'Differential Equations Study Guide',
    description: 'Key concepts and solved problems for ODEs and PDEs.',
    subject: 'Mathematics',
    academicLevel: 'Undergraduate Year 3',
    university: 'Caltech',
    course: 'MA105',
    uploaderEmail: 'chris.math@caltech.edu',
    downloadCount: 88,
    averageRating: 4.3,
    totalRatings: 9,
    totalComments: 3,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-02-28'),
    tags: ['differential-equations', 'odes', 'pdes', 'calculus'],
    files: [{
      fileName: 'diff_eq_guide.pdf',
      fileType: 'application/pdf',
      fileSize: 950000,
      fileUrl: '#'
    }],
    status: 'active'
  },
  {
    id: 'mock6',
    title: 'Principles of Physics I - Kinematics',
    description: 'Summary of kinematics formulas, concepts, and practice problems.',
    subject: 'Physics',
    academicLevel: 'Undergraduate Year 1',
    university: 'Purdue',
    course: 'PHYS220',
    uploaderEmail: 'tina.physics@purdue.edu',
    downloadCount: 412,
    averageRating: 4.7,
    totalRatings: 55,
    totalComments: 20,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-01-05'),
    tags: ['kinematics', 'physics', 'mechanics'],
    files: [{
      fileName: 'kinematics_notes.docx',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 85000,
      fileUrl: '#'
    }],
    status: 'active'
  },
  {
    id: 'mock7',
    title: 'Introduction to Python for Data Science',
    description: 'A beginner-friendly guide to Python libraries like Pandas, NumPy, and Matplotlib.',
    subject: 'Computer Science',
    academicLevel: 'Undergraduate Year 1',
    university: 'UW',
    course: 'CSE163',
    uploaderEmail: 'lisa.datasci@uw.edu',
    downloadCount: 650,
    averageRating: 4.6,
    totalRatings: 41,
    totalComments: 25,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-04-01'),
    tags: ['python', 'data-science', 'pandas', 'numpy'],
    files: [{
      fileName: 'python_datascience_notes.pptx',
      fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      fileSize: 3200000,
      fileUrl: '#'
    }],
    status: 'active'
  },
  {
    id: 'mock8',
    title: 'World History Since 1500 - Study Notes',
    description: 'Detailed summary of major historical events from the Renaissance to the modern era.',
    subject: 'History',
    academicLevel: 'Undergraduate Year 1',
    university: 'NYU',
    course: 'HIST101',
    uploaderEmail: 'david.hist@nyu.edu',
    downloadCount: 110,
    averageRating: 4.0,
    totalRatings: 10,
    totalComments: 4,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-03-05'),
    tags: ['history', 'world-history', 'modern-history'],
    files: [{
      fileName: 'world_history_notes.pdf',
      fileType: 'application/pdf',
      fileSize: 1800000,
      fileUrl: '#'
    }],
    status: 'active'
  },
  {
    id: 'mock9',
    title: 'Cellular and Molecular Biology - Key Concepts',
    description: 'A review of cell structure, DNA replication, and protein synthesis.',
    subject: 'Biology',
    academicLevel: 'Undergraduate Year 2',
    university: 'UCLA',
    course: 'BIOL100',
    uploaderEmail: 'susan.bio@ucla.edu',
    downloadCount: 340,
    averageRating: 4.7,
    totalRatings: 28,
    totalComments: 11,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-02-12'),
    tags: ['biology', 'molecular-biology', 'genetics'],
    files: [{
      fileName: 'mol_bio_notes.pdf',
      fileType: 'application/pdf',
      fileSize: 2500000,
      fileUrl: '#'
    }],
    status: 'active'
  },
  {
    id: 'mock10',
    title: 'Financial Accounting Principles',
    description: 'Notes on financial statements, balance sheets, and income statements.',
    subject: 'Accounting',
    academicLevel: 'Undergraduate Year 1',
    university: 'Wharton',
    course: 'ACCT101',
    uploaderEmail: 'luke.finance@wharton.upenn.edu',
    downloadCount: 520,
    averageRating: 4.4,
    totalRatings: 38,
    totalComments: 15,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-04-25'),
    tags: ['accounting', 'finance', 'statements', 'balance-sheet'],
    files: [{
      fileName: 'financial_accounting_notes.pdf',
      fileType: 'application/pdf',
      fileSize: 1900000,
      fileUrl: '#'
    }],
    status: 'active'
  },
  {
    id: 'mock11',
    title: 'Statistics for Data Science',
    description: 'A practical guide to statistical concepts and their application in data analysis.',
    subject: 'Statistics',
    academicLevel: 'Undergraduate Year 3',
    university: 'CMU',
    course: 'STAT301',
    uploaderEmail: 'john.stat@cmu.edu',
    downloadCount: 190,
    averageRating: 4.6,
    totalRatings: 18,
    totalComments: 7,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-02-01'),
    tags: ['statistics', 'data-science', 'probability'],
    files: [{
      fileName: 'statistics_notes.pdf',
      fileType: 'application/pdf',
      fileSize: 1400000,
      fileUrl: '#'
    }],
    status: 'active'
  },
  {
    id: 'mock12',
    title: 'Introduction to Computer Networks',
    description: 'Lecture slides and notes on network protocols, TCP/IP, and routing.',
    subject: 'Computer Science',
    academicLevel: 'Undergraduate Year 3',
    university: 'GaTech',
    course: 'CS4200',
    uploaderEmail: 'mike.networks@gatetech.edu',
    downloadCount: 295,
    averageRating: 4.7,
    totalRatings: 25,
    totalComments: 10,
    flagCount: 0,
    isHidden: false,
    createdAt: new Date('2024-01-20'),
    tags: ['computer-networks', 'tcp/ip', 'protocols'],
    files: [{
      fileName: 'network_notes.pdf',
      fileType: 'application/pdf',
      fileSize: 2100000,
      fileUrl: '#'
    }],
    status: 'active'
  }
];
const NotesSearch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage] = useState(10); // FIX: Changed from 8 to 10
  const [previewNote, setPreviewNote] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [bookmarkedNotes, setBookmarkedNotes] = useState(new Set());
  const [fetchError, setFetchError] = useState(null);
  
  // Rating & Comments States
  const [reviews, setReviews] = useState({});
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userReviews, setUserReviews] = useState({}); // Track user's existing reviews
  
  // Flag System States
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagNote, setFlagNote] = useState(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagDescription, setFlagDescription] = useState('');
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);
  // Notification States
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  // Fetch notes and reviews
  useEffect(() => {
    fetchNotesAndReviews();
  }, []);
  // Filter and search notes
  useEffect(() => {
    filterAndSearchNotes();
  }, [notes, searchQuery, selectedSubject, selectedLevel, sortBy]);
  // FIXED fetchNotesAndReviews function for NotesSearch.js
// Replace the existing fetchNotesAndReviews function with this:

const fetchNotesAndReviews = async () => {
  try {
    setLoading(true);
    setFetchError(null);
    
    console.log('🔍 Fetching notes from Firestore...');
    
    // FIXED: Get only existing notes (hard delete means they won't exist at all)
    const notesRef = collection(db, 'notes');
    let notesQuery = query(notesRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(notesQuery);
    console.log('📊 Query snapshot size:', querySnapshot.size);
    if (querySnapshot.empty) {
      console.log('❌ No notes found in Firestore');
      console.log('🔄 Using mock data for demonstration');
      setNotes(mockNotesWithRatings);
      setFilteredNotes(mockNotesWithRatings);
      setFetchError('No notes found in database. Upload some notes first!');
      return;
    }
    
    // Process the notes data - no need to filter isHidden since hard delete removes them entirely
    const notesData = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('📝 Processing note:', data.title || 'Untitled');
      
      return {
        id: doc.id,
        ...data,
        // Ensure all required fields exist with defaults
  
        downloadCount: data.downloadCount || 0,
        averageRating: data.averageRating || 0,
        totalRatings: data.totalRatings || 0,
        totalComments: data.totalComments || 0,
        flagCount: data.flagCount || 0,
        isHidden: data.isHidden || false,
        status: data.status || 'active'
      };
    });
    // Filter out only hidden notes (flagged content), deleted notes won't exist
    const visibleNotes = notesData.filter(note => !note.isHidden);
    console.log('✅ Successfully loaded notes:', visibleNotes.length);
    console.log('🗂️ Notes data sample:', visibleNotes.slice(0, 2));
    // Fetch reviews for all notes
    console.log('🔍 Fetching reviews...');
    const reviewsRef = collection(db, 'reviews');
    const reviewsSnapshot = await getDocs(query(reviewsRef, orderBy('createdAt', 'desc')));
    
    const reviewsData = {};
    const userReviewsData = {};
    reviewsSnapshot.docs.forEach(doc => {
      const review = { id: doc.id, ...doc.data() };
      const noteId = review.noteId;
      
      // Only include reviews for notes that still exist
      if (visibleNotes.find(note => note.id === noteId)) {
        if (!reviewsData[noteId]) {
          reviewsData[noteId] = [];
        }
        reviewsData[noteId].push(review);
      
        // Track user's reviews
        if (review.userId === user?.uid) {
          userReviewsData[noteId] = review;
        }
      }
    });
    console.log('✅ Successfully loaded reviews for', Object.keys(reviewsData).length, 'notes');
    
    // Set the data
    setNotes(visibleNotes);
    setFilteredNotes(visibleNotes);
    setReviews(reviewsData);
    setUserReviews(userReviewsData);
    } catch (error) {
    console.error('❌ Error fetching data:', error);
    console.error('📋 Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    setFetchError(`Database error: ${error.message}`);
    
    // Show mock data as fallback
    console.log('🔄 Falling back to mock data');
    setNotes(mockNotesWithRatings);
    setFilteredNotes(mockNotesWithRatings);
    } finally {
    setLoading(false);
  }
};

  const filterAndSearchNotes = () => {
    let filtered = [...notes];
    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter(note => note.subject === selectedSubject);
    }

    if (selectedLevel) {
      filtered = filtered.filter(note => note.academicLevel === selectedLevel);
    }

    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });
        break;
      case 'popular':
        filtered.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'title':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        break;
    }

    setFilteredNotes(filtered);
    setCurrentPage(1);
  };
  const handleSubmitReview = async () => {
    if (!user || !previewNote || newRating === 0) {
      showSnackbar('Please provide a rating', 'warning');
      return;
    }

    // Check if user already reviewed this note
    if (userReviews[previewNote.id]) {
      showSnackbar('You have already reviewed this note', 'warning');
      return;
    }

    setIsSubmittingReview(true);

    try {
      const reviewData = {
        noteId: previewNote.id,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName ||
        user.email.split('@')[0],
        rating: newRating,
        comment: newComment.trim(),
        isHelpful: 0,
        isReported: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      };
      // Add review to Firestore
      const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);
      // Update note statistics
      const noteRef = doc(db, 'notes', previewNote.id);
      const currentReviews = reviews[previewNote.id] ||
      [];
      const newTotalRatings = currentReviews.length + 1;
      const newAverageRating = (
        (previewNote.averageRating * currentReviews.length + newRating) / newTotalRatings
      );
      await updateDoc(noteRef, {
        averageRating: newAverageRating,
        totalRatings: increment(1),
        totalComments: newComment.trim() ? increment(1) : increment(0),
        lastReviewAt: serverTimestamp()
      });
      // Update local state
      const newReview = { id: reviewRef.id, ...reviewData, createdAt: new Date() };
      setReviews(prev => ({
        ...prev,
        [previewNote.id]: [...(prev[previewNote.id] || []), newReview]
      }));
      setUserReviews(prev => ({
        ...prev,
        [previewNote.id]: newReview
      }));
      // Update notes list
      setNotes(prev => prev.map(note => 
        note.id === previewNote.id 
          ? { 
              ...note, 
              averageRating: newAverageRating, 
              totalRatings: newTotalRatings,
              totalComments: note.totalComments + (newComment.trim() 
              ? 1 : 0)
            }
          : note
      ));
      // Reset form
      setNewRating(0);
      setNewComment('');
      
      showSnackbar('Review submitted successfully!', 'success');
    } catch (error) {
      console.error('Error submitting review:', error);
      showSnackbar('Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };
  const handleFlagNote = async () => {
    if (!user || !flagNote || !flagReason) {
      showSnackbar('Please select a reason for reporting', 'warning');
      return;
    }

    setIsSubmittingFlag(true);

    try {
      const reportData = {
        noteId: flagNote.id,
        reporterId: user.uid,
        reporterEmail: user.email,
        reason: flagReason,
        description: flagDescription.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
   
        adminNotes: null
      };
      // Add report to Firestore
      await addDoc(collection(db, 'reports'), reportData);
      // Update note flag count
      const noteRef = doc(db, 'notes', flagNote.id);
      const newFlagCount = (flagNote.flagCount || 0) + 1;
      
      await updateDoc(noteRef, {
        flagCount: increment(1),
        isHidden: newFlagCount >= 7 // Hide if 7+ flags
      });
      // Update local state
      setNotes(prev => prev.map(note => 
        note.id === flagNote.id 
          ? { 
              ...note, 
              flagCount: newFlagCount,
              isHidden: newFlagCount >= 7
            }
     
          : note
      ));
      // If note is now hidden, remove from filtered list
      if (newFlagCount >= 7) {
        setFilteredNotes(prev => prev.filter(note => note.id !== flagNote.id));
      }

      // Close dialog and reset
      setFlagDialogOpen(false);
      setFlagNote(null);
      setFlagReason('');
      setFlagDescription('');
      showSnackbar('Report submitted successfully. Thank you for helping keep our community safe.', 'success');
    } catch (error) {
      console.error('Error submitting report:', error);
      showSnackbar('Failed to submit report', 'error');
    } finally {
      setIsSubmittingFlag(false);
    }
  };
  const openFlagDialog = (note) => {
    setFlagNote(note);
    setFlagDialogOpen(true);
  };
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };
  const handleDownload = async (note) => {
  try {
    if (!note.files || note.files.length === 0) {
      showSnackbar('No files available for download', 'warning');
      return;
    }

    // Track the download
    if (user) {
      await ProfileService.trackNoteDownload(user.uid, {
        id: note.id,
        title: note.title
      });
    }

    // Download first file or all files
    if (note.files.length === 1) {
      // Single file - direct download
      const file = note.files[0];
      const link = document.createElement('a');
      link.href = file.fileUrl;
      link.download = file.fileName || `${note.title}.${file.fileType?.split('/')[1] || 'file'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Multiple files - download each one
      note.files.forEach((file, index) => {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = file.fileUrl;
          link.download = file.fileName || `${note.title}_${index + 1}`;
          link.target = '_blank';
          document.body.appendChild(link);
    
          link.click();
          document.body.removeChild(link);
        }, index * 500); // Delay between downloads
      });
    }

    // Update download count in database
    const noteRef = doc(db, 'notes', note.id);
    await updateDoc(noteRef, {
      downloadCount: increment(1),
      updatedAt: serverTimestamp()
    });
    showSnackbar(`Downloaded ${note.files.length} file(s) successfully!`, 'success');

  } catch (error) {
    console.error('Download error:', error);
    showSnackbar('Download failed. Please try again.', 'error');
  }
};
  

  const handlePreview = (note) => {
    setPreviewNote(note);
    setPreviewOpen(true);
  };
  const handleBookmark = (noteId) => {
    setBookmarkedNotes(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(noteId)) {
        newBookmarks.delete(noteId);
      } else {
        newBookmarks.add(noteId);
      }
      return newBookmarks;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setSelectedLevel('');
    setSortBy('recent');
  };
  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirstNote, indexOfLastNote);
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    if (fileType.includes('text')) return '📃';
    return '📄';
  };
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown';
    }
  };
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 50%, #E3F2FD 100%)'
    }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(46, 125, 50, 0.1)'
        }}
      >
        <Toolbar>
          <IconButton 
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2, color: '#2E7D32' }}
          >
            <ArrowBack 
            />
          </IconButton>
          <School sx={{ fontSize: 32, color: '#2E7D32', mr: 1 }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              color: '#1B5E20',
              flexGrow: 1
            }}
          >
            Browse Notes
          </Typography>
          <IconButton sx={{ color: '#2E7D32' }}>
            <Notifications />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Error Alert */}
        {fetchError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Could not fetch notes from database: {fetchError}.
            Showing sample data instead.
          </Alert>
        )}

        {/* Search and Filter Section */}
        {/* FIX: Improved layout with Paper and Stack for better alignment */}
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
          <Typography 
            variant="h3" 
            sx={{ 
              color: '#1B5E20',
              fontWeight: 'bold',
              mb: 3,
              textAlign: 'center'
            }}
          >
            🔍 Discover Study Materials
          </Typography>

          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={{ xs: 2, md: 3 }} 
            alignItems="center"
          >
            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search notes by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#2E7D32' }} />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: 'white',
                  borderRadius: 3,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(46, 125, 50, 0.2)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2E7D32'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2E7D32'
                  }
                }
              }}
            />

            {/* Filters and Sort */}
            <FormControl sx={{ minWidth: 200, flexShrink: 0 }}>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject"
                onChange={(e) => setSelectedSubject(e.target.value)}
                sx={{ backgroundColor: 'white' }}
              >
                <MenuItem value="">All Subjects</MenuItem>
                {SUBJECTS.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200, flexShrink: 0 }}>
              <InputLabel>Academic Level</InputLabel>
              <Select
                value={selectedLevel}
                label="Academic Level"
                onChange={(e) => setSelectedLevel(e.target.value)}
                sx={{ backgroundColor: 'white' }}
              >
                <MenuItem value="">All Levels</MenuItem>
                {ACADEMIC_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              startIcon={<Sort />}
              onClick={(e) => setSortMenuAnchor(e.currentTarget)}
              sx={{
                backgroundColor: 'white',
                color: '#2E7D32',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(46, 125, 50, 0.04)'
                },
                minWidth: '150px'
              }}
            >
              Sort: {sortBy === 'recent' ?
              'Most Recent' : 
                     sortBy === 'popular' ?
              'Most Downloaded' :
                     sortBy === 'rating' ?
              'Highest Rated' : 'Title A-Z'}
            </Button>

            <Menu
              anchorEl={sortMenuAnchor}
              open={Boolean(sortMenuAnchor)}
              onClose={() => setSortMenuAnchor(null)}
            >
              <MenuItem onClick={() => { setSortBy('recent'); setSortMenuAnchor(null); }}>
                Most Recent
              </MenuItem>
              <MenuItem onClick={() => { setSortBy('popular');
              setSortMenuAnchor(null); }}>
                Most Downloaded
              </MenuItem>
              <MenuItem onClick={() => { setSortBy('rating');
              setSortMenuAnchor(null); }}>
                Highest Rated
              </MenuItem>
              <MenuItem onClick={() => { setSortBy('title');
              setSortMenuAnchor(null); }}>
                Title A-Z
              </MenuItem>
            </Menu>

            <Button
              onClick={clearFilters}
              sx={{
                color: '#666',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              Clear Filters
            </Button>
          </Stack>

          {/* Results Count */}
          <Typography variant="body1" sx={{ color: '#4A5C3A', mt: 3 }}>
            📚 {filteredNotes.length} notes found
            {searchQuery && ` for "${searchQuery}"`}
            {selectedSubject && ` in ${selectedSubject}`}
            {selectedLevel && ` at ${selectedLevel} level`}
          </Typography>
        </Paper>

        {/* Notes Grid */}
        {loading ?
        (
          <Grid container spacing={3}>
            {/* FIX: Changed skeleton count to 10 */}
            {[...Array(10)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card sx={{ height: 420 }}>
                  <Skeleton variant="rectangular" height={160} />
                  <CardContent>
                    <Skeleton variant="text" height={30} />
                    <Skeleton variant="text" height={20} />
                    <Skeleton variant="text" height={20} width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <Grid container spacing={3}>
              {currentNotes.map((note) => (
                // FIX: Adjusted grid breakpoints for better layout
                <Grid item xs={12} sm={6} md={4} lg={3} key={note.id}>
                  <Card 
                    sx={{ 
                      height: 420,
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 
                        'translateY(-4px)',
                        boxShadow: '0 12px 30px rgba(46, 125, 50, 0.15)'
                      }
                    }}
                  >
         
                    {/* Note Header with File Preview */}
                    <Box sx={{ 
                      height: 120,
                      background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <Typography variant="h1" sx={{ opacity: 0.3, fontSize: '3rem' }}>
                        {getFileIcon(note.files?.[0]?.fileType)}
                      </Typography>
                      
  
                      {/* Bookmark Button */}
                      <IconButton
                        sx={{ 
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 1)'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmark(note.id);
                        }}
                      >
                        {bookmarkedNotes.has(note.id) ?
                        <Bookmark sx={{ color: '#2E7D32', fontSize: 18 }} /> : 
                          <BookmarkBorder sx={{ color: '#666', fontSize: 18 }} />
                        }
                      </IconButton>

            
                      {/* File Count Badge */}
                      {note.files && note.files.length > 1 && (
                        <Chip
                          label={`${note.files.length} files`}
                          size="small"
                          sx={{
                            position: 'absolute',
                          bottom: 8,
                            left: 8,
                            backgroundColor: 'rgba(46, 125, 50, 0.9)',
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      )}
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
                      {/* Title */}
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: '#1B5E20',
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '1rem',
                          lineHeight: 1.2,
                          height: '2.4rem'
                        }}
                      >
                        {note.title ||
                        'Untitled Note'}
                      </Typography>

                      {/* Subject and Level */}
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
                        <Chip 
                          label={note.subject ||
                          'General'} 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#E8F5E8',
                            color: '#1B5E20',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            height: 
                            22
                          }}
                        />
                        <Chip 
                          label={note.academicLevel || 'Not specified'} 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#E3F2FD',
                            color: '#1976d2',
                            fontSize: '0.7rem',
                            height: 22
                          }}
                        />
                      </Box>

                      {/* Description */}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#4A5C3A',
                          mb: 1.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.3,
                          fontSize: '0.85rem',
                          height: '2.6rem',
                          flexGrow: 1
                        }}
                      >
                        {note.description ||
                        'No description available'}
                      </Typography>

                      {/* Author and Date */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5, 
                        mb: 1 
                      }}>
                        <Avatar 
                          sx={{ 
                            width: 20, 
                            height: 20, 
                            backgroundColor: '#2E7D32',
                            fontSize: '0.7rem'
                          }}
                        >
                          {(note.uploaderEmail || note.uploaderName || 'U')?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="caption" 
                        sx={{ color: '#666', fontSize: '0.7rem' }}>
                          {(note.uploaderEmail || note.uploaderName || 'Unknown')?.split('@')[0]}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                          • {formatDate(note.createdAt)}
                        </Typography>
                      </Box>

                      {/* Enhanced Stats with Rating */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: 1.5 
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <Rating 
                            value={note.averageRating ||
                            0} 
                            readOnly 
                            size="small"
                            precision={0.1}
                            sx={{ fontSize: '0.9rem' }}
                          />
                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                            ({note.totalRatings || 0})
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                          {note.downloadCount ||
                          0} downloads
                        </Typography>
                        {(note.totalComments || 0) > 0 && (
                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                            {note.totalComments} comments
                          </Typography>
                        )}
                      </Box>
                      {/* Tags */}
                      {note.tags && note.tags.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          {note.tags.slice(0, 2).map((tag, index) => (
                            <Chip key={index} label={tag} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.3, fontSize: '0.6rem', height: 18 }} />
                          ))}
                          {note.tags.length > 2 && (
                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.6rem' }}>
                              +{note.tags.length - 2} more
                            </Typography>
                          )}
                        </Box>
                      )}
                    </CardContent>
                    {/* Action Buttons */}
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Button 
                          fullWidth variant="outlined" size="small" startIcon={<Visibility sx={{ fontSize: 16 }} />} onClick={() => handlePreview(note)} sx={{ color: '#2E7D32', borderColor: '#2E7D32', fontSize: '0.75rem', py: 0.5, '&:hover': { borderColor: '#1B5E20', backgroundColor: 'rgba(46, 125, 50, 0.04)' } }} > Preview </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button fullWidth variant="contained" size="small" startIcon={<Download sx={{ fontSize: 16 }} />} onClick={() => handleDownload(note)} sx={{ backgroundColor: '#2E7D32', fontSize: '0.75rem', py: 0.5, '&:hover': { backgroundColor: '#1B5E20' } }} > Download </Button>
                        </Grid>
                      </Grid>
                      {/* Additional Actions */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Tooltip title="Rate & Comment">
                          <IconButton size="small" sx={{ color: '#666', p: 0.5 }} onClick={() => handlePreview(note)} >
                            <Star 
                            sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Share (Coming Soon)">
                          <IconButton size="small" sx={{ color: '#666', p: 0.5 }}>
                            <Share sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Report Content">
                          <IconButton size="small" sx={{ color: '#666', p: 0.5 }} onClick={() => openFlagDialog(note)} >
                            <Flag sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination count={totalPages} page={currentPage} onChange={(event, page) => setCurrentPage(page)} color="primary" size="large" sx={{ '& .MuiPaginationItem-root': { color: '#2E7D32', '&.Mui-selected': { backgroundColor: '#2E7D32', color: 'white' } } }} />
              </Box>
            )}
            {/* FIX: Improved No Results layout */}
            {!loading && filteredNotes.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8, background: 'rgba(255, 255, 255, 0.8)', borderRadius: 3, border: '1px solid rgba(46, 125, 50, 0.1)' }}>
                <Typography variant="h4" sx={{ color: '#666', mb: 2 }}> 📭 No notes found </Typography>
                <Typography variant="body1" sx={{ color: '#666', mb: 3 }}> Try adjusting your search criteria or filters </Typography>
                <Button variant="contained" onClick={clearFilters} sx={{ backgroundColor: '#2E7D32', '&:hover': { backgroundColor: '#1B5E20' } }} > Clear All Filters </Button>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Enhanced Preview Dialog with Reviews */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { 
        borderRadius: 3, maxHeight: '90vh' } }} >
        {previewNote && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1B5E20' }}> 📄 {previewNote.title} </Typography>
              <IconButton onClick={() => setPreviewOpen(false)}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pb: 1 }}>
              {/* Author Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, backgroundColor: '#F8F9FA', borderRadius: 2 }}>
                <Avatar sx={{ backgroundColor: '#2E7D32' }}>
                  {(previewNote.uploaderEmail ||
                  previewNote.uploaderName || 'U')?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {(previewNote.uploaderEmail || previewNote.uploaderName || 'Unknown User')?.split('@')[0]}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    {previewNote.university ||
                    'Unknown University'} • {formatDate(previewNote.createdAt)}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto', textAlign: 'center' }}>
                  <Rating value={previewNote.averageRating ||
                  0} readOnly precision={0.1} sx={{ mb: 0.5 }} />
                  <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                    {previewNote.totalRatings ||
                    0} ratings
                  </Typography>
                </Box>
              </Box>
              {/* Subject and Level */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Chip label={previewNote.subject ||
                'General'} sx={{ backgroundColor: '#E8F5E8', color: '#1B5E20' }} />
                <Chip label={previewNote.academicLevel ||
                'Not specified'} sx={{ backgroundColor: '#E3F2FD', color: '#1976d2' }} />
                {previewNote.course && (
                  <Chip label={previewNote.course} variant="outlined" />
                )}
              </Box>
              {/* Description */}
              <Typography variant="h6" sx={{ mb: 2, color: '#1B5E20' }}> Description </Typography>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                {previewNote.description ||
                'No description provided.'}
              </Typography>
              {/* Files Section */}
              <Typography variant="h6" sx={{ mb: 2, color: '#1B5E20' }}> Files ({previewNote.files?.length || 0}) </Typography>
              {previewNote.files && previewNote.files.length > 0 ?
              ( previewNote.files.map((file, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, mb: 1, transition: 'all 0.2s ease', '&:hover': { backgroundColor: '#f8f9fa', borderColor: '#2E7D32' } }} >
                  <Typography sx={{ fontSize: '1.5rem' }}>
                    {getFileIcon(file.fileType)}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1B5E20' }}>
                      {file.fileName || 'Unknown file'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {formatFileSize(file.fileSize)} • {file.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small" startIcon={<GetApp />} onClick={() => handleDownload(previewNote)} sx={{ color: '#2E7D32', borderColor: '#2E7D32', minWidth: '100px', '&:hover': { borderColor: '#1B5E20', backgroundColor: 'rgba(46, 125, 50, 0.04)', transform: 
                    'translateY(-1px)' } }} > Download </Button>
                </Box> )) ) : (
                <Box sx={{ textAlign: 'center', p: 4, border: '2px dashed #e0e0e0', borderRadius: 2, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                    📄 No files available
                  </Typography>
                </Box>
              )}
              {/* Tags */}
              {previewNote.tags && previewNote.tags.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, mt: 3, color: '#1B5E20' }}> Tags </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {previewNote.tags.map((tag, index) => (
                      <Chip key={index} label={tag} variant="outlined" size="small" />
                    ))}
                  </Box>
                </>
              )}
              <Divider sx={{ my: 3 }} />
              {/* Reviews Section */}
              <Typography 
              variant="h6" sx={{ mb: 2, color: '#1B5E20' }}> 📝 Reviews & Ratings ({reviews[previewNote.id]?.length ||
              0}) </Typography>
              {/* Add Review Form */}
              {user && !userReviews[previewNote.id] && (
                <Paper sx={{ p: 3, mb: 3, backgroundColor: '#F8F9FA' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}> Write a Review </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}> Rating * </Typography>
                    <Rating value={newRating} onChange={(event, newValue) => setNewRating(newValue)} size="large" />
                  </Box>
                  <TextField fullWidth multiline rows={3} placeholder="Share your thoughts about these notes..." value={newComment} onChange={(e) => setNewComment(e.target.value)} sx={{ mb: 2 }} />
                  <Button variant="contained" onClick={handleSubmitReview} disabled={isSubmittingReview || newRating === 0} startIcon={<Send />} sx={{ backgroundColor: '#2E7D32', '&:hover': { backgroundColor: '#1B5E20' } }} >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </Paper>
              )}
              {/* Existing Reviews */}
              {reviews[previewNote.id] && reviews[previewNote.id].length > 0 ?
              (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {reviews[previewNote.id].map((review, index) => (
                    <Box key={review.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ backgroundColor: '#2E7D32' }}>
                            {review.userName?.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {review.userName}
                            </Typography>
                            <Rating value={review.rating} readOnly size="small" />
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {formatDate(review.createdAt)}
                            </Typography>
                          </Box>
                        } secondary={
                          review.comment && (
                            <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.5 }}>
                              {review.comment}
                            </Typography>
                          )
                        } />
                      </ListItem>
                      {index < reviews[previewNote.id].length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 
                'center', p: 4, backgroundColor: '#F8F9FA', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}> No reviews yet.
                  Be the first to review these notes! </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
              <Button variant="outlined" onClick={() => setPreviewOpen(false)} sx={{ mr: 1 }} > Close </Button>
              <Button variant="contained" startIcon={<Download />} onClick={() => handleDownload(previewNote)} sx={{ backgroundColor: '#2E7D32', '&:hover': { backgroundColor: '#1B5E20' } }} > Download All Files </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onClose={() => setFlagDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#E65100' }}>
          <Warning /> Report Content
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please select a reason for reporting this note. Your report will be reviewed by our moderation team.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="flag-reason-label">Reason</InputLabel>
            <Select
              labelId="flag-reason-label"
              value={flagReason}
              label="Reason"
              onChange={(e) => setFlagReason(e.target.value)}
            >
              <MenuItem value="">
                <em>Select a reason</em>
              </MenuItem>
              <MenuItem value="inappropriate_content">Inappropriate Content</MenuItem>
              <MenuItem value="spam">Spam or Irrelevant</MenuItem>
              <MenuItem value="copyright">Copyright Infringement</MenuItem>
              <MenuItem value="low_quality">Low Quality or Inaccurate</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Details (Optional)"
            value={flagDescription}
            onChange={(e) => setFlagDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDialogOpen(false)} disabled={isSubmittingFlag}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleFlagNote}
            disabled={isSubmittingFlag || !flagReason}
            startIcon={<Flag />}
            sx={{ backgroundColor: '#E65100', '&:hover': { backgroundColor: '#BF360C' } }}
          >
            {isSubmittingFlag ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotesSearch;