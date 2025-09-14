// src/pages/NotesUpload.js
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  AppBar,
  Toolbar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Description,
  ArrowBack,
  School,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { storage, db, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { SUBJECTS, ACADEMIC_LEVELS } from '../utils/constants';
// ADD this import at the top of NotesUpload.js:
import ProfileService from '../services/profileService';

const NotesUpload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    academicLevel: '',
    university: '',
    course: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const validFiles = selectedFiles.filter(file => {
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      return allowedTypes.includes(file.type) && file.size <= maxSize;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  // Handle drag and drop
  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      return allowedTypes.includes(file.type) && file.size <= maxSize;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Remove file
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle tags
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    if (fileType.includes('text')) return '📃';
    return '📄';
  };

  // Upload notes
  const handleUpload = async () => {
    if (!files.length || !formData.title || !formData.subject || !formData.academicLevel) {
      setError('Please fill in all required fields and select at least one file.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadPromises = files.map(async (file) => {
        // Create unique filename
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `notes/${fileName}`);
        
        // Upload file
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return {
          fileName: file.name,
          fileUrl: downloadURL,
          fileType: file.type,
          fileSize: file.size
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Save to Firestore
      const noteData = {
        ...formData,
        files: uploadedFiles,
        uploaderId: auth.currentUser.uid,
        uploaderEmail: auth.currentUser.email,
        downloadCount: 0,
        averageRating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        status: 'active'
      };

      //await addDoc(collection(db, 'notes'), noteData);
      const noteRef = await addDoc(collection(db, 'notes'), noteData);
    
    // ✅ ADD THIS AFTER SUCCESSFUL UPLOAD:
    await ProfileService.trackNoteUpload(auth.currentUser.uid, {
      id: noteRef.id,
      title: formData.title
    });
      setSuccess(true);
      
      // Reset form
      setFiles([]);
      setFormData({
        title: '',
        description: '',
        subject: '',
        academicLevel: '',
        university: '',
        course: '',
        tags: []
      });

      // Redirect after success
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
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
            <ArrowBack />
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
            Upload Notes
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Left Column - File Upload */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(46, 125, 50, 0.1)'
              }}
            >
              <Typography variant="h5" sx={{ color: '#1B5E20', fontWeight: 'bold', mb: 3 }}>
                📤 Upload Files
              </Typography>

              {/* Drag and Drop Area */}
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                sx={{
                  border: '2px dashed #2E7D32',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#1B5E20',
                    backgroundColor: 'rgba(46, 125, 50, 0.02)'
                  }
                }}
                onClick={() => document.getElementById('file-input').click()}
              >
                <CloudUpload sx={{ fontSize: 48, color: '#2E7D32', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#1B5E20', mb: 1 }}>
                  Drag & Drop Files Here
                </Typography>
                <Typography variant="body2" sx={{ color: '#4A5C3A', mb: 2 }}>
                  or click to browse
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Supported: PDF, DOC, DOCX, PPT, PPTX, TXT<br />
                  Max size: 10MB per file
                </Typography>
              </Box>

              <input
                type="file"
                id="file-input"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {/* Selected Files */}
              {files.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ color: '#1B5E20', mb: 2 }}>
                    Selected Files ({files.length})
                  </Typography>
                  {files.map((file, index) => (
                    <Card key={index} sx={{ mb: 1 }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '1.2rem' }}>
                              {getFileIcon(file.type)}
                            </Typography>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {file.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                {formatFileSize(file.size)}
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton 
                            size="small" 
                            onClick={() => removeFile(index)}
                            sx={{ color: '#f44336' }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Column - Note Details */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(46, 125, 50, 0.1)'
              }}
            >
              <Typography variant="h5" sx={{ color: '#1B5E20', fontWeight: 'bold', mb: 3 }}>
                📝 Note Details
              </Typography>

              <Grid container spacing={3}>
                {/* Title */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title *"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Linear Algebra - Chapter 3 Notes"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': { borderColor: '#2E7D32' }
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#2E7D32' }
                    }}
                  />
                </Grid>

                {/* Subject and Academic Level */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Subject *</InputLabel>
                    <Select
                      value={formData.subject}
                      label="Subject *"
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                    >
                      {SUBJECTS.map((subject) => (
                        <MenuItem key={subject} value={subject}>
                          {subject}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Academic Level *</InputLabel>
                    <Select
                      value={formData.academicLevel}
                      label="Academic Level *"
                      onChange={(e) => handleInputChange('academicLevel', e.target.value)}
                    >
                      {ACADEMIC_LEVELS.map((level) => (
                        <MenuItem key={level} value={level}>
                          {level}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* University and Course */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="University"
                    value={formData.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    placeholder="e.g., MIT, Stanford, Harvard"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Course"
                    value={formData.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                    placeholder="e.g., CS101, MATH201"
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what these notes cover, key topics, etc."
                  />
                </Grid>

                {/* Tags */}
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Add Tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="e.g., calculus, derivatives, integration"
                      InputProps={{
                        endAdornment: (
                          <Button 
                            onClick={addTag}
                            size="small"
                            sx={{ color: '#2E7D32' }}
                          >
                            Add
                          </Button>
                        )
                      }}
                    />
                  </Box>
                  
                  {formData.tags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          onDelete={() => removeTag(tag)}
                          sx={{
                            backgroundColor: '#E8F5E8',
                            color: '#1B5E20',
                            '& .MuiChip-deleteIcon': { color: '#2E7D32' }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Grid>

                {/* Upload Button */}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleUpload}
                    disabled={uploading || !files.length || !formData.title || !formData.subject || !formData.academicLevel}
                    startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                    sx={{
                      py: 2,
                      backgroundColor: '#2E7D32',
                      '&:hover': {
                        backgroundColor: '#1B5E20',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(46, 125, 50, 0.3)'
                      },
                      '&:disabled': {
                        backgroundColor: '#A5D6A7'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {uploading ? 'Uploading...' : 'Upload Notes'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
          icon={<CheckCircle />}
        >
          Notes uploaded successfully! Redirecting to dashboard...
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError('')} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotesUpload;