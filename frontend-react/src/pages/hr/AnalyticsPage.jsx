import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, LinearProgress,
  CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Paper,
} from '@mui/material';
import { People, Quiz, Style, Insights, Warning } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getOverview, getSkillGaps } from '../../api/analytics';
import { fadeInUp, glassShineHover } from '../../theme/glass';

export default function AnalyticsPage() {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getSkillGaps()])
      .then(([o, g]) => { setData(o.data); setGaps(g.data.skill_gaps || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box display="flex" justifyContent="center" py={12}><CircularProgress sx={{ color: '#3B82F6' }} /></Box>;
  }
  if (!data) {
    return <Typography color="text.secondary">No analytics available yet.</Typography>;
  }

  const kpis = [
    { label: 'Active Employees', value: data.users.active_employees, sub: `${data.users.new_last_30_days} new (30d)`, icon: <People />, color: '#3B82F6', bg: theme.palette.custom.blueTint },
    { label: 'Avg Evaluation Score', value: `${data.assessments.avg_score}%`, sub: `${data.assessments.total_attempts} attempts`, icon: <Quiz />, color: '#10B981', bg: theme.palette.custom.greenTint },
    { label: 'Retention Rate', value: `${data.flashcards.retention_rate}%`, sub: `${data.flashcards.cards_mastered} cards mastered`, icon: <Style />, color: '#8B5CF6', bg: theme.palette.custom.purpleTint },
    { label: 'Roadmaps Generated', value: data.content.roadmaps_generated, sub: `${data.content.documents} documents`, icon: <Insights />, color: '#F59E0B', bg: theme.palette.custom.amberTint },
  ];

  const maxGap = Math.max(1, ...gaps.map((g) => g.total));

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>L&amp;D Analytics</Typography>
        <Typography variant="body2" color="text.secondary">Training effectiveness, engagement, and organization-wide skill gaps.</Typography>
      </Box>

      {/* AI usage vs daily cap */}
      {data.ai_usage && (
        <Box sx={{ ...fadeInUp(20), mb: 2, p: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" fontWeight={700} color="text.primary">AI usage today</Typography>
          <Box sx={{ flex: 1, minWidth: 160 }}>
            <LinearProgress variant="determinate" value={Math.min(100, (data.ai_usage.global_used / Math.max(1, data.ai_usage.global_limit)) * 100)} sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 3, background: 'linear-gradient(90deg,#0EA5E9,#3B82F6)' } }} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {data.ai_usage.global_used} / {data.ai_usage.global_limit} calls · {data.ai_usage.remaining} left
          </Typography>
        </Box>
      )}

      {/* KPI cards */}
      <Grid container spacing={2} mb={3}>
        {kpis.map((k, i) => (
          <Grid item xs={6} md={3} key={k.label}>
            <Card sx={{ ...fadeInUp(i * 40), ...glassShineHover }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                  {k.icon}
                </Box>
                <Typography variant="h5" fontWeight={800} color="text.primary">{k.value}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>{k.label}</Typography>
                <Typography variant="caption" color="text.disabled">{k.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {/* Per-department scores */}
        <Grid item xs={12} md={6}>
          <Card sx={fadeInUp(60)}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="text.primary" mb={2}>Avg Score by Department</Typography>
              {data.assessments.by_department.length === 0 && (
                <Typography variant="body2" color="text.disabled">No evaluation data yet.</Typography>
              )}
              {data.assessments.by_department.map((d) => (
                <Box key={d.department} mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" fontWeight={500} color="text.primary">{d.department}</Typography>
                    <Typography variant="body2" fontWeight={700} color={d.avg_score >= 70 ? '#10B981' : d.avg_score >= 50 ? '#F59E0B' : '#EF4444'}>
                      {d.avg_score}% <Typography component="span" variant="caption" color="text.disabled">({d.attempts})</Typography>
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={d.avg_score} sx={{
                    height: 6, borderRadius: 3, bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': { borderRadius: 3, background: d.avg_score >= 70 ? 'linear-gradient(90deg,#10B981,#059669)' : d.avg_score >= 50 ? 'linear-gradient(90deg,#F59E0B,#D97706)' : 'linear-gradient(90deg,#EF4444,#DC2626)' },
                  }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Skill-gap heatmap */}
        <Grid item xs={12} md={6}>
          <Card sx={fadeInUp(80)}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Warning sx={{ fontSize: 18, color: '#EF4444' }} />
                <Typography variant="h6" fontWeight={700} color="text.primary">Organization Skill Gaps</Typography>
              </Box>
              {gaps.length === 0 ? (
                <Typography variant="body2" color="text.disabled">No skill gaps identified yet — employees need to generate growth roadmaps.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Skill</TableCell>
                      <TableCell align="center">Critical</TableCell>
                      <TableCell align="center">Mod.</TableCell>
                      <TableCell align="center">Minor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gaps.slice(0, 12).map((g) => (
                      <TableRow key={g.skill}>
                        <TableCell sx={{ maxWidth: 180 }}>
                          <Typography variant="body2" noWrap title={g.skill}>{g.skill}</Typography>
                          <Box sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: theme.palette.custom.redTint, width: `${(g.total / maxGap) * 100}%`, minWidth: 8 }} />
                        </TableCell>
                        <TableCell align="center">{g.critical > 0 ? <Chip label={g.critical} size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700, height: 20 }} /> : '—'}</TableCell>
                        <TableCell align="center">{g.moderate || '—'}</TableCell>
                        <TableCell align="center">{g.minor || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
