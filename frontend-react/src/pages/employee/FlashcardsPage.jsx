import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  LinearProgress, CircularProgress, Avatar,
} from '@mui/material';
import { Style, EmojiEvents, School, AutoAwesome, ArrowBack, LayersOutlined, AccessTime } from '@mui/icons-material';
import { fadeInUp, brandPillButton, glassShineHover } from '../../theme/glass';
import { useTheme } from '@mui/material/styles';
import { getFlashcardSets, getDueCards, submitReview, getSetStats } from '../../api/flashcards';
import { formatDueDate } from '../../utils/dueDate';

const QUALITY_LABELS = [
  { value: 0, label: 'No Idea', color: '#EF4444', bg: '#FEE2E2' },
  { value: 1, label: 'Wrong', color: '#F97316', bg: '#FFEDD5' },
  { value: 2, label: 'Hard', color: '#F59E0B', bg: '#FEF3C7' },
  { value: 3, label: 'Good', color: '#EAB308', bg: '#FEF9C3' },
  { value: 4, label: 'Easy', color: '#22C55E', bg: '#DCFCE7' },
  { value: 5, label: 'Perfect', color: '#10B981', bg: '#ECFDF5' },
];

const difficultyConfig = {
  easy: { label: 'Foundational', color: '#10B981', bg: '#ECFDF5' },
  medium: { label: 'Intermediate', color: '#F59E0B', bg: '#FFFBEB' },
  hard: { label: 'Advanced', color: '#EF4444', bg: '#FEE2E2' },
};

