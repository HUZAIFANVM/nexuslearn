import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  FormControl, InputLabel, Select, MenuItem, Divider, Avatar, Badge,
} from '@mui/material';
import { CheckCircle, Email, CameraAlt, Person, AutoAwesome } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { signup, getDepartments } from '../../api/auth';
import NexusMark from '../brand/NexusMark';
import { glassCard, auroraBackground } from '../../theme/glass';
import { useAuth } from '../../contexts/AuthContext';
import GoogleButton from './GoogleButton';
import GoogleSignupModal from './GoogleSignupModal';

export default function SignupForm({ embedded = false }) {
  const theme = useTheme();
  const [form, setForm] = useState({ email: '', password: '', confirm_password: '', full_name: '', role: 'employee', department: '' });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Google signup modal state
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleData, setGoogleData] = useState(null);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getDepartments().then((res) => setDepartments(res.data.departments)).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB');
      return;
    }
    setError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { confirm_password, ...payload } = form;
      const res = await signup({ ...payload, profile_picture: avatarFile });
      setSignupEmail(res.data.email);
      // Check if dev mode (auto-verified)
      if (res.data.message.includes('auto-verified')) {
        // Redirect to login directly
        navigate('/login', { state: { message: 'Account created! You can now log in.' } });
      } else {
        setSignupSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (token, userInfo) => {
    loginUser(token, userInfo);
    navigate(userInfo.role === 'hr' ? '/hr/dashboard' : '/employee/dashboard');
  };

  const handleGooglePendingSignup = (data) => {
    setGoogleData(data);
    setGoogleModalOpen(true);
  };

  const handleGoogleError = (message) => {
    setError(message);
  };

  // Success state - show verification message
  if (signupSuccess) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
        sx={{ ...auroraBackground(theme), p: 2 }}
      >
        <Card sx={{
          ...glassCard(theme),
          width: 440, p: 2, borderRadius: '24px',
        }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <NexusMark size={20} style={{ color: '#fff' }} />
              </Box>
            </Box>

            <Box sx={{
              width: 72, height: 72, borderRadius: '50%', bgcolor: theme.palette.custom.greenTint,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
            }}>
              <Email sx={{ fontSize: 36, color: '#10B981' }} />
            </Box>

            <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>
              Check Your Email
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              We've sent a verification link to<br />
              <strong style={{ color: 'inherit' }}>{signupEmail}</strong>
            </Typography>

            <Alert severity="info" sx={{ mb: 2, borderRadius: '10px', textAlign: 'left' }}>
              Click the link in the email to verify your account. The link will expire in 24 hours.
            </Alert>

            <Button
              component={Link}
              to="/login"
              variant="contained"
              fullWidth
              sx={{
                py: 1.3,
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                borderRadius: '10px', fontSize: '0.95rem',
                '&:hover': { background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' },
              }}
            >
              Back to Login
            </Button>

            <Typography variant="body2" color="text.disabled" sx={{ mt: 2, fontSize: '0.8rem' }}>
              Didn't receive the email? Check your spam folder or try signing up again.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1, mt: 1 }}>
          <label htmlFor="avatar-upload" style={{ cursor: 'pointer' }}>
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png"
              hidden
              onChange={handleAvatarChange}
            />
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box sx={{
                  width: 26, height: 26, borderRadius: '50%',
                  bgcolor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #fff',
                }}>
                  <CameraAlt sx={{ fontSize: 14, color: '#fff' }} />
                </Box>
              }
            >
              <Avatar
                src={avatarPreview}
                sx={{
                  width: 72, height: 72,
                  bgcolor: 'action.hover',
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.8 },
                }}
              >
                {!avatarPreview && <Person sx={{ fontSize: 36, color: 'text.disabled' }} />}
              </Avatar>
            </Badge>
          </label>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
            Profile picture (optional)
          </Typography>
        </Box>
        <TextField fullWidth label="Full Name" value={form.full_name} onChange={handleChange('full_name')} margin="normal" required placeholder="John Smith" />
        <TextField fullWidth label="Work Email" type="email" value={form.email} onChange={handleChange('email')} margin="normal" required placeholder="john@company.com" />
        <TextField fullWidth label="Password" type="password" value={form.password} onChange={handleChange('password')} margin="normal" required />
        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          value={form.confirm_password}
          onChange={handleChange('confirm_password')}
          margin="normal"
          required
          error={form.confirm_password.length > 0 && form.password !== form.confirm_password}
          helperText={
            form.confirm_password.length > 0 && form.password !== form.confirm_password
              ? 'Passwords do not match'
              : ' '
          }
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select value={form.role} onChange={handleChange('role')} label="Role">
            <MenuItem value="employee">Team Member</MenuItem>
            <MenuItem value="hr">HR Administrator</MenuItem>
          </Select>
        </FormControl>
        {form.role === 'employee' && (
          <FormControl fullWidth margin="normal">
            <InputLabel>Department</InputLabel>
            <Select value={form.department} onChange={handleChange('department')} label="Department" required>
              {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        <Button
          fullWidth variant="contained" type="submit" disabled={loading}
          sx={{
            mt: 2.5, mb: 1, py: 1.3,
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            borderRadius: '10px', fontSize: '0.95rem',
            '&:hover': { background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' },
          }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <Divider sx={{ my: 2, color: 'text.disabled', fontSize: '0.8rem' }}>or</Divider>

      <GoogleButton
        onSuccess={handleGoogleSuccess}
        onPendingSignup={handleGooglePendingSignup}
        onError={handleGoogleError}
        mode="signup"
      />

      {!embedded && (
        <Typography textAlign="center" variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
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
        width: 440, p: 2, borderRadius: '24px',
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AutoAwesome sx={{ fontSize: 20, color: '#fff' }} />
            </Box>
          </Box>
          <Typography variant="h5" textAlign="center" mb={0.5} fontWeight={700} color="text.primary">
            Join NexusLearn
          </Typography>
          <Typography variant="body2" textAlign="center" mb={3} color="text.secondary">
            Create your enterprise learning account
          </Typography>
          {formContent}
        </CardContent>
      </Card>
    </Box>
  );
}
