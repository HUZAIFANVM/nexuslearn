import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { resetPassword } from '../api/auth';
import NexusMark from '../components/brand/NexusMark';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid reset link. No token provided.');
    }
  }, [token]);

  const validate = () => {
    if (newPassword.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (newPassword !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setMessage(validationError);
      setStatus('idle');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await resetPassword(token, newPassword);
      setStatus('success');
      setMessage(res.data.message);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.detail || 'Password reset failed. The link may have expired.');
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

          {status === 'success' && (
            <>
              <CheckCircle sx={{ fontSize: 64, color: '#10B981', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>
                Password Reset!
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
                Link Invalid
              </Typography>
              <Alert severity="error" sx={{ mb: 3, borderRadius: '10px', textAlign: 'left' }}>
                {message}
              </Alert>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  component={Link}
                  to="/forgot-password"
                  variant="outlined"
                  fullWidth
                  sx={{
                    py: 1.2,
                    borderRadius: '10px',
                    borderColor: 'divider',
                    color: 'text.primary',
                  }}
                >
                  Request New Link
                </Button>
                <Button
                  component={Link}
                  to="/login"
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
                  Back to Login
                </Button>
              </Box>
            </>
          )}

          {status === 'idle' && token && (
            <>
              <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>
                Set a New Password
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Choose a strong password (at least 8 characters).
              </Typography>

              {message && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', textAlign: 'left' }}>
                  {message}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
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
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
