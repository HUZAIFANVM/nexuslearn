import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, Box, Typography, Button, IconButton,
} from '@mui/material';
import { Bolt, Close, MailOutline, WorkspacePremium } from '@mui/icons-material';

/**
 * Global, graceful "AI limit reached" dialog. Shows when any request hits the
 * Groq usage cap (the axios interceptor dispatches an `ai-limit-reached` event).
 * Offers a friendly message + "contact administrator" + an upgrade placeholder.
 */
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';

export default function AiLimitDialog() {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const handler = (e) => { setInfo(e.detail); setOpen(true); };
    window.addEventListener('ai-limit-reached', handler);
    return () => window.removeEventListener('ai-limit-reached', handler);
  }, []);

  const close = () => setOpen(false);
  const message = info?.message
    || "You've reached the AI usage limit for now. Please try again later.";

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '22px', overflow: 'hidden' } }}>
      <Box sx={{
        background: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 60%, #8B5CF6 100%)',
        color: '#fff', px: 3, py: 2.5, position: 'relative',
      }}>
        <IconButton onClick={close} sx={{ position: 'absolute', top: 10, right: 10, color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}>
          <Close fontSize="small" />
        </IconButton>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
          <Bolt />
        </Box>
        <Typography variant="h6" fontWeight={700}>AI limit reached</Typography>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>
          {message}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          <Button
            fullWidth variant="contained" startIcon={<WorkspacePremium />} disabled
            sx={{ borderRadius: '12px', background: 'linear-gradient(135deg,#8B5CF6,#6366F1)', '&.Mui-disabled': { color: 'rgba(255,255,255,0.85)', background: 'linear-gradient(135deg,#8B5CF6,#6366F1)', opacity: 0.55 } }}
          >
            Upgrade for more — coming soon
          </Button>
          {SUPPORT_EMAIL ? (
            <Button
              fullWidth variant="outlined" startIcon={<MailOutline />}
              href={`mailto:${SUPPORT_EMAIL}?subject=NexusLearn — raise my AI limit`}
              sx={{ borderRadius: '12px', borderColor: 'divider', color: 'text.secondary' }}
            >
              Contact administrator
            </Button>
          ) : (
            <Typography variant="caption" color="text.disabled" textAlign="center">
              Need more now? Contact your administrator.
            </Typography>
          )}
          <Button fullWidth onClick={close} sx={{ color: 'text.secondary' }}>Dismiss</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
