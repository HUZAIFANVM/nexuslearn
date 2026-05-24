import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea, Chip,
  CircularProgress,
} from '@mui/material';
import {
  SmartToy, Style, Quiz, Route, ArrowForward, AutoAwesome,
  TrendingUp, EmojiEvents, School,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getOverviewStats } from '../../api/flashcards';
import { getMyPath } from '../../api/learningPaths';
import { useAuth } from '../../contexts/AuthContext';
import { fadeInUp, glassShineHover, floatGently } from '../../theme/glass';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [fcStats, setFcStats] = useState(null);
  const [path, setPath] = useState(null);

  useEffect(() => {
    getOverviewStats().then((r) => setFcStats(r.data)).catch(() => {});
    getMyPath().then((r) => setPath(r.data)).catch(() => {});
  }, []);

  const quickLinks = [
    { label: 'AI Knowledge Hub', desc: 'Ask anything', icon: <SmartToy />, path: '/employee/chat', color: '#8B5CF6', bg: theme.palette.custom.purpleTint },
    { label: 'Retention Training', desc: fcStats ? `${fcStats.mastered}/${fcStats.total_cards} mastered` : 'Spaced repetition', icon: <Style />, path: '/employee/flashcards', color: '#F59E0B', bg: theme.palette.custom.amberTint },
    { label: 'Competency Check', desc: 'AI evaluations', icon: <Quiz />, path: '/employee/assessments', color: '#10B981', bg: theme.palette.custom.greenTint },
    { label: 'Growth Roadmap', desc: path ? `${path.overall_score}% score` : 'Your path', icon: <Route />, path: '/employee/learning-path', color: '#3B82F6', bg: theme.palette.custom.blueTint },
  ];

  const QuickTile = ({ link, delay }) => (
    <Card sx={{
      cursor: 'pointer', height: '100%',
      ...fadeInUp(delay), ...glassShineHover,
      '&:hover': { transform: 'translateY(-3px)', borderColor: `${link.color}66` },
    }}>
      <CardActionArea onClick={() => navigate(link.path)} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2.25 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.75}>
            <Box sx={{
              width: 42, height: 42, borderRadius: '12px',
              bgcolor: link.bg, color: link.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...floatGently,
            }}>
              {link.icon}
            </Box>
            <ArrowForward sx={{ fontSize: 16, color: 'text.disabled' }} />
          </Box>
          <Typography variant="body2" fontWeight={700} color="text.primary" mb={0.3} sx={{ fontSize: '0.88rem' }}>{link.label}</Typography>
          <Typography variant="caption" color="text.disabled">{link.desc}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );

  return (
    <Box>
      <Grid container spacing={2}>
        {/* ===== LEFT COLUMN ===== */}
        <Grid item xs={12} md={7}>
          <Grid container spacing={2}>
            {/* Hero */}
            <Grid item xs={12}>
              <Card sx={{
                ...fadeInUp(0), ...glassShineHover,
                position: 'relative', overflow: 'hidden',
                background: (t) => t.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.85) 60%, rgba(51,65,85,0.85) 100%)'
                  : 'linear-gradient(135deg, rgba(99,102,241,0.92) 0%, rgba(139,92,246,0.92) 100%)',
                color: '#fff', minHeight: 200,
              }}>
                <Box sx={{
                  position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
                  ...floatGently,
                }} />
                <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                  <Chip
                    icon={<AutoAwesome sx={{ fontSize: 14 }} />}
                    label="MY LEARNING DASHBOARD"
                    size="small"
                    sx={{
                      mb: 2, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
                      fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em',
                      borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                      '& .MuiChip-icon': { color: '#fff' },
                    }}
                  />
                  <Typography variant="h4" fontWeight={800} mb={0.5} sx={{ letterSpacing: '-0.02em' }}>
                    Welcome back, {user?.full_name?.split(' ')[0] || 'there'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.78)', maxWidth: 460, lineHeight: 1.6 }}>
                    {user?.department} Department &middot; Continue your professional development journey.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick links 1 + 2 (left side) */}
            <Grid item xs={6}><QuickTile link={quickLinks[0]} delay={50} /></Grid>
            <Grid item xs={6}><QuickTile link={quickLinks[1]} delay={80} /></Grid>

            {/* Retention Training Progress */}
            <Grid item xs={12}>
              <Card sx={{ ...fadeInUp(140) }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="text.primary">Retention Training</Typography>
                      <Typography variant="body2" color="text.secondary">Spaced-repetition performance</Typography>
                    </Box>
                    {fcStats && (
                      <Chip label={`${fcStats.retention_rate}%`} size="small" sx={{ bgcolor: theme.palette.custom.greenTint, color: '#059669', fontWeight: 700 }} />
                    )}
                  </Box>
                  {fcStats ? (
                    <Grid container spacing={1.5}>
                      {[
                        { label: 'Mastered', value: fcStats.mastered, color: '#10B981', bg: theme.palette.custom.greenTint, icon: <EmojiEvents sx={{ fontSize: 20 }} /> },
                        { label: 'Learning', value: fcStats.learning, color: '#F59E0B', bg: theme.palette.custom.amberTint, icon: <School sx={{ fontSize: 20 }} /> },
                        { label: 'New', value: fcStats.new, color: '#3B82F6', bg: theme.palette.custom.blueTint, icon: <AutoAwesome sx={{ fontSize: 20 }} /> },
                        { label: 'Retention', value: `${fcStats.retention_rate}%`, color: '#8B5CF6', bg: theme.palette.custom.purpleTint, icon: <TrendingUp sx={{ fontSize: 20 }} /> },
                      ].map((s, i) => (
                        <Grid item xs={6} sm={3} key={s.label}>
                          <Box sx={{
                            textAlign: 'center', p: 1.75, bgcolor: s.bg, borderRadius: '14px',
                            transition: 'transform 0.2s ease',
                            '&:hover': { transform: 'translateY(-2px)' },
                            ...fadeInUp(160 + i * 30),
                          }}>
                            <Box sx={{ color: s.color, mb: 0.75 }}>{s.icon}</Box>
                            <Typography variant="h5" fontWeight={800} color="text.primary">{s.value}</Typography>
                            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Style sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">Start a session to track progress</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* ===== RIGHT COLUMN ===== */}
        <Grid item xs={12} md={5}>
          <Grid container spacing={2}>
            {/* Quick links 3 + 4 */}
            <Grid item xs={6}><QuickTile link={quickLinks[2]} delay={100} /></Grid>
            <Grid item xs={6}><QuickTile link={quickLinks[3]} delay={120} /></Grid>

            {/* Growth Roadmap */}
            <Grid item xs={12}>
              <Card sx={{ ...fadeInUp(180), height: '100%', minHeight: 360 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box mb={2}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">Growth Roadmap</Typography>
                    <Typography variant="body2" color="text.secondary">Your personalized development path</Typography>
                  </Box>

                  {path ? (
                    <>
                      <Box display="flex" alignItems="center" gap={2.5} mb={2.5}>
                        <Box sx={{ position: 'relative', display: 'inline-flex', ...floatGently }}>
                          <CircularProgress
                            variant="determinate" value={path.overall_score || 0}
                            size={88} thickness={5}
                            sx={{
                              color: path.overall_score >= 70 ? '#10B981' : path.overall_score >= 50 ? '#F59E0B' : '#EF4444',
                              '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
                            }}
                          />
                          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="h6" fontWeight={800} color="text.primary">{path.overall_score}%</Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="text.primary">Overall Score</Typography>
                          <Typography variant="caption" color="text.disabled">
                            Based on {path.assessment_summary?.length || 0} evaluations
                          </Typography>
                        </Box>
                      </Box>

                      {path.strengths?.length > 0 && (
                        <Box mb={2}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.75} display="block" sx={{ letterSpacing: '0.08em' }}>STRENGTHS</Typography>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {path.strengths.map((s, i) => {
                              const label = typeof s === 'string' ? s : s.skill;
                              return <Chip key={i} label={label} size="small" sx={{ bgcolor: theme.palette.custom.greenTint, color: '#059669', fontWeight: 600, fontSize: '0.7rem' }} />;
                            })}
                          </Box>
                        </Box>
                      )}
                      {path.weaknesses?.length > 0 && (
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.75} display="block" sx={{ letterSpacing: '0.08em' }}>FOCUS AREAS</Typography>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {path.weaknesses.map((w, i) => {
                              const label = typeof w === 'string' ? w : w.skill;
                              return <Chip key={i} label={label} size="small" sx={{ bgcolor: theme.palette.custom.redTint, color: '#DC2626', fontWeight: 600, fontSize: '0.7rem' }} />;
                            })}
                          </Box>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <Box sx={{
                        width: 64, height: 64, borderRadius: '16px',
                        bgcolor: 'action.hover',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2,
                        ...floatGently,
                      }}>
                        <Route sx={{ fontSize: 28, color: 'text.disabled' }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={0.5}>No roadmap yet</Typography>
                      <Typography variant="caption" color="text.disabled">Complete evaluations, then generate your roadmap</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
