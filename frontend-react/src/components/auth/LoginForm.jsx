import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { login, resendVerification } from '../../api/auth';
import NexusMark from '../brand/NexusMark';
import { glassCard, auroraBackground } from '../../theme/glass';
import { useAuth } from '../../contexts/AuthContext';
import GoogleButton from './GoogleButton';
import GoogleSignupModal from './GoogleSignupModal';
import { homeForRole } from './ProtectedRoute';

export default function LoginForm({ embedded = false }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Google signup modal state
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleData, setGoogleData] = useState(null);

  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setLoading(true);
    try {
      const res = await login(email, password);
      loginUser(res.data.access_token, res.data.user_info);
      navigate(homeForRole(res.data.user_info.role));
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed';
      if (err.response?.status === 403 && detail.includes('verify')) {
        setNeedsVerification(true);
        setVerificationEmail(email);
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await resendVerification(verificationEmail);
      setResendSuccess(true);
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Please wait 2 minutes before requesting another email');
      } else {
        setError(err.response?.data?.detail || 'Failed to resend verification email');
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSuccess = (token, userInfo) => {
    loginUser(token, userInfo);
    navigate(homeForRole(userInfo.role));
  };

  const handleGooglePendingSignup = (data) => {
    setGoogleData(data);
    setGoogleModalOpen(true);
  };

  const handleGoogleError = (message) => {
    setError(message);
  };

  const formContent = (
    <>
      {successMessage && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>{successMessage}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}

      {needsVerification && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: '10px' }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleResendVerification}
              disabled={resendLoading || resendSuccess}
            >
              {resendLoading ? 'Sending...' : resendSuccess ? 'Sent!' : 'Resend'}
            </Button>
          }
        >
          Please verify your email before logging in. Check your inbox for the verification link.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth label="Email address" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} margin="normal" required
          placeholder="you@company.com"
        />
        <TextField
          fullWidth label="Password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} margin="normal" required
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
          <Link
            to="/forgot-password"
            style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}
          >
            Forgot password?
          </Link>
        </Box>
        <Button
          fullWidth variant="contained" type="submit" disabled={loading}
          sx={{
            mt: 2.5, mb: 1, py: 1.3,
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            borderRadius: '10px', fontSize: '0.95rem',
            '&:hover': { background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' },
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <Divider sx={{ my: 2, color: 'text.disabled', fontSize: '0.8rem' }}>or</Divider>

      <GoogleButton
        onSuccess={handleGoogleSuccess}
        onPendingSignup={handleGooglePendingSignup}
        onError={handleGoogleError}
        mode="login"
      />

      {!embedded && (
        <Typography textAlign="center" variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
            Create Account
          </Link>
        </Typography>
      )}

      <GoogleSignupModal
        open={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        googleData={googleData}
        onSuccess={handleGoogleSuccess}
      />
    </>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
      sx={{ ...auroraBackground(theme), p: 2 }}
    >
      <Card sx={{
        ...glassCard(theme),
        width: 420, p: 2, borderRadius: '24px',
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}>
              <NexusMark size={20} />
            </Box>
          </Box>
          <Typography variant="h5" textAlign="center" mb={0.5} fontWeight={700} color="text.primary">
            Welcome Back
          </Typography>
          <Typography variant="body2" textAlign="center" mb={2} color="text.secondary">
            Sign in to your NexusLearn account
          </Typography>
          {formContent}
        </CardContent>
      </Card>
    </Box>
  );
}
