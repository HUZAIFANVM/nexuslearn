import { useState, useEffect, useCallback } from 'react';
import {
  IconButton, Badge, Popover, Box, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, Button, Chip, CircularProgress,
} from '@mui/material';
import {
  Notifications, NotificationsNone, Quiz, Style, SmartToy,
  Description, MenuBook, DoneAll, Circle,
} from '@mui/icons-material';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../api/notifications';

const typeConfig = {
  new_assessment: { icon: <Quiz sx={{ fontSize: 20 }} />, color: '#8B5CF6' },
  new_flashcard_set: { icon: <Style sx={{ fontSize: 20 }} />, color: '#3B82F6' },
  new_chatbot: { icon: <SmartToy sx={{ fontSize: 20 }} />, color: '#10B981' },
  new_document: { icon: <Description sx={{ fontSize: 20 }} />, color: '#F59E0B' },
  new_sop: { icon: <MenuBook sx={{ fontSize: 20 }} />, color: '#EF4444' },
};

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleOpen = async (e) => {
    setAnchorEl(e.currentTarget);
    setLoading(true);
    try {
      const { data } = await getNotifications(0, 20);
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {
      // silent
    }
    setLoading(false);
  };

  const handleClose = () => setAnchorEl(null);

  const handleRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          color: 'text.secondary',
          width: 36, height: 36,
          transition: 'transform 0.2s ease, color 0.2s ease, background-color 0.2s ease',
          '&:hover': {
            color: '#8B5CF6',
            bgcolor: 'rgba(139,92,246,0.10)',
            transform: unreadCount > 0 ? 'rotate(8deg)' : 'scale(1.06)',
          },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.65rem',
              height: 18,
              minWidth: 18,
              fontWeight: 700,
              boxShadow: '0 0 0 2px rgba(255,255,255,0.5)',
            },
          }}
        >
          {unreadCount > 0 ? (
            <Notifications sx={{ fontSize: 20 }} />
          ) : (
            <NotificationsNone sx={{ fontSize: 20 }} />
          )}
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 380,
              maxHeight: 480,
              borderRadius: '18px',
              mt: 1,
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: 1, borderColor: 'divider',
          background: (t) => t.palette.mode === 'dark'
            ? 'linear-gradient(90deg, rgba(99,102,241,0.10), rgba(139,92,246,0.10))'
            : 'linear-gradient(90deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '0.95rem' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="error"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
              />
            )}
          </Box>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAll sx={{ fontSize: 16 }} />}
              onClick={handleReadAll}
              sx={{ fontSize: '0.75rem', textTransform: 'none', color: '#3B82F6' }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <NotificationsNone sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 380, overflow: 'auto' }}>
            {notifications.map((n, idx) => {
              const config = typeConfig[n.type] || { icon: <Notifications sx={{ fontSize: 20 }} />, color: '#64748B' };
              return (
                <Box key={n.id}>
                  <ListItemButton
                    onClick={() => !n.is_read && handleRead(n.id)}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      bgcolor: n.is_read ? 'transparent' : 'rgba(59,130,246,0.04)',
                      '&:hover': { bgcolor: n.is_read ? 'action.hover' : 'rgba(59,130,246,0.08)' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '8px',
                        bgcolor: `${config.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: config.color,
                      }}>
                        {config.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {!n.is_read && <Circle sx={{ fontSize: 8, color: '#3B82F6' }} />}
                          <Typography variant="body2" fontWeight={n.is_read ? 400 : 600} sx={{ fontSize: '0.82rem' }}>
                            {n.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', lineHeight: 1.4 }}>
                            {n.message}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.disabled', mt: 0.3, display: 'block' }}>
                            {timeAgo(n.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                  {idx < notifications.length - 1 && <Divider sx={{ mx: 2 }} />}
                </Box>
              );
            })}
          </List>
        )}
      </Popover>
    </>
  );
}
