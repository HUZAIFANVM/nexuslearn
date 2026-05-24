import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Avatar, Box, Typography, Alert, CircularProgress,
} from '@mui/material';
import { getDepartments, googleCompleteSignup } from '../../api/auth';

export default function GoogleSignupModal({ open, onClose, googleData, onSuccess }) {
  const [form, setForm] = useState({
    role: 'employee',
    department: '',
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDepartments()
      .then((res) => setDepartments(res.data.departments))
      .catch(() => {});
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.role === 'employee' && !form.department) {
      setError('Please select a department');
      return;
    }

    setLoading(true);
    try {
      const res = await googleCompleteSignup({
        google_id: googleData.google_id,
        email: googleData.email,
        full_name: googleData.name,
        picture: googleData.picture,
        role: form.role,
        department: form.role === 'employee' ? form.department : null,
      });

      onSuccess(res.data.access_token, res.data.user_info);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  if (!googleData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Complete Your Profile
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={googleData.picture}
              alt={googleData.name}
              sx={{ width: 72, height: 72, mb: 1.5 }}
            />
            <Typography variant="subtitle1" fontWeight={600}>
              {googleData.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {googleData.email}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please select your role and department to complete your registration.
          </Typography>

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
              <Select
                value={form.department}
                onChange={handleChange('department')}
                label="Department"
                required
              >
                {departments.map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button onClick={onClose} disabled={loading} sx={{ color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              px: 3,
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              borderRadius: '10px',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Complete Signup'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
