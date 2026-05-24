import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent,
  LinearProgress, Chip, Avatar,
} from '@mui/material';
import {
  Description, SmartToy, Style, Quiz, TrendingUp,
  People, ArrowForward, AutoAwesome,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getDocuments } from '../../api/documents';
import { getChatbots } from '../../api/chatbots';
import { getFlashcardSets } from '../../api/flashcards';
import { getAssessments, getAllResults } from '../../api/assessments';
import { getAllPaths } from '../../api/learningPaths';
import { useAuth } from '../../contexts/AuthContext';
import { fadeInUp, glassShineHover, floatGently } from '../../theme/glass';

export default function HRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [stats, setStats] = useState({ docs: 0, bots: 0, sets: 0, assessments: 0 });
  const [results, setResults] = useState([]);
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    Promise.all([
      getDocuments(), getChatbots(), getFlashcardSets(), getAssessments(),
      getAllResults().catch(() => ({ data: [] })),
      getAllPaths().catch(() => ({ data: [] })),
    ]).then(([d, c, f, a, r, p]) => {
      setStats({ docs: d.data.length, bots: c.data.length, sets: f.data.length, assessments: a.data.length });
      setResults(r.data || []);
      setPaths(p.data || []);
    }).catch(() => {});
  }, []);

  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0;

  // Tiles arranged for the bento grid (hero spans the top-left; stats around)
  const statTiles = [
    { label: 'Resource Library', value: stats.docs, icon: <Description />, color: '#3B82F6', bg: theme.palette.custom.blueTint, path: '/hr/documents', desc: 'Uploaded documents' },
    { label: 'Knowledge Assistants', value: stats.bots, icon: <SmartToy />, color: '#8B5CF6', bg: theme.palette.custom.purpleTint, path: '/hr/chatbots', desc: 'Active AI assistants' },
    { label: 'Retention Training', value: stats.sets, icon: <Style />, color: '#F59E0B', bg: theme.palette.custom.amberTint, path: '/hr/flashcards', desc: 'Training card sets' },
    { label: 'Competency Evaluations', value: stats.assessments, icon: <Quiz />, color: '#10B981', bg: theme.palette.custom.greenTint, path: '/hr/assessments', desc: 'Active evaluations' },
  ];

  const quickActions = [
    { label: 'Upload Resource', icon: <Description />, path: '/hr/documents', color: '#3B82F6' },
    { label: 'Create Assistant', icon: <SmartToy />, path: '/hr/chatbots', color: '#8B5CF6' },
    { label: 'Build Training Set', icon: <Style />, path: '/hr/flashcards', color: '#F59E0B' },
    { label: 'New Evaluation', icon: <Quiz />, path: '/hr/assessments', color: '#10B981' },
    { label: 'View Workforce', icon: <People />, path: '/hr/employees', color: '#EF4444' },
  ];

  const StatTile = ({ s, delay }) => (
    <Card
      onClick={() => navigate(s.path)}
      sx={{
        cursor: 'pointer', height: '100%',
        ...fadeInUp(delay), ...glassShineHover,
        '&:hover': { transform: 'translateY(-3px)', borderColor: `${s.color}66` },
      }}
    >
      <CardContent sx={{ p: 2.25 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box sx={{
            width: 42, height: 42, borderRadius: '12px',
            bgcolor: s.bg, color: s.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...floatGently,
          }}>
            {s.icon}
          </Box>
          <ArrowForward sx={{ fontSize: 16, color: 'text.disabled' }} />
        </Box>
        <Typography variant="h3" fontWeight={800} color="text.primary" sx={{ fontSize: '2rem', lineHeight: 1, mb: 0.5 }}>
          {s.value}
        </Typography>
        <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: '0.85rem' }}>{s.label}</Typography>
        <Typography variant="caption" color="text.disabled">{s.desc}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Grid container spacing={2}>
        {/* ===== LEFT COLUMN ===== */}
        <Grid item xs={12} md={7}>
          <Grid container spacing={2}>
            {/* Hero card */}
            <Grid item xs={12}>
              <Card sx={{
                ...fadeInUp(0), ...glassShineHover,
                position: 'relative', overflow: 'hidden',
                background: (t) => t.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.85) 60%, rgba(51,65,85,0.85) 100%)'
                  : 'linear-gradient(135deg, rgba(99,102,241,0.92) 0%, rgba(139,92,246,0.92) 100%)',
                color: '#fff', minHeight: 220,
              }}>
                {/* decorative orbs */}
                <Box sx={{
                  position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
                  ...floatGently,
                }} />
                <Box sx={{
                  position: 'absolute', bottom: -40, right: 80, width: 160, height: 160, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(96,165,250,0.25) 0%, transparent 70%)',
                }} />
                <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                  <Chip
                    icon={<AutoAwesome sx={{ fontSize: 14 }} />}
                    label="HR COMMAND CENTER"
                    size="small"
                    sx={{
                      mb: 2, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
                      fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em',
                      borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                      '& .MuiChip-icon': { color: '#fff' },
                    }}
                  />
                  <Typography variant="h4" fontWeight={800} mb={0.5} sx={{ letterSpacing: '-0.02em' }}>
                    Welcome back, {user?.full_name?.split(' ')[0] || 'Admin'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.78)', maxWidth: 460, lineHeight: 1.6 }}>
                    Manage your organization's learning programs, track team progress, and drive workforce development.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Stats 3 + 4 (bottom-left of bento) */}
            <Grid item xs={6}>
              <StatTile s={statTiles[2]} delay={120} />
            </Grid>
            <Grid item xs={6}>
              <StatTile s={statTiles[3]} delay={150} />
            </Grid>

            {/* Quick actions */}
            <Grid item xs={12}>
              <Card sx={{ ...fadeInUp(180) }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h6" fontWeight={700} color="text.primary" mb={0.5}>Quick Actions</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>Frequently used operations</Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {quickActions.map((a) => (
                      <Box
                        key={a.label}
                        onClick={() => navigate(a.path)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 2, p: 1.5,
                          borderRadius: '12px', cursor: 'pointer',
                          border: '1px solid',
                          borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
                          background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.4)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: `${a.color}14`,
                            borderColor: `${a.color}55`,
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <Box sx={{
                          width: 36, height: 36, borderRadius: '10px',
                          bgcolor: `${a.color}18`, color: a.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          '& .MuiSvgIcon-root': { fontSize: 18 },
                        }}>
                          {a.icon}
                        </Box>
                        <Typography variant="body2" fontWeight={600} color="text.primary" flex={1}>{a.label}</Typography>
                        <ArrowForward sx={{ fontSize: 14, color: 'text.disabled' }} />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* ===== RIGHT COLUMN ===== */}
        <Grid item xs={12} md={5}>
          <Grid container spacing={2}>
            {/* Stats 1 + 2 */}
            <Grid item xs={6}>
              <StatTile s={statTiles[0]} delay={50} />
            </Grid>
            <Grid item xs={6}>
              <StatTile s={statTiles[1]} delay={80} />
            </Grid>

            {/* Performance bar */}
            <Grid item xs={12}>
              <Card sx={{ ...fadeInUp(110) }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="text.primary">Workforce Performance</Typography>
                      <Typography variant="body2" color="text.secondary">Organization-wide metrics</Typography>
                    </Box>
                    <Chip
                      icon={<TrendingUp sx={{ fontSize: 16 }} />}
                      label={`${avgScore}% Avg`}
                      size="small"
                      color={avgScore >= 70 ? 'success' : avgScore >= 50 ? 'warning' : 'error'}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                  {results.length > 0 ? (() => {
                    const byAssessment = {};
                    results.forEach((r) => {
                      if (!byAssessment[r.assessment_name]) byAssessment[r.assessment_name] = [];
                      byAssessment[r.assessment_name].push(r.percentage);
                    });
                    return Object.entries(byAssessment).slice(0, 4).map(([name, scores]) => {
                      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                      return (
                        <Box key={name} mb={1.75}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" fontWeight={500} color="text.primary" noWrap sx={{ maxWidth: '60%' }}>{name}</Typography>
                            <Typography variant="body2" fontWeight={700} color={avg >= 70 ? '#10B981' : avg >= 50 ? '#F59E0B' : '#EF4444'}>
                              {avg}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate" value={avg}
                            sx={{
                              height: 8, borderRadius: 4,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: avg >= 70
                                  ? 'linear-gradient(90deg, #10B981, #059669)'
                                  : avg >= 50 ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                                  : 'linear-gradient(90deg, #EF4444, #DC2626)',
                              },
                            }}
                          />
                        </Box>
                      );
                    });
                  })() : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <TrendingUp sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">No evaluation data yet</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent activity */}
            <Grid item xs={12}>
              <Card sx={{ ...fadeInUp(160), height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="text.primary">Recent Activity</Typography>
                      <Typography variant="body2" color="text.secondary">Latest submissions</Typography>
                    </Box>
                    {results.length > 0 && (
                      <Chip label={`${results.length}`} size="small" sx={{ bgcolor: 'action.hover', fontWeight: 700 }} />
                    )}
                  </Box>
                  {results.length > 0 ? (
                    <Box>
                      {results.slice(0, 5).map((r, i) => (
                        <Box key={r.id || i} sx={{
                          display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25,
                          borderBottom: i < Math.min(results.length, 5) - 1 ? (t) => `1px solid ${t.palette.divider}` : 'none',
                        }}>
                          <Avatar sx={{
                            width: 32, height: 32, fontSize: 13, fontWeight: 700,
                            bgcolor: [theme.palette.custom.blueTint, theme.palette.custom.purpleTint, theme.palette.custom.greenTint, theme.palette.custom.amberTint, theme.palette.custom.redTint][i % 5],
                            color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][i % 5],
                          }}>
                            {r.user_email?.[0]?.toUpperCase() || 'U'}
                          </Avatar>
                          <Box flex={1} minWidth={0}>
                            <Typography variant="body2" fontWeight={600} color="text.primary" noWrap sx={{ fontSize: '0.82rem' }}>{r.user_email}</Typography>
                            <Typography variant="caption" color="text.disabled" noWrap>{r.assessment_name}</Typography>
                          </Box>
                          <Chip
                            label={`${r.percentage}%`}
                            size="small"
                            sx={{
                              fontWeight: 700, height: 22, fontSize: '0.7rem',
                              bgcolor: r.percentage >= 70 ? theme.palette.custom.greenTint : r.percentage >= 50 ? theme.palette.custom.amberTint : theme.palette.custom.redTint,
                              color: r.percentage >= 70 ? '#059669' : r.percentage >= 50 ? '#D97706' : '#DC2626',
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <People sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">No submissions yet</Typography>
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
