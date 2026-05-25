import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, IconButton, Tooltip, Avatar,
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import {
  LightMode, DarkMode, Menu as MenuIcon,
  Dashboard, Description, SmartToy, Style, Quiz,
  Route, People, MenuBook, AdminPanelSettings, Logout,
} from '@mui/icons-material';
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

// Same nav structure as IconRail — duplicated here so the mobile drawer doesn't
// depend on the rail being mounted. If you change one, change both.
const HR_NAV = [
  { label: 'Command Center', icon: <Dashboard />, path: '/hr/dashboard' },
  { label: 'Resource Library', icon: <Description />, path: '/hr/documents' },
  { label: 'Knowledge Assistants', icon: <SmartToy />, path: '/hr/chatbots' },
  { label: 'Retention Training', icon: <Style />, path: '/hr/flashcards' },
  { label: 'Competency Evaluations', icon: <Quiz />, path: '/hr/assessments' },
  { label: 'SOP of the Day', icon: <MenuBook />, path: '/hr/sop-of-the-day' },
  { label: 'Employee Management', icon: <People />, path: '/hr/employees' },
];
const EMPLOYEE_NAV = [
  { label: 'My Dashboard', icon: <Dashboard />, path: '/employee/dashboard' },
  { label: 'AI Knowledge Hub', icon: <SmartToy />, path: '/employee/chat' },
  { label: 'Retention Training', icon: <Style />, path: '/employee/flashcards' },
  { label: 'Competency Check', icon: <Quiz />, path: '/employee/assessments' },
  { label: 'Growth Roadmap', icon: <Route />, path: '/employee/learning-path' },
];
const SUPER_ADMIN_NAV = [
  { label: 'HR Approvals', icon: <AdminPanelSettings />, path: '/admin/pending-hrs' },
];

export default function TopBar() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const avatarSrc = user?.id ? getAvatarUrl(user.id) : null;

  const navItems =
    user?.role === 'super_admin' ? SUPER_ADMIN_NAV :
    user?.role === 'hr' ? HR_NAV :
    EMPLOYEE_NAV;

  const handleNavClick = (path) => {
    navigate(path);
    setMobileNavOpen(false);
  };

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
          px: { xs: 1.25, md: 3 },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.75, md: 1.5 },
          ...fadeInUp(0),
        }}
      >
        {/* Mobile-only hamburger to open the nav drawer */}
        <Tooltip title="Menu" arrow>
          <IconButton
            onClick={() => setMobileNavOpen(true)}
            size="small"
            aria-label="Open navigation menu"
            sx={{
              display: { xs: 'flex', md: 'none' },
              color: 'text.secondary',
              width: 36, height: 36,
              '&:hover': { color: '#3B82F6', bgcolor: 'rgba(59,130,246,0.10)' },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Role chip — hidden on the smallest screens to make room */}
        <Chip
          label={ROLE_LABEL[user?.role] || 'Member'}
          size="small"
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
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

      {/* Mobile nav drawer — same items as IconRail but shown only on mobile */}
      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 260,
            ...glassNavbar(theme),
            borderRight: '1px solid',
            borderColor: (t) => t.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.6)',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="12" x2="19" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="12" x2="4.5" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
              <line x1="12" y1="12" x2="10.8" y2="20.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
              <circle cx="12" cy="12" r="3.4" fill="currentColor" />
              <circle cx="19" cy="4.5" r="2.2" fill="currentColor" />
              <circle cx="4.5" cy="9" r="1.6" fill="currentColor" opacity="0.8" />
              <circle cx="10.8" cy="20.5" r="1.6" fill="currentColor" opacity="0.8" />
            </svg>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={700} color="text.primary">NexusLearn</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {ROLE_LABEL[user?.role] || 'Member'}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <List sx={{ p: 1, flex: 1, overflow: 'auto' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: '12px',
                  mb: 0.5,
                  background: active
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.18) 100%)'
                    : 'transparent',
                  color: active ? 'text.primary' : 'text.secondary',
                  fontWeight: active ? 700 : 500,
                  '&:hover': {
                    background: active
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(139,92,246,0.22) 100%)'
                      : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: active ? '#6366F1' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: active ? 700 : 500 }} />
              </ListItemButton>
            );
          })}
        </List>
        <Divider />
        <ListItemButton
          onClick={() => { logout(); navigate('/login'); setMobileNavOpen(false); }}
          sx={{
            m: 1.25,
            borderRadius: '12px',
            color: 'text.secondary',
            '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.10)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}><Logout /></ListItemIcon>
          <ListItemText primary="Log out" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
        </ListItemButton>
      </Drawer>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
