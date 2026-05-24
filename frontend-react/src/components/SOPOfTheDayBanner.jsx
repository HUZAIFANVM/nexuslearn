import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, IconButton, Typography, Box, Chip, Divider,
} from '@mui/material';
import {
  Close, MenuBook, LightbulbOutlined, CheckCircleOutline, TipsAndUpdates,
} from '@mui/icons-material';
import { getActiveSOPOfTheDay, dismissSOPOfTheDay } from '../api/sopOfTheDay';

export default function SOPOfTheDayBanner() {
  const [sop, setSop] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getActiveSOPOfTheDay()
      .then((res) => {
        if (res.data) {
          setSop(res.data);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    setOpen(false);
    if (sop?.id) {
      dismissSOPOfTheDay(sop.id).catch(() => {});
    }
  };

  if (!sop) return null;

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '22px',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header with brand gradient */}
      <Box sx={{
        background: (t) => t.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 60%, rgba(51,65,85,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(245,158,11,0.95) 0%, rgba(249,115,22,0.95) 60%, rgba(220,38,38,0.92) 100%)',
        color: '#fff',
        px: 3,
        py: 2.5,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: -30, right: -30, width: 150, height: 150,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -20, right: 60, width: 100, height: 100,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
        }} />

        <IconButton
          onClick={handleDismiss}
          sx={{
            position: 'absolute', top: 12, right: 12,
            color: 'rgba(255,255,255,0.5)',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <Close />
        </IconButton>

        <Box position="relative" zIndex={1}>
          <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '12px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MenuBook sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Chip
              label="SOP of the Day"
              size="small"
              sx={{
                bgcolor: 'rgba(245,158,11,0.2)',
                color: '#FCD34D',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: '8px',
              }}
            />
          </Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.3}>
            {sop.title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5, display: 'block' }}>
            Source: {sop.document_name}
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {/* Summary */}
        <Box sx={{
          p: 2.5, borderRadius: '14px', bgcolor: 'background.default',
          border: 1, borderColor: 'divider', mb: 2.5,
        }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <LightbulbOutlined sx={{ fontSize: 18, color: '#F59E0B' }} />
            <Typography variant="body2" fontWeight={700} color="text.primary">
              Overview
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
            {sop.summary}
          </Typography>
        </Box>

        {/* Key Points */}
        <Typography variant="body2" fontWeight={700} color="text.primary" mb={1.5}>
          Key Points
        </Typography>
        <Box display="flex" flexDirection="column" gap={1.5} mb={2.5}>
          {sop.key_points?.map((point, i) => (
            <Box key={i} display="flex" gap={1.5} alignItems="flex-start">
              <CheckCircleOutline sx={{ fontSize: 18, color: '#10B981', mt: 0.2, flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                {point}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* Practical Tip */}
        <Box sx={{
          p: 2.5, borderRadius: '14px',
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: '1px solid #FDE68A',
        }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <TipsAndUpdates sx={{ fontSize: 18, color: '#D97706' }} />
            <Typography variant="body2" fontWeight={700} color="#92400E">
              Today's Tip
            </Typography>
          </Box>
          <Typography variant="body2" color="#78350F" lineHeight={1.6}>
            {sop.practical_tip}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
