import { useState } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip, Avatar } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import { getAvatarUrl } from '../../api/auth';
import NotificationBell from '../notifications/NotificationBell';
import ProfileDialog from '../profile/ProfileDialog';
import { glassNavbar, fadeInUp } from '../../theme/glass';
import { RAIL_WIDTH } from './IconRail';

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  hr: 'HR Administrator',
  employee: 'Team Member',
};

export default function TopBar() {
  const theme = useTheme();
  const { user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [profileOpen, setProfileOpen] = useState(false);
  const avatarSrc = user?.id ? getAvatarUrl(user.id) : null;

  return (
    <>
      <Box
        component="header"
        role="banner"
        sx={{
          position: 'fixed',
          top: 16,
          left: { xs: 16, md: RAIL_WIDTH + 32 },
          right: 16,
          zIndex: 95,
          ...glassNavbar(theme),
          borderRadius: '999px',
          height: 56,
          px: { xs: 2, md: 3 },
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          ...fadeInUp(0),
        }}
      >
        {/* Role chip */}
        <Chip
          label={ROLE_LABEL[user?.role] || 'Member'}
          size="small"
          sx={{
            bgcolor: (t) => t.palette.mode === 'dark'
              ? 'rgba(99,102,241,0.18)'
              : 'rgba(99,102,241,0.10)',
            color: (t) => t.palette.mode === 'dark' ? '#A78BFA' : '#6366F1',
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: '0.04em',
            height: 26,
            borderRadius: '8px',
            border: (t) => t.palette.mode === 'dark'
              ? '1px solid rgba(167,139,250,0.30)'
              : '1px solid rgba(99,102,241,0.25)',
          }}
        />

        {/* Greeting — only when there's room */}
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            display: { xs: 'none', md: 'block' },
            ml: 0.5,
          }}
        >
          Welcome back,{' '}
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>
            {(user?.full_name || user?.email || '').split(' ')[0] || 'there'}
          </Box>
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* Theme toggle */}
        <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} arrow>
          <IconButton
            onClick={toggleTheme}
            size="small"
            sx={{
              color: 'text.secondary',
              width: 36, height: 36,
              transition: 'all 0.2s ease',
              '&:hover': {
                color: mode === 'dark' ? '#F59E0B' : '#3B82F6',
                bgcolor: mode === 'dark' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.10)',
                transform: 'rotate(8deg)',
              },
            }}
          >
            {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <NotificationBell />

        {/* Avatar — opens ProfileDialog */}
        <Tooltip title="Profile" arrow>
          <Box
            onClick={() => setProfileOpen(true)}
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'scale(1.06)' },
            }}
          >
            <Avatar
              src={avatarSrc}
              sx={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                fontSize: 14,
                fontWeight: 700,
                border: '2px solid',
                borderColor: (t) => t.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.10)'
                  : 'rgba(255,255,255,0.7)',
                boxShadow: '0 4px 12px rgba(99,102,241,0.30)',
              }}
              imgProps={{ onError: (e) => { e.target.style.display = 'none'; } }}
            >
              {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </Box>
        </Tooltip>
      </Box>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