export default function EmployeeFlashcardsPage() {
  const theme = useTheme();
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [dueData, setDueData] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getFlashcardSets().then((r) => setSets(r.data)).catch(() => {});
  }, []);

  const startStudy = async (set) => {
    setLoading(true);
    setSelectedSet(set);
    try {
      const [dueRes, statsRes] = await Promise.all([getDueCards(set.id), getSetStats(set.id)]);
      setDueData(dueRes.data);
      setStats(statsRes.data);
      setCurrentIndex(0);
      setFlipped(false);
      setSessionComplete(dueRes.data.cards.length === 0);
    } catch {} finally { setLoading(false); }
  };

  const handleReview = async (quality) => {
    if (!dueData || reviewing) return;
    setReviewing(true);
    const card = dueData.cards[currentIndex];
    try { await submitReview(selectedSet.id, card.id, quality); } catch {}
    if (currentIndex + 1 < dueData.cards.length) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    } else {
      setSessionComplete(true);
      const statsRes = await getSetStats(selectedSet.id);
      setStats(statsRes.data);
    }
    setReviewing(false);
  };

  const goBack = () => { setSelectedSet(null); setDueData(null); setStats(null); setSessionComplete(false); };

  // Set selection view
  if (!selectedSet) {
    return (
      <Box>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Retention Training</Typography>
          <Typography variant="body2" color="text.secondary">Practice with AI-generated spaced repetition cards to maximize knowledge retention.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip icon={<Style sx={{ fontSize: 16 }} />} label={`${sets.length} Training Sets`} sx={{ bgcolor: theme.palette.custom.amberTint, color: '#D97706', fontWeight: 600 }} />
        </Box>
        <Grid container spacing={2}>
          {sets.map((s, idx) => {
            const dc = difficultyConfig[s.difficulty] || difficultyConfig.medium;
            return (
              <Grid item xs={12} sm={6} md={4} key={s.id}>
                <Card sx={{
                  ...fadeInUp(idx * 40), ...glassShineHover,
                  '&:hover': { borderColor: dc.color, transform: 'translateY(-3px)' },
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box display="flex" gap={2} alignItems="flex-start" mb={2}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: theme.palette.custom.amberTint, color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <LayersOutlined sx={{ fontSize: 22 }} />
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>{s.name}</Typography>
                        <Typography variant="caption" color="text.disabled" noWrap>{s.document_name}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" gap={0.5} mb={2} flexWrap="wrap">
                      <Chip label={`${s.num_cards} cards`} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }} />
                      <Chip label={dc.label} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: dc.bg, color: dc.color }} />
                      {s.due_date && (
                        <Chip
                          icon={<AccessTime sx={{ fontSize: 12 }} />}
                          label={s.overdue ? 'Due date closed' : `Due ${formatDueDate(s.due_date)}`}
                          size="small"
                          sx={{
                            fontSize: '0.65rem', height: 22, fontWeight: 700,
                            bgcolor: s.overdue ? theme.palette.custom.redTint : theme.palette.custom.amberTint,
                            color: s.overdue ? '#DC2626' : '#D97706',
                            '& .MuiChip-icon': { color: 'inherit' },
                          }}
                        />
                      )}
                    </Box>
                    {s.overdue ? (
                      <Button
                        fullWidth variant="outlined" size="small" disabled
                        sx={{ borderRadius: '999px', py: 1, fontWeight: 600, borderColor: 'divider', color: 'text.disabled' }}
                      >
                        Missed — Due Date Passed
                      </Button>
                    ) : (
                      <Button
                        fullWidth variant="contained" size="small" onClick={() => startStudy(s)}
                        sx={{
                          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                          borderRadius: '999px', py: 1,
                          boxShadow: '0 6px 18px rgba(99,102,241,0.32)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                            boxShadow: '0 10px 24px rgba(99,102,241,0.45)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        Begin Session
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {sets.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: '16px', border: '2px dashed', borderColor: 'divider' }}>
                <Box sx={{ width: 72, height: 72, borderRadius: '20px', bgcolor: theme.palette.custom.amberTint, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Style sx={{ fontSize: 32, color: '#F59E0B' }} />
                </Box>
                <Typography variant="h6" fontWeight={600} color="text.primary" mb={0.5}>No training sets available</Typography>
                <Typography variant="body2" color="text.disabled">Your HR administrator will create retention training sets for your team.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  }

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" py={12}><CircularProgress sx={{ color: '#F59E0B' }} /></Box>;
  }

  // Session complete
  if (sessionComplete) {
    return (
      <Box maxWidth={600} mx="auto" mt={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 5, px: 4 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '20px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
            }}>
              <EmojiEvents sx={{ fontSize: 36, color: '#fff' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>Session Complete</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Great work! Your progress has been saved.</Typography>
            {stats && (
              <Grid container spacing={2} mb={3}>
                {[
                  { label: 'Mastered', value: stats.mastered, color: '#10B981', bg: theme.palette.custom.greenTint },
                  { label: 'Learning', value: stats.learning, color: '#F59E0B', bg: theme.palette.custom.amberTint },
                  { label: 'New', value: stats.new, color: '#3B82F6', bg: theme.palette.custom.blueTint },
                  { label: 'Retention', value: `${stats.retention_rate}%`, color: '#8B5CF6', bg: theme.palette.custom.purpleTint },
                ].map((s) => (
                  <Grid item xs={3} key={s.label}>
                    <Box sx={{ p: 1.5, bgcolor: s.bg, borderRadius: '12px', textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
            <Button
              variant="contained" onClick={goBack}
              sx={{ ...brandPillButton, px: 4 }}
            >
              Back to Training Sets
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const currentCard = dueData?.cards[currentIndex];
  if (!currentCard) return null;
  const progress = ((currentIndex + 1) / dueData.cards.length) * 100;

  return (
    <Box maxWidth={700} mx="auto" mt={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ color: 'text.secondary' }}>Back</Button>
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          {currentIndex + 1} / {dueData.cards.length} cards
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={progress} sx={{
        mb: 3, height: 6, borderRadius: 3, bgcolor: 'divider',
        '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #F59E0B, #D97706)', borderRadius: 3 },
      }} />

      {stats && (
        <Box display="flex" gap={1} mb={2.5} justifyContent="center">
          <Chip label={`Due: ${dueData.cards_due}`} size="small" sx={{ bgcolor: theme.palette.custom.blueTint, color: '#3B82F6', fontWeight: 600 }} />
          <Chip label={`Mastered: ${stats.mastered}`} size="small" sx={{ bgcolor: theme.palette.custom.greenTint, color: '#10B981', fontWeight: 600 }} />
          <Chip label={`Streak: ${stats.streak_days}d`} size="small" sx={{ bgcolor: theme.palette.custom.purpleTint, color: '#8B5CF6', fontWeight: 600 }} />
        </Box>
      )}

      {/* Flashcard */}
      <Card
        onClick={() => setFlipped(!flipped)}
        sx={{
          minHeight: 300, cursor: 'pointer',
          transition: 'transform 0.5s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
          transformStyle: 'preserve-3d', perspective: 1000,
          borderColor: flipped ? '#10B981' : 'divider',
        }}
      >
        <CardContent sx={{ p: 4, transform: flipped ? 'rotateY(180deg)' : 'none' }}>
          {!flipped ? (
            <>
              <Chip label={currentCard.category} size="small" sx={{ mb: 2, bgcolor: theme.palette.custom.blueTint, color: '#3B82F6', fontWeight: 600 }} />
              <Typography variant="subtitle2" color="text.disabled" mb={1}>SCENARIO</Typography>
              <Typography variant="h6" lineHeight={1.7} color="text.primary">{currentCard.scenario}</Typography>
              <Typography variant="caption" color="text.disabled" mt={3} display="block" textAlign="center">
                Click to reveal best practice
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="subtitle2" color="text.disabled" mb={1}>BEST PRACTICE</Typography>
              <Typography variant="body1" lineHeight={1.8} mb={2.5} color="text.primary">{currentCard.best_practice}</Typography>
              <Box sx={{ p: 2, bgcolor: theme.palette.custom.greenTint, borderRadius: '12px', border: '1px solid #D1FAE5' }}>
                <Typography variant="body2" fontWeight={700} color="#059669">Key Takeaway: {currentCard.key_takeaway}</Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quality buttons */}
      {flipped && (
        <Box mt={3}>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={2} fontWeight={500}>
            How well did you know this?
          </Typography>
          <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
            {QUALITY_LABELS.map((q) => (
              <Button
                key={q.value} variant="outlined" size="small" disabled={reviewing}
                onClick={() => handleReview(q.value)}
                sx={{
                  borderColor: q.bg, bgcolor: q.bg, color: q.color,
                  minWidth: 80, borderRadius: '10px', fontWeight: 600,
                  '&:hover': { bgcolor: q.color, color: '#fff', borderColor: q.color },
                }}
              >
                {q.label}
              </Button>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
