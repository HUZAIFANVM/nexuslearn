import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
} from '@mui/material';
import { MarkEmailRead } from '@mui/icons-material';
import { forgotPassword } from '../api/auth';
import NexusMark from '../components/brand/NexusMark';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: 'background.default', p: 2 }}
    >
      <Card
        sx={{
          width: 440,
          p: 2,
          borderRadius: '24px',
          border: 1,
          borderColor: 'divider',
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

          {!submitted ? (
            <>
              <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>
                Forgot Your Password?
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', textAlign: 'left' }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
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
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                Remembered it?{' '}
                <Link
                  to="/login"
                  style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}
                >
                  Back to Login
                </Link>
              </Typography>
            </>
          ) : (
            <>
              <MarkEmailRead sx={{ fontSize: 64, color: '#10B981', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>
                Check Your Email
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
                The link will expire in 1 hour.
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
                Back to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
