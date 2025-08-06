import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalHospital,
  Email,
  Lock,
  Google,
} from '@mui/icons-material';
import { authService } from '../../services/authService';
import { loginSuccess } from '../../store/slices/authSlice';
import aintakeLogo from '../../assets/aintake-logo.svg';
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { signInWithGoogle, user: firebaseUser } = useFirebaseAuth();

  useEffect(() => {
    // Check if user is already authenticated with Firebase
    // Only redirect if we're on the login page and have a user
    if (firebaseUser && !isLoading && !isGoogleLoading) {
      navigate('/');
    }
  }, [firebaseUser, navigate, isLoading, isGoogleLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Traditional login temporarily disabled - use Google Sign-In
      setError('Please use Google Sign-In to authenticate');
      
      // TODO: Re-enable when backend supports traditional login with Firebase
      // const response = await authService.login(username, password);
      // dispatch(loginSuccess({
      //   user: response.user,
      //   organization: response.organization,
      // }));
      // navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Please use Google Sign-In to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    
    try {
      await signInWithGoogle();
      // The Firebase auth context will handle the authentication
      // and the baseApi will automatically include the ID token
      navigate('/');
    } catch (err: any) {
      
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Box
      className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-bg-gradient-to-br tw-from-blue-50 tw-to-blue-100"
      sx={{
        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(25, 118, 210, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(25, 118, 210, 0.05) 0%, transparent 50%)',
      }}
    >
      <Paper
        elevation={4}
        className="tw-p-8 tw-w-full tw-max-w-md tw-mx-4"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Logo and Title */}
        <Box className="tw-text-center tw-mb-8">
          <img 
            src={aintakeLogo} 
            alt="Aintake Logo" 
            className="tw-h-20 tw-mx-auto tw-mb-4"
          />
          <Typography 
            variant="h4" 
            component="h1" 
            className="tw-font-bold tw-text-gray-800 tw-mb-2"
          >
            Welcome Back
          </Typography>
          <Typography 
            variant="body2" 
            className="tw-text-gray-600"
          >
            Healthcare Form Management System
          </Typography>
        </Box>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert 
              severity="error" 
              className="tw-mb-4"
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            type="text"
            label="Email or Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            className="tw-mb-4"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email className="tw-text-gray-400" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="tw-mb-6"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock className="tw-text-gray-400" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            className="tw-mb-4 tw-py-3"
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Divider */}
        <Box className="tw-my-4 tw-flex tw-items-center">
          <Divider className="tw-flex-1" />
          <Typography variant="body2" className="tw-px-3 tw-text-gray-500">
            OR
          </Typography>
          <Divider className="tw-flex-1" />
        </Box>

        {/* Google Sign In Button */}
        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="tw-mb-4 tw-py-3"
          startIcon={isGoogleLoading ? null : <Google />}
          sx={{
            borderColor: '#dadce0',
            color: '#3c4043',
            '&:hover': {
              backgroundColor: '#f8f9fa',
              borderColor: '#dadce0',
            },
          }}
        >
          {isGoogleLoading ? (
            <CircularProgress size={24} />
          ) : (
            'Continue with Google'
          )}
        </Button>

        {/* Demo Credentials Notice */}
        <Box className="tw-mt-6 tw-p-4 tw-bg-blue-50 tw-rounded-lg">
          <Typography variant="body2" className="tw-text-gray-700 tw-text-center">
            <strong>Demo Credentials:</strong>
            <br />
            Username: admin
            <br />
            Password: admin123
          </Typography>
        </Box>

        {/* Footer */}
        <Box className="tw-mt-8 tw-pt-4 tw-border-t tw-border-gray-200">
          <Box className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-gray-600">
            <LocalHospital fontSize="small" />
            <Typography variant="caption">
              HIPAA Compliant Healthcare Platform
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};