import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Chip, CircularProgress,
  Alert, Grid, LinearProgress,
} from '@mui/material';
import {
  TrendingUp, Warning, Route, AutoAwesome, EmojiEvents,
  School, FlagCircle, Assignment, Build,
} from '@mui/icons-material';
import { fadeInUp, brandPillButton, glassShineHover, floatGently } from '../../theme/glass';
import { useTheme } from '@mui/material/styles';
import { getMyPath, generateLearningPath } from '../../api/learningPaths';

export default function LearningPathPage() {
  const theme = useTheme();
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getMyPath()
      .then((r) => setPath(r.data))
      .catch(() => setPath(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await generateLearningPath();
      setPath(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate growth roadmap');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" py={12}><CircularProgress sx={{ color: '#3B82F6' }} /></Box>;
  }

  const priorityConfig = {
    high: { color: '#EF4444', bg: theme.palette.custom.redTint, icon: <FlagCircle sx={{ fontSize: 16 }} /> },
    medium: { color: '#F59E0B', bg: theme.palette.custom.amberTint, icon: <FlagCircle sx={{ fontSize: 16 }} /> },
    low: { color: '#10B981', bg: theme.palette.custom.greenTint, icon: <FlagCircle sx={{ fontSize: 16 }} /> },
  };

  const severityConfig = {
    critical: { color: '#EF4444', bg: theme.palette.custom.redTint, label: 'Critical' },
    moderate: { color: '#F59E0B', bg: theme.palette.custom.amberTint, label: 'Moderate' },
    minor: { color: '#3B82F6', bg: theme.palette.custom.blueTint, label: 'Minor' },
  };

  // How much grounded analysis came back. When the model abstains on thin data,
  // these can be 0 — drive empty-state messaging off this instead of showing
  // bare section headers with nothing under them.
  const counts = {
    strengths: path?.strengths?.length || 0,
    weaknesses: path?.weaknesses?.length || 0,
    recommendations: path?.recommendations?.length || 0,
    projects: path?.project_recommendations?.length || 0,
  };
  const hasInsights =
    counts.strengths + counts.weaknesses + counts.recommendations + counts.projects > 0;

  // Helper to render strengths — handles both old string[] and new object[] format
  const renderStrengths = (strengths) => {
    if (!strengths?.length) return null;
    return strengths.map((s, i) => {
      const skill = typeof s === 'string' ? s : s.skill;
      const evidence = typeof s === 'string' ? '' : s.evidence;
      return (
        <Box key={i} sx={{ mb: 1.5, p: 1.5, borderRadius: '10px', bgcolor: theme.palette.custom.greenTint }}>
          <Box display="flex" alignItems="center" gap={1} mb={evidence ? 0.5 : 0}>
            <Chip label={typeof s === 'string' ? 'competent' : (s.proficiency || 'competent')} size="small"
              sx={{ bgcolor: '#059669', color: '#fff', fontWeight: 600, fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }} />
            <Typography variant="body2" fontWeight={700} color="text.primary">{skill}</Typography>
          </Box>
          {evidence && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{evidence}</Typography>
          )}
        </Box>
      );
    });
  };

  // Helper to render weaknesses — handles both old string[] and new object[] format
  const renderWeaknesses = (weaknesses) => {
    if (!weaknesses?.length) return null;
    return weaknesses.map((w, i) => {
      const skill = typeof w === 'string' ? w : w.skill;
      const evidence = typeof w === 'string' ? '' : w.evidence;
      const severity = typeof w === 'string' ? 'moderate' : (w.severity || 'moderate');
      const gap = typeof w === 'string' ? '' : w.gap_description;
      const sc = severityConfig[severity] || severityConfig.moderate;
      return (
        <Box key={i} sx={{ mb: 1.5, p: 1.5, borderRadius: '10px', bgcolor: sc.bg, borderLeft: `3px solid ${sc.color}` }}>
          <Box display="flex" alignItems="center" gap={1} mb={(evidence || gap) ? 0.5 : 0}>
            <Chip label={sc.label} size="small"
              sx={{ bgcolor: sc.color, color: '#fff', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
            <Typography variant="body2" fontWeight={700} color="text.primary">{skill}</Typography>
          </Box>
          {evidence && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 0.5 }}>{evidence}</Typography>
          )}
          {gap && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 0.5, mt: 0.5, fontStyle: 'italic' }}>{gap}</Typography>
          )}
        </Box>
      );
    });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Growth Roadmap</Typography>
          <Typography variant="body2" color="text.secondary">
            Your AI-generated personalized development path based on evaluation performance and training activity.
          </Typography>
        </Box>
        <Button
          variant="contained" onClick={handleGenerate} disabled={generating}
          startIcon={generating ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <AutoAwesome />}
          sx={brandPillButton}
        >
          {path ? 'Regenerate' : 'Generate Roadmap'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

      {!path ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '24px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
            }}>
              <Route sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>No Growth Roadmap Yet</Typography>
            <Typography variant="body1" color="text.secondary" mb={3} maxWidth={450} mx="auto">
              Complete competency evaluations or retention training sessions, then generate your personalized AI-powered development roadmap.
            </Typography>
            <Button
              variant="outlined" startIcon={<AutoAwesome />} onClick={handleGenerate} disabled={generating}
              sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '10px', px: 4 }}
            >
              Generate My Roadmap
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Thin-data notice: roadmap generated, but not enough detail for specific insights */}
          {!hasInsights && (
            <Alert severity="info" icon={<AutoAwesome />} sx={{ mb: 3, borderRadius: '12px' }}>
              We built your roadmap from your current activity, but there isn't enough detailed
              data yet to pinpoint specific strengths, focus areas, or projects. Complete more
              competency evaluations (or review more flashcards), then regenerate for richer,
              evidence-based insights.
            </Alert>
          )}

          {/* Overall performance */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="text.primary" mb={3}>Performance Overview</Typography>
              <Box display="flex" alignItems="flex-start" gap={4} flexWrap="wrap">
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate" value={path.overall_score || 0}
                    size={100} thickness={5}
                    sx={{
                      color: path.overall_score >= 70 ? '#10B981' : path.overall_score >= 50 ? '#F59E0B' : '#EF4444',
                      '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
                    }}
                  />
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="text.primary">{path.overall_score}%</Typography>
                    <Typography variant="caption" color="text.disabled" fontSize="0.6rem">OVERALL</Typography>
                  </Box>
                </Box>
                <Box flex={1} sx={{ minWidth: 0 }}>
                  <Grid container spacing={2}>
                    {path.strengths?.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                          <TrendingUp sx={{ fontSize: 16, color: '#10B981' }} />
                          <Typography variant="subtitle2" color="text.secondary">STRENGTHS</Typography>
                        </Box>
                        {renderStrengths(path.strengths)}
                      </Grid>
                    )}
                    {path.weaknesses?.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                          <Warning sx={{ fontSize: 16, color: '#EF4444' }} />
                          <Typography variant="subtitle2" color="text.secondary">FOCUS AREAS</Typography>
                        </Box>
                        {renderWeaknesses(path.weaknesses)}
                      </Grid>
                    )}
                    {counts.strengths === 0 && counts.weaknesses === 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Your overall score is shown from real evaluation and training data.
                          Specific strengths and focus areas will appear here once there's enough
                          detailed activity to identify them.
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Project Recommendations */}
          {path.project_recommendations?.length > 0 && (
            <Box mb={3}>
              <Typography variant="h6" fontWeight={700} color="text.primary" mb={0.5}>Suggested Projects for Growth</Typography>
              <Typography variant="body2" color="text.secondary" mb={2.5}>Practical projects and tasks that would help develop your weaker areas</Typography>
              <Grid container spacing={2}>
                {path.project_recommendations.map((proj, i) => (
                  <Grid item xs={12} md={6} key={i}>
                    <Card sx={{ height: '100%', borderLeft: '4px solid', borderLeftColor: proj.assignment_fitness === 'ready' ? '#16A34A' : proj.assignment_fitness === 'supervised' ? '#D97706' : proj.assignment_fitness === 'not_ready' ? '#DC2626' : '#8B5CF6' }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{
                              width: 28, height: 28, borderRadius: '8px', bgcolor: theme.palette.custom.purpleTint,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Assignment sx={{ fontSize: 16, color: '#8B5CF6' }} />
                            </Box>
                            <Typography fontWeight={700} color="text.primary" fontSize="0.95rem">{proj.title}</Typography>
                          </Box>
                          {proj.assignment_fitness && (
                            <Chip
                              label={proj.assignment_fitness === 'ready' ? 'Ready to Assign' : proj.assignment_fitness === 'supervised' ? 'Under Supervision' : 'Not Ready'}
                              size="small"
                              sx={{
                                fontWeight: 700, fontSize: '0.7rem',
                                bgcolor: proj.assignment_fitness === 'ready' ? '#DCFCE7' : proj.assignment_fitness === 'supervised' ? '#FEF3C7' : '#FEE2E2',
                                color: proj.assignment_fitness === 'ready' ? '#15803D' : proj.assignment_fitness === 'supervised' ? '#92400E' : '#DC2626',
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" mb={1.5} lineHeight={1.6}>{proj.description}</Typography>
                        {proj.skills_required?.length > 0 && (
                          <Box display="flex" gap={0.5} flexWrap="wrap" mb={0.5}>
                            {proj.skills_required.map((sk) => (
                              <Chip key={sk} label={sk} size="small"
                                sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, fontSize: '0.7rem' }} />
                            ))}
                          </Box>
                        )}
                        {proj.skills_developed?.length > 0 && (
                          <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
                            {proj.skills_developed.map((sk) => (
                              <Chip key={sk} label={sk} size="small" icon={<Build sx={{ fontSize: 12 }} />}
                                sx={{ bgcolor: theme.palette.custom.purpleTint, color: '#7C3AED', fontWeight: 600, fontSize: '0.7rem', '& .MuiChip-icon': { color: '#7C3AED' } }} />
                            ))}
                          </Box>
                        )}
                        {proj.fitness_rationale && (
                          <Box sx={{ p: 1.5, bgcolor: proj.assignment_fitness === 'ready' ? '#F0FDF4' : proj.assignment_fitness === 'supervised' ? '#FFFBEB' : '#FEF2F2', borderRadius: '8px', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" fontSize="0.8rem">{proj.fitness_rationale}</Typography>
                          </Box>
                        )}
                        {proj.rationale && (
                          <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: '8px' }}>
                            <Typography variant="body2" color="text.secondary" fontStyle="italic" fontSize="0.8rem">{proj.rationale}</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Document Recommendations — only when there are grounded recommendations */}
          {counts.recommendations > 0 && (
          <Box mb={3}>
            <Typography variant="h6" fontWeight={700} color="text.primary" mb={0.5}>Recommended Development Plan</Typography>
            <Typography variant="body2" color="text.secondary" mb={2.5}>Prioritized learning activities based on your performance analysis</Typography>
            {path.recommendations?.map((rec, i) => {
              const pc = priorityConfig[rec.priority] || priorityConfig.medium;
              return (
                <Card key={i} sx={{ mb: 2, borderLeft: '4px solid', borderLeftColor: pc.color }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '8px', bgcolor: pc.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: pc.color,
                          fontSize: '0.8rem', fontWeight: 800,
                        }}>
                          {i + 1}
                        </Box>
                        <Typography fontWeight={700} color="text.primary" fontSize="0.95rem">{rec.topic}</Typography>
                      </Box>
                      <Chip
                        icon={pc.icon}
                        label={rec.priority}
                        size="small"
                        sx={{ bgcolor: pc.bg, color: pc.color, fontWeight: 600, fontSize: '0.7rem', textTransform: 'capitalize', '& .MuiChip-icon': { color: pc.color } }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }} mb={1} lineHeight={1.6}>{rec.description}</Typography>
                    {rec.document_name && (
                      <Typography variant="caption" color="text.disabled">
                        Resource: {rec.document_name}
                      </Typography>
                    )}
                    {rec.reason && (
                      <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: '8px' }}>
                        <Typography variant="body2" color="text.secondary" fontStyle="italic" fontSize="0.8rem">{rec.reason}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
          )}

          {/* Performance summaries */}
          <Grid container spacing={2.5}>
            {path.assessment_summary?.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: theme.palette.custom.greenTint, color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <EmojiEvents sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="text.primary" fontSize="1rem">Evaluation Summary</Typography>
                    </Box>
                    {path.assessment_summary.map((a, i) => (
                      <Box key={i} mb={2}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" fontWeight={500} color="text.primary" noWrap sx={{ maxWidth: '65%' }}>{a.name}</Typography>
                          <Typography variant="body2" fontWeight={700} color={a.percentage >= 70 ? '#10B981' : a.percentage >= 50 ? '#F59E0B' : '#EF4444'}>
                            {a.percentage}%
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={a.percentage} sx={{
                          height: 6, borderRadius: 3, bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: a.percentage >= 70 ? 'linear-gradient(90deg, #10B981, #059669)' : a.percentage >= 50 ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, #EF4444, #DC2626)',
                          },
                        }} />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )}
            {path.flashcard_summary?.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: theme.palette.custom.amberTint, color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <School sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="text.primary" fontSize="1rem">Retention Training Summary</Typography>
                    </Box>
                    {path.flashcard_summary.map((f, i) => (
                      <Box key={i} mb={2}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" fontWeight={500} color="text.primary" noWrap sx={{ maxWidth: '55%' }}>{f.set_name}</Typography>
                          <Typography variant="body2" fontWeight={700} color="#8B5CF6">
                            {f.mastered}/{f.total} ({f.retention_rate}%)
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={(f.mastered / Math.max(f.total, 1)) * 100} sx={{
                          height: 6, borderRadius: 3, bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
                          },
                        }} />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
}
