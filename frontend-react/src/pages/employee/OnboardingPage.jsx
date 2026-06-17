import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, LinearProgress, Chip, CircularProgress,
} from '@mui/material';
import {
  CheckCircle, RadioButtonUnchecked, Description, Style, Quiz, RocketLaunch,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getMyOnboarding, completeOnboardingStep } from '../../api/onboarding';
import { downloadDocument } from '../../api/documents';
import { fadeInUp, brandPillButton } from '../../theme/glass';

const TYPE_META = {
  document: { icon: <Description sx={{ fontSize: 18 }} />, label: 'Document', route: null },
  flashcard_set: { icon: <Style sx={{ fontSize: 18 }} />, label: 'Training', route: '/employee/flashcards' },
  assessment: { icon: <Quiz sx={{ fontSize: 18 }} />, label: 'Evaluation', route: '/employee/assessments' },
};

export default function EmployeeOnboardingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getMyOnboarding().then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Open a document step: fetch the file (auth'd), open it, then mark complete.
  const openDoc = async (resourceId) => {
    try {
      const res = await downloadDocument(resourceId);
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      await completeOnboardingStep(resourceId);
      load();
    } catch {
      alert('Could not open this document. It may have been removed.');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress sx={{ color: '#3B82F6' }} /></Box>;

  if (!data?.has_path) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} mb={0.5}>Onboarding</Typography>
        <Card sx={{ mt: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <RocketLaunch sx={{ fontSize: 40, color: '#94A3B8', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} mb={0.5}>No onboarding path assigned</Typography>
            <Typography variant="body2" color="text.disabled">Your HR team hasn't set up an onboarding path for your role/department yet.</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const done = data.percentage === 100;

  return (
    <Box maxWidth={760} mx="auto">
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>{data.title}</Typography>
        <Typography variant="body2" color="text.secondary">Complete these steps to get up to speed.</Typography>
      </Box>

      <Card sx={{ mb: 3, ...fadeInUp(40) }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" fontWeight={600}>{data.completed} / {data.total} complete</Typography>
            <Typography variant="body2" fontWeight={700} color={done ? '#10B981' : '#3B82F6'}>{data.percentage}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={data.percentage} sx={{
            height: 8, borderRadius: 4, bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { borderRadius: 4, background: done ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg,#3B82F6,#8B5CF6)' },
          }} />
          {done && <Typography variant="body2" color="#10B981" fontWeight={600} mt={1.5}>🎉 Onboarding complete — welcome aboard!</Typography>}
        </CardContent>
      </Card>

      {data.steps.map((s, i) => {
        const meta = TYPE_META[s.type] || TYPE_META.document;
        return (
          <Card key={`${s.resource_id}-${i}`} sx={{ mb: 1.5, ...fadeInUp(60 + i * 30), borderLeft: '4px solid', borderLeftColor: s.done ? '#10B981' : 'divider' }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              {s.done
                ? <CheckCircle sx={{ color: '#10B981' }} />
                : <RadioButtonUnchecked sx={{ color: 'text.disabled' }} />}
              <Box flex={1} minWidth={0}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip icon={meta.icon} label={meta.label} size="small" sx={{ height: 22, bgcolor: 'action.hover', '& .MuiChip-icon': { color: 'text.secondary' } }} />
                  <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>{s.title}</Typography>
                </Box>
              </Box>
              {!s.done && (
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
