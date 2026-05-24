import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Tooltip, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Dashboard, Description, SmartToy, Style, Quiz,
  Route, People, MenuBook, AdminPanelSettings, Logout,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { glassNavbar, fadeInUp } from '../../theme/glass';

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

export const RAIL_WIDTH = 68;

export default function IconRail() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const items =
    user?.role === 'super_admin' ? SUPER_ADMIN_NAV :
    user?.role === 'hr' ? HR_NAV :
    EMPLOYEE_NAV;

  return (
    <Box
      component="nav"
      aria-label="Primary navigation"
      sx={{
        position: 'fixed',
        top: 96,                       // sits below the floating top bar
        bottom: 24,
        left: 16,
        width: RAIL_WIDTH,
        zIndex: 90,
        ...glassNavbar(theme),
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 1.25,
        gap: 0.5,
        ...fadeInUp(80),
      }}
    >
      {/* Brand glyph as the rail's "header" — keeps spatial hierarchy without text */}
      <Box
        onClick={() => navigate(items[0]?.path || '/')}
        sx={{
          width: 40, height: 40, borderRadius: '12px',
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer',
          mb: 1.25,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
          '&:hover': {
            transform: 'translateY(-1px) scale(1.05)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.55)',
          },
        }}
      >
        {/* Inline NexusMark-style mini glyph */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <line x1="12" y1="12" x2="19" y2="4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="12" y1="12" x2="4.5" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
          <line x1="12" y1="12" x2="10.8" y2="20.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
          <circle cx="12" cy="12" r="3.4" fill="currentColor" />
          <circle cx="19" cy="4.5" r="2.2" fill="currentColor" />
          <circle cx="4.5" cy="9" r="1.6" fill="currentColor" opacity="0.8" />
          <circle cx="10.8" cy="20.5" r="1.6" fill="currentColor" opacity="0.8" />
        </svg>
      </Box>

      {/* Nav items */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip key={item.path} title={item.label} placement="right" arrow>
              <IconButton
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                sx={{
                  width: 44, height: 44,
                  borderRadius: '12px',
                  color: isActive ? '#fff' : 'text.secondary',
                  background: isActive
                    ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                    : 'transparent',
                  boxShadow: isActive ? '0 4px 14px rgba(99,102,241,0.40)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: isActive
                      ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)'
                      : (t) => t.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(99,102,241,0.10)',
                    color: isActive ? '#fff' : 'text.primary',
                    transform: 'scale(1.05)',
                  },
                  '& .MuiSvgIcon-root': { fontSize: 22 },
                }}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>

      {/* Logout pinned to bottom */}
      <Tooltip title="Logout" placement="right" arrow>
        <IconButton
          onClick={() => { logout(); navigate('/login'); }}
          aria-label="Logout"
          sx={{
            width: 44, height: 44,
            borderRadius: '12px',
            color: 'text.secondary',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#EF4444',
              bgcolor: 'rgba(239,68,68,0.10)',
              transform: 'scale(1.05)',
            },
          }}
        >
          <Logout sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
