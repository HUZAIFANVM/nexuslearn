import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, CircularProgress, Alert, Button,
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { verifyEmail } from '../api/auth';
import NexusMark from '../components/brand/NexusMark';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Verification failed. The link may have expired.');
      });
  }, [searchParams]);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: 'background.default' }}
    >
      <Card
        sx={{
          width: 440,
          p: 2,
          borderRadius: '24px',
          border: 1, borderColor: 'divider',
          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <NexusMark size={20} />
            </Box>
          </Box>

          {status === 'verifying' && (
            <>
              <CircularProgress size={48} sx={{ mb: 3, color: '#3B82F6' }} />
              <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>
                Verifying Your Email
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we verify your email address...
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle sx={{ fontSize: 64, color: '#10B981', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>
                Email Verified!
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {message}
              </Typography>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                fullWidth
                sx={{
                  py: 1.3,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  },
                }}
              >
                Continue to Login
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Error sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mb: 3, borderRadius: '10px', textAlign: 'left' }}>
                {message}
              </Alert>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  fullWidth
                  sx={{
                    py: 1.2,
                    borderRadius: '10px',
                    borderColor: 'divider',
                    color: 'text.primary',
                  }}
                >
                  Back to Login
                </Button>
                <Button
                  component={Link}
                  to="/signup"
                  variant="contained"
                  fullWidth
                  sx={{
                    py: 1.2,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    borderRadius: '10px',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    },
                  }}
                >
                  Sign Up Again
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
