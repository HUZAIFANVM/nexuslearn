import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Avatar, Button, Box, Typography,
  IconButton, Alert, CircularProgress, Divider, Chip,
} from '@mui/material';
import { Close, CameraAlt, Delete, Person } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { uploadAvatar, deleteAvatar, getAvatarUrl } from '../../api/auth';

export default function ProfileDialog({ open, onClose }) {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarKey, setAvatarKey] = useState(Date.now());

  const hasAvatar = !!user?.profile_picture;
  const avatarSrc = user?.id ? `${getAvatarUrl(user.id)}?t=${avatarKey}` : null;

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG images are allowed');
      setSuccess('');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const res = await uploadAvatar(file);
      updateUser({ profile_picture: res.data.profile_picture });
      setAvatarKey(Date.now());
      setSuccess('Profile picture updated!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      await deleteAvatar();
      updateUser({ profile_picture: null });
      setAvatarKey(Date.now());
      setSuccess('Profile picture removed');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '20px', overflow: 'hidden' },
      }}
    >
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        px: 3, py: 2.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography variant="h6" fontWeight={700} color="#fff">
          Profile Settings
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, textAlign: 'center' }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>{success}</Alert>}

        {/* Avatar */}
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 2, mt: 1 }}>
          <Avatar
            key={avatarKey}
            src={hasAvatar ? avatarSrc : undefined}
            sx={{
              width: 120, height: 120,
              fontSize: 48, fontWeight: 700,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              border: 4, borderColor: 'divider',
            }}
            imgProps={{
              onError: (e) => { e.target.style.display = 'none'; },
            }}
          >
            {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          {uploading && (
            <Box sx={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.4)', borderRadius: '50%',
            }}>
              <CircularProgress size={36} sx={{ color: '#fff' }} />
            </Box>
          )}
        </Box>

        {/* User info */}
        <Typography variant="h6" fontWeight={700} color="text.primary">
          {user?.full_name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {user?.email}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2.5 }}>
          <Chip
            label={user?.role === 'hr' ? 'HR Administrator' : 'Team Member'}
            size="small"
            sx={{
              bgcolor: 'rgba(59,130,246,0.1)', color: '#3B82F6',
              fontWeight: 600, fontSize: '0.75rem',
            }}
          />
          {user?.department && (
            <Chip
              label={user.department}
              size="small"
              sx={{
                bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981',
                fontWeight: 600, fontSize: '0.75rem',
              }}
            />
          )}
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <label htmlFor="profile-avatar-upload" style={{ width: '100%' }}>
            <input
              id="profile-avatar-upload"
              type="file"
              accept="image/jpeg,image/png"
              hidden
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <Button
              component="span"
              variant="contained"
              fullWidth
              startIcon={<CameraAlt />}
              disabled={uploading}
              sx={{
                py: 1.2,
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                borderRadius: '10px',
                '&:hover': { background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' },
              }}
            >
              {hasAvatar ? 'Change Photo' : 'Upload Photo'}
            </Button>
          </label>

          {hasAvatar && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Delete />}
              onClick={handleRemove}
              disabled={uploading}
              sx={{
                py: 1.2, borderRadius: '10px',
                color: '#EF4444', borderColor: '#FCA5A5',
                '&:hover': { bgcolor: 'rgba(239,68,68,0.05)', borderColor: '#EF4444' },
              }}
            >
              Remove Photo
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
