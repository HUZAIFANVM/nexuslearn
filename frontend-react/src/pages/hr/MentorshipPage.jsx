import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Chip, Grid, IconButton, CircularProgress, Alert,
} from '@mui/material';
import { Add, Delete, Diversity3, ArrowForward } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getSuggestions, createMentorship, listMentorships, deleteMentorship } from '../../api/mentorship';
import { fadeInUp } from '../../theme/glass';

const SEV = {
  critical: { bg: '#FEE2E2', color: '#DC2626' },
  moderate: { bg: '#FEF3C7', color: '#92400E' },
  minor: { bg: '#EFF6FF', color: '#3B82F6' },
};

export default function HRMentorshipPage() {
  const theme = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = () => {
    Promise.all([getSuggestions(), listMentorships()])
      .then(([s, a]) => { setSuggestions(s.data); setActive(a.data); })
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const pair = async (s) => {
    setMsg('');
    try {
      await createMentorship({ mentor_id: s.mentor_id, mentee_id: s.mentee_id, skill: s.skill });
      load();
    } catch (e) { setMsg(e.response?.data?.detail || 'Failed to create pairing'); }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress sx={{ color: '#3B82F6' }} /></Box>;

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Mentorship</Typography>
        <Typography variant="body2" color="text.secondary">AI-suggested pairings: a colleague strong in a skill mentors someone with a gap in it (from growth-map data).</Typography>
      </Box>
      {msg && <Alert severity="warning" sx={{ mb: 2 }}>{msg}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card sx={fadeInUp(40)}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Suggested Pairings</Typography>
              {suggestions.length === 0 && <Typography variant="body2" color="text.disabled">No suggestions — employees need growth roadmaps with matching strengths/weaknesses first.</Typography>}
              {suggestions.map((s, i) => {
                const sev = SEV[s.severity] || SEV.moderate;
                return (
                  <Box key={i} display="flex" alignItems="center" gap={1.5} mb={1.5} sx={{ p: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="body2" fontWeight={700} noWrap>{s.mentor_name}</Typography>
                        <ArrowForward sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="body2" noWrap>{s.mentee_name}</Typography>
                      </Box>
                      <Box display="flex" gap={0.5} mt={0.5} alignItems="center">
                        <Chip label={s.skill} size="small" sx={{ height: 20, bgcolor: theme.palette.custom.purpleTint, color: '#7C3AED', fontWeight: 600 }} />
                        <Chip label={s.severity} size="small" sx={{ height: 20, bgcolor: sev.bg, color: sev.color, fontWeight: 700, textTransform: 'capitalize' }} />
                      </Box>
                    </Box>
                    <Button size="small" variant="contained" startIcon={<Add />} onClick={() => pair(s)} sx={{ borderRadius: '999px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>Pair</Button>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={fadeInUp(60)}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Diversity3 sx={{ color: '#8B5CF6' }} />
                <Typography variant="h6" fontWeight={700}>Active Mentorships</Typography>
              </Box>
              {active.length === 0 && <Typography variant="body2" color="text.disabled">None yet.</Typography>}
              {active.map((m) => (
                <Box key={m.id} display="flex" alignItems="center" gap={1} mb={1} sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'action.hover' }}>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600} noWrap>{m.mentor_name} → {m.mentee_name}</Typography>
                    <Chip label={m.skill} size="small" sx={{ height: 18, mt: 0.5, bgcolor: theme.palette.custom.purpleTint, color: '#7C3AED' }} />
                  </Box>
                  <IconButton size="small" onClick={() => deleteMentorship(m.id).then(load)}><Delete fontSize="small" /></IconButton>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
