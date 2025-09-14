// src/pages/LandingPage.js - FINAL VERSION WITH FIXED VALIDATION
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Container,
    Grid,
    Card,
    CardContent,
    AppBar,
    Toolbar,
    Dialog,
    DialogContent,
    TextField,
    Paper,
    Link as MuiLink,
    Fade,
    Slide,
    useTheme,
    useMediaQuery,
    IconButton,
    Snackbar,
    Alert
} from '@mui/material';
import {
    School,
    CloudUpload,
    Search,
    Star,
    Group,
    Psychology,
    ArrowForward,
    Close,
    Category
} from '@mui/icons-material';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import ProfileService from '../services/profileService';

const AuthDialog = ({ open, onClose, onSwitch, isLogin, email, setEmail, password, setPassword, onSubmit, title, loading }) => {
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateEmail = (emailValue) => {
        if (!emailValue.trim()) {
            setEmailError('Email is required.');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            setEmailError('Enter a valid email address.');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (passwordValue) => {
        if (!passwordValue) {
            setPasswordError('Password is required.');
            return false;
        }
        if (passwordValue.length < 6) {
            setPasswordError('Password must be at least 6 characters long.');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleCloseDialog = () => {
        setEmailError('');
        setPasswordError('');
        onClose();
    };

    const handleSwitchDialog = () => {
        setEmailError('');
        setPasswordError('');
        onSwitch();
    };
    
    // NEW: Handle submit to perform validation before passing it up
    const handleSubmit = (event) => {
        event.preventDefault();
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        
        if (isEmailValid && isPasswordValid) {
            onSubmit(event);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)',
                    overflow: 'visible'
                }
            }}
        >
            <DialogContent sx={{ p: 0, position: 'relative' }}>
                <IconButton
                    onClick={handleCloseDialog}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: '#2E7D32',
                        zIndex: 1,
                        backgroundColor: 'white',
                        '&:hover': {
                            backgroundColor: '#f5f5f5'
                        }
                    }}
                >
                    <Close />
                </IconButton>

                <Paper
                    elevation={0}
                    sx={{
                        padding: 4,
                        margin: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Typography
                        variant="h4"
                        align="center"
                        gutterBottom
                        sx={{
                            color: '#1B5E20',
                            fontWeight: 'bold',
                            mb: 3
                        }}
                    >
                        {title} to NoteNest 📚
                    </Typography>

                    {/* NEW: Added noValidate to the form */}
                    <form onSubmit={handleSubmit} noValidate>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            variant="outlined"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                // NEW: Validate on change for live feedback
                                validateEmail(e.target.value);
                            }}
                            // REMOVED 'required'
                            error={!!emailError}
                            helperText={emailError}
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': {
                                        borderColor: '#2E7D32',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#2E7D32',
                                    }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#2E7D32',
                                }
                            }}
                        />

                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            variant="outlined"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                // NEW: Validate on change for live feedback
                                validatePassword(e.target.value);
                            }}
                            // REMOVED 'required'
                            error={!!passwordError}
                            helperText={passwordError}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': {
                                        borderColor: '#2E7D32',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#2E7D32',
                                    }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#2E7D32',
                                }
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                backgroundColor: '#2E7D32',
                                '&:hover': {
                                    backgroundColor: '#1B5E20',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(46, 125, 50, 0.3)',
                                },
                                '&:disabled': {
                                    backgroundColor: '#A5D6A7',
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </Button>
                    </form>

                    <Typography align="center" sx={{ mt: 2, color: 'text.secondary' }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <MuiLink
                            component="button"
                            type="button"
                            onClick={handleSwitchDialog}
                            sx={{
                                color: '#2E7D32',
                                fontWeight: 'bold',
                                textDecoration: 'none',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </MuiLink>
                    </Typography>
                </Paper>
            </DialogContent>
        </Dialog>
    );
};

const LandingPage = () => {
    const [loginOpen, setLoginOpen] = useState(false);
    const [signupOpen, setSignupOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    const handleLogin = async (event) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showSnackbar("Login successful! Redirecting...", "success");
            navigate("/dashboard");
        } catch (err) {
            showSnackbar("Login failed: " + err.message, "error");
        }
        setLoading(false);
    };

    const handleSignup = async (event) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await ProfileService.initializeNewUser(userCredential.user.uid, userCredential.user.email);
            showSnackbar("Account created successfully! Welcome to NoteNest.", "success");
            navigate("/dashboard");
        } catch (err) {
            showSnackbar("Signup failed: " + err.message, "error");
        }
        setLoading(false);
    };

    const resetAndOpenDialog = (dialogType) => {
        setEmail("");
        setPassword("");
        setLoading(false);
        if (dialogType === 'login') {
            setLoginOpen(true);
        } else {
            setSignupOpen(true);
        }
    };

    const handleSwitchToLogin = () => {
        setEmail("");
        setPassword("");
        setSignupOpen(false);
        setLoginOpen(true);
    };

    const handleSwitchToSignup = () => {
        setEmail("");
        setPassword("");
        setLoginOpen(false);
        setSignupOpen(true);
    };

    const features = [
        {
            icon: <CloudUpload sx={{ fontSize: 48, color: '#2E7D32' }} />,
            title: "Easy Upload",
            description: "Upload your notes in seconds with our intuitive drag-and-drop interface"
        },
        {
            icon: <Group sx={{ fontSize: 48, color: '#2E7D32' }} />,
            title: "Community Driven",
            description: "Join thousands of students sharing knowledge together"
        },
        {
            icon: <Search sx={{ fontSize: 48, color: '#2E7D32' }} />,
            title: "Smart Search",
            description: "Find exactly what you need with our advanced search filters and categories"
        },
        {
            icon: <Star sx={{ fontSize: 48, color: '#2E7D32' }} />,
            title: "Rate & Review",
            description: "Help others by rating and reviewing notes from your peers"
        },
        {
            icon: <Psychology sx={{ fontSize: 48, color: '#2E7D32' }} />,
            title: "Smart Flashcards",
            description: "Auto-generate flashcards from your notes for better studying"
        },
        {
            icon: <Category sx={{ fontSize: 48, color: '#2E7D32' }} />,
            title: "Subject Categories",
            description: "Organize notes by subjects, courses, and academic levels"
        }
    ];

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 50%, #E3F2FD 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    width: '300px',
                    height: '300px',
                    background: 'rgba(46, 125, 50, 0.08)',
                    borderRadius: '50%',
                    animation: 'float 6s ease-in-out infinite',
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '10%',
                    right: '10%',
                    width: '200px',
                    height: '200px',
                    background: 'rgba(227, 242, 253, 0.6)',
                    borderRadius: '50%',
                    animation: 'float 8s ease-in-out infinite reverse',
                },
                '@keyframes float': {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(180deg)' }
                }
            }} />

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
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 'bold',
                            color: '#1B5E20',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <School sx={{ fontSize: 32, color: '#2E7D32' }} />
                        NoteNest
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => resetAndOpenDialog('login')}
                            sx={{
                                color: '#2E7D32',
                                borderColor: '#2E7D32',
                                '&:hover': {
                                    borderColor: '#1B5E20',
                                    backgroundColor: 'rgba(46, 125, 50, 0.04)'
                                }
                            }}
                        >
                            Sign In
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => resetAndOpenDialog('signup')}
                            sx={{
                                backgroundColor: '#2E7D32',
                                '&:hover': {
                                    backgroundColor: '#1B5E20',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(46, 125, 50, 0.3)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Get Started
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: 8, pb: 6 }}>
                <Fade in={isVisible} timeout={1000}>
                    <Box textAlign="center" sx={{ mb: 8 }}>
                        <Typography
                            variant={isMobile ? "h3" : "h2"}
                            sx={{
                                fontWeight: 'bold',
                                color: '#1B5E20',
                                mb: 3,
                                textShadow: '0 2px 10px rgba(27, 94, 32, 0.1)'
                            }}
                        >
                            Share Knowledge,
                            <br />
                            <Box component="span" sx={{
                                color: '#2E7D32'
                            }}>
                                Excel Together
                            </Box>
                        </Typography>

                        <Typography
                            variant="h6"
                            sx={{
                                color: '#4A5C3A',
                                mb: 4,
                                maxWidth: 600,
                                mx: 'auto',
                                lineHeight: 1.6
                            }}
                        >
                            The ultimate platform for college students to upload, share, and discover
                            high-quality study notes. Join thousands of students building a collaborative
                            learning community.
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => resetAndOpenDialog('signup')}
                                endIcon={<ArrowForward />}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1.1rem',
                                    backgroundColor: '#2E7D32',
                                    fontWeight: 'bold',
                                    '&:hover': {
                                        backgroundColor: '#1B5E20',
                                        transform: 'translateY(-3px)',
                                        boxShadow: '0 12px 30px rgba(46, 125, 50, 0.4)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Start Sharing Notes
                            </Button>

                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => resetAndOpenDialog('login')}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1.1rem',
                                    color: '#2E7D32',
                                    borderColor: '#2E7D32',
                                    '&:hover': {
                                        borderColor: '#1B5E20',
                                        backgroundColor: 'rgba(46, 125, 50, 0.04)',
                                        transform: 'translateY(-3px)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Explore Notes
                            </Button>
                        </Box>
                    </Box>
                </Fade>

                <Slide direction="up" in={isVisible} timeout={1500}>
                    <Box sx={{ mt: 10 }}>
                        <Typography
                            variant="h3"
                            textAlign="center"
                            sx={{
                                color: '#1B5E20',
                                fontWeight: 'bold',
                                mb: 2,
                                textShadow: '0 2px 10px rgba(27, 94, 32, 0.1)'
                            }}
                        >
                            Why Choose NoteNest?
                        </Typography>

                        <Typography
                            variant="h6"
                            textAlign="center"
                            sx={{
                                color: '#4A5C3A',
                                mb: 6,
                                maxWidth: 600,
                                mx: 'auto'
                            }}
                        >
                            Powerful features designed to enhance your learning experience
                        </Typography>

                        <Grid container spacing={4} alignItems="stretch" justifyContent="center">
                            {features.map((feature, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={4} key={index} sx={{ display: 'flex' }}>
                                    <Fade in={isVisible} timeout={1000 + (index * 200)}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                width: '30rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                background: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(46, 125, 50, 0.1)',
                                                borderRadius: 3,
                                                transition: 'all 0.3s ease',
                                                boxSizing: 'border-box',
                                                '&:hover': {
                                                    transform: 'translateY(-10px)',
                                                    background: 'rgba(255, 255, 255, 0.95)',
                                                    boxShadow: '0 20px 40px rgba(46, 125, 50, 0.1)',
                                                }
                                            }}
                                        >
                                            <CardContent sx={{
                                                textAlign: 'center',
                                                p: 4,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                flexGrow: 1,
                                            }}>
                                                <Box sx={{ mb: 2 }}>
                                                    {feature.icon}
                                                </Box>
                                                <Typography
                                                    variant="h5"
                                                    sx={{
                                                        color: '#1B5E20',
                                                        fontWeight: 'bold',
                                                        mb: 2
                                                    }}
                                                >
                                                    {feature.title}
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        color: '#4A5C3A',
                                                        lineHeight: 1.6,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        minHeight: '72px',
                                                    }}
                                                >
                                                    {feature.description}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Fade>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Slide>

                <Fade in={isVisible} timeout={2500}>
                    <Box
                        textAlign="center"
                        sx={{
                            mt: 10,
                            p: 6,
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: 4,
                            border: '1px solid rgba(46, 125, 50, 0.1)'
                        }}
                    >
                        <Typography
                            variant="h4"
                            sx={{
                                color: '#1B5E20',
                                fontWeight: 'bold',
                                mb: 2
                            }}
                        >
                            Ready to Transform Your Study Experience?
                        </Typography>

                        <Typography
                            variant="h6"
                            sx={{
                                color: '#4A5C3A',
                                mb: 4
                            }}
                        >
                            Join our community of ambitious students today!
                        </Typography>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => resetAndOpenDialog('signup')}
                            sx={{
                                px: 6,
                                py: 2,
                                fontSize: '1.2rem',
                                backgroundColor: '#2E7D32',
                                fontWeight: 'bold',
                                '&:hover': {
                                    backgroundColor: '#1B5E20',
                                    transform: 'translateY(-3px)',
                                    boxShadow: '0 15px 35px rgba(46, 125, 50, 0.4)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Get Started Now
                        </Button>
                    </Box>
                </Fade>
            </Container>

            <AuthDialog
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                onSwitch={handleSwitchToSignup}
                isLogin={true}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleLogin}
                title="Welcome Back"
                loading={loading}
            />

            <AuthDialog
                open={signupOpen}
                onClose={() => setSignupOpen(false)}
                onSwitch={handleSwitchToLogin}
                isLogin={false}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleSignup}
                title="Join"
                loading={loading}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LandingPage;