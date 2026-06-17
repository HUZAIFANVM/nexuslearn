import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, Grid, CircularProgress } from '@mui/material';
import { Diversity3, School, EmojiPeople } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getMyMentorships } from '../../api/mentorship';
import { fadeInUp, glassShineHover } from '../../theme/glass';

export default function EmployeeMentorshipPage() {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyMentorships().then((r) => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress sx={{ color: '#3B82F6' }} /></Box>;

  const asMentor = items.filter((m) => m.role === 'mentor');
  const asMentee = items.filter((m) => m.role === 'mentee');

  const Section = ({ title, icon, list, emptyText, who }) => (
    <Grid item xs={12} md={6}>
      <Card sx={fadeInUp(40)}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>{icon}<Typography variant="h6" fontWeight={700}>{title}</Typography></Box>
          {list.length === 0 && <Typography variant="body2" color="text.disabled">{emptyText}</Typography>}
          {list.map((m) => (
            <Box key={m.id} sx={{ ...glassShineHover, p: 2, mb: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={700}>{who === 'mentor' ? m.mentee_name : m.mentor_name}</Typography>
              <Typography variant="caption" color="text.disabled">{who === 'mentor' ? 'You mentor them on' : 'Mentoring you on'}</Typography>
              <Box mt={0.5}><Chip label={m.skill} size="small" sx={{ bgcolor: theme.palette.custom.purpleTint, color: '#7C3AED', fontWeight: 600 }} /></Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Mentorship</Typography>
        <Typography variant="body2" color="text.secondary">Your mentoring relationships, matched to real skill strengths and gaps.</Typography>
      </Box>
      {items.length === 0 ? (
        <Card><CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Diversity3 sx={{ fontSize: 40, color: '#94A3B8', mb: 1 }} />
          <Typography variant="h6" fontWeight={600}>No mentorships yet</Typography>
          <Typography variant="body2" color="text.disabled">Your HR team will pair you with a mentor or mentee based on your growth roadmap.</Typography>
        </CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          <Section title="You're Mentoring" icon={<School sx={{ color: '#10B981' }} />} list={asMentor} who="mentor" emptyText="You're not mentoring anyone yet." />
          <Section title="Your Mentors" icon={<EmojiPeople sx={{ color: '#3B82F6' }} />} list={asMentee} who="mentee" emptyText="No mentor assigned yet." />
        </Grid>
      )}
    </Box>
  );
}
