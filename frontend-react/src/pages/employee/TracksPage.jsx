import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, LinearProgress, Chip, CircularProgress, Grid,
} from '@mui/material';
import {
  CheckCircle, RadioButtonUnchecked, Lock, Description, Style, Quiz, Route as RouteIcon, ArrowBack,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { listTracks, getTrack, completeTrackStep } from '../../api/tracks';
import { downloadDocument } from '../../api/documents';
import { fadeInUp, glassShineHover, brandPillButton } from '../../theme/glass';

const TYPE_META = {
  document: { icon: <Description sx={{ fontSize: 18 }} />, label: 'Document', route: null },
  flashcard_set: { icon: <Style sx={{ fontSize: 18 }} />, label: 'Training', route: '/employee/flashcards' },
  assessment: { icon: <Quiz sx={{ fontSize: 18 }} />, label: 'Evaluation', route: '/employee/assessments' },
};

export default function EmployeeTracksPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTracks().then((r) => setTracks(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openTrack = (id) => getTrack(id).then((r) => setActive(r.data)).catch(() => {});
  const openDoc = async (rid) => {
    try {
      const res = await downloadDocument(rid);
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      await completeTrackStep(rid);
      openTrack(active.id);
    } catch {
      alert('Could not open this document. It may have been removed.');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress sx={{ color: '#3B82F6' }} /></Box>;

  // Detail view
  if (active) {
    let firstIncomplete = active.steps.findIndex((s) => !s.done);
    return (
      <Box maxWidth={760} mx="auto">
        <Button startIcon={<ArrowBack />} onClick={() => setActive(null)} sx={{ color: 'text.secondary', mb: 2 }}>Back to tracks</Button>
        <Typography variant="h4" fontWeight={700} mb={0.5}>{active.name}</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>{active.description}</Typography>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2" fontWeight={600}>{active.completed} / {active.total}</Typography>
          <Typography variant="body2" fontWeight={700} color={active.percentage === 100 ? '#10B981' : '#3B82F6'}>{active.percentage}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={active.percentage} sx={{ height: 8, borderRadius: 4, mb: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 4, background: active.percentage === 100 ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg,#3B82F6,#8B5CF6)' } }} />

        {active.steps.map((s, i) => {
          const meta = TYPE_META[s.type] || TYPE_META.document;
          const locked = !s.done && i !== firstIncomplete; // sequential unlock
          return (
            <Card key={`${s.resource_id}-${i}`} sx={{ mb: 1.5, borderLeft: '4px solid', borderLeftColor: s.done ? '#10B981' : locked ? 'divider' : '#3B82F6', opacity: locked ? 0.55 : 1 }}>
              <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                {s.done ? <CheckCircle sx={{ color: '#10B981' }} /> : locked ? <Lock sx={{ color: 'text.disabled' }} /> : <RadioButtonUnchecked sx={{ color: '#3B82F6' }} />}
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip icon={meta.icon} label={meta.label} size="small" sx={{ height: 22, bgcolor: 'action.hover', '& .MuiChip-icon': { color: 'text.secondary' } }} />
                    <Typography variant="body2" fontWeight={600} noWrap>{s.title}</Typography>
                  </Box>
                </Box>
                {!s.done && !locked && (
                  meta.route
                    ? <Button size="small" variant="outlined" onClick={() => navigate(meta.route)} sx={{ borderRadius: '999px' }}>Open</Button>
                    : <Button size="small" variant="contained" onClick={() => openDoc(s.resource_id)} sx={{ ...brandPillButton, py: 0.5 }}>Open</Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  }

  // List view
  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Learning Tracks</Typography>
        <Typography variant="body2" color="text.secondary">Guided courses that sequence your training step by step.</Typography>
      </Box>
      <Grid container spacing={2}>
        {tracks.map((t, idx) => (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <Card sx={{ ...fadeInUp(idx * 40), ...glassShineHover }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: theme.palette.custom.blueTint, color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}><RouteIcon /></Box>
                <Typography variant="body2" fontWeight={700} noWrap>{t.name}</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1.5 }}>{t.item_count} items</Typography>
                <LinearProgress variant="determinate" value={t.percentage} sx={{ height: 6, borderRadius: 3, mb: 1.5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 3, background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)' } }} />
                <Button fullWidth variant="contained" size="small" onClick={() => openTrack(t.id)} sx={{ ...brandPillButton, py: 0.75 }}>
                  {t.percentage === 100 ? 'Review' : t.percentage > 0 ? 'Continue' : 'Start'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {tracks.length === 0 && (
          <Grid item xs={12}><Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: '16px', border: '2px dashed', borderColor: 'divider' }}>
            <RouteIcon sx={{ fontSize: 32, color: '#94A3B8', mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>No learning tracks yet</Typography>
            <Typography variant="body2" color="text.disabled">Your HR team will publish guided tracks here.</Typography>
          </Box></Grid>
        )}
      </Grid>
    </Box>
  );
}
