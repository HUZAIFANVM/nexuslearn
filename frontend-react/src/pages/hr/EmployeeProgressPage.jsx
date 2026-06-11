import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  LinearProgress, Accordion, AccordionSummary, AccordionDetails, Avatar,
} from '@mui/material';
import { ExpandMore, People, TrendingUp, Warning, EmojiEvents } from '@mui/icons-material';
import { getAllResults } from '../../api/assessments';
import { getAllPaths } from '../../api/learningPaths';

export default function EmployeeProgressPage() {
  const [results, setResults] = useState([]);
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    getAllResults().then((r) => setResults(r.data)).catch(() => {});
    getAllPaths().then((r) => setPaths(r.data)).catch(() => {});
  }, []);

  const byEmployee = {};
  results.forEach((r) => {
    if (!byEmployee[r.user_email]) byEmployee[r.user_email] = [];
    byEmployee[r.user_email].push(r);
  });

  const totalEmployees = Object.keys(byEmployee).length;
  const overallAvg = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length) : 0;
  const topPerformers = Object.entries(byEmployee).filter(([_, r]) => {
    const avg = r.reduce((a, x) => a + x.percentage, 0) / r.length;
    return avg >= 80;
  }).length;

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} color="#0F172A" mb={0.5}>Workforce Analytics</Typography>
        <Typography variant="body2" color="#64748B">
          Track team performance, identify skill gaps, and monitor professional development across your organization.
        </Typography>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <People sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} color="#0F172A">{totalEmployees}</Typography>
                <Typography variant="caption" color="#94A3B8">Active Team Members</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: overallAvg >= 70 ? '#ECFDF5' : '#FFFBEB', color: overallAvg >= 70 ? '#10B981' : '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} color="#0F172A">{overallAvg}%</Typography>
                <Typography variant="caption" color="#94A3B8">Avg. Performance Score</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: '#FFFBEB', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmojiEvents sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} color="#0F172A">{topPerformers}</Typography>
                <Typography variant="caption" color="#94A3B8">Top Performers (80%+)</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Employee accordion list */}
      <Card sx={{ overflow: 'visible' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0' }}>
            <Typography variant="h6" fontWeight={700} color="#0F172A">Team Member Profiles</Typography>
            <Typography variant="body2" color="#64748B">Individual evaluation results and development progress</Typography>
          </Box>

          {Object.entries(byEmployee).map(([email, empResults], idx) => {
            const avgScore = Math.round(empResults.reduce((a, r) => a + r.percentage, 0) / empResults.length);
            const empPath = paths.find((p) => p.user_email === email);

            return (
              <Accordion key={email} sx={{ mx: 2, my: 1, '&:first-of-type': { mt: 2 } }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Avatar sx={{
                      width: 38, height: 38, fontSize: 14, fontWeight: 700,
                      bgcolor: ['#EFF6FF', '#F5F3FF', '#ECFDF5', '#FEF3C7', '#FEE2E2'][idx % 5],
                      color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][idx % 5],
                    }}>
                      {email[0].toUpperCase()}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={600} color="#0F172A">{email}</Typography>
                      <Typography variant="caption" color="#94A3B8">{empResults.length} evaluations completed</Typography>
                    </Box>
                    <Chip
                      label={`${avgScore}% avg`}
                      size="small"
                      sx={{
                        fontWeight: 700, mr: 1,
                        bgcolor: avgScore >= 70 ? '#ECFDF5' : avgScore >= 50 ? '#FFFBEB' : '#FEE2E2',
                        color: avgScore >= 70 ? '#059669' : avgScore >= 50 ? '#D97706' : '#DC2626',
                      }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: '10px' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Evaluation</TableCell>
                          <TableCell>Score</TableCell>
                          <TableCell>Performance</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {empResults.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell><Typography variant="body2" fontWeight={500}>{r.assessment_name}</Typography></TableCell>
                            <TableCell>{r.score}/{r.total}</TableCell>
                            <TableCell>
                              <Chip label={`${r.percentage}%`} size="small" sx={{
                                fontWeight: 700, fontSize: '0.75rem',
                                bgcolor: r.percentage >= 70 ? '#ECFDF5' : r.percentage >= 50 ? '#FFFBEB' : '#FEE2E2',
                                color: r.percentage >= 70 ? '#059669' : r.percentage >= 50 ? '#D97706' : '#DC2626',
                              }} />
                            </TableCell>
                            <TableCell><Typography variant="caption" color="#94A3B8">{new Date(r.completed_at).toLocaleDateString()}</Typography></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {empPath && (
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px' }}>
                      <Typography variant="subtitle2" color="#64748B" mb={1.5}>GROWTH ROADMAP</Typography>
                      <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
                        {/* strengths/weaknesses are objects ({skill, evidence, ...});
                            tolerate the legacy string format too, and skip blanks. */}
                        {empPath.strengths?.map((s, i) => {
                          const skill = typeof s === 'string' ? s : s?.skill;
                          if (!skill) return null;
                          return <Chip key={`s-${i}`} icon={<TrendingUp sx={{ fontSize: 12 }} />} label={skill} size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 600, fontSize: '0.7rem', '& .MuiChip-icon': { color: '#059669' } }} />;
                        })}
                        {empPath.weaknesses?.map((w, i) => {
                          const skill = typeof w === 'string' ? w : w?.skill;
                          if (!skill) return null;
                          return <Chip key={`w-${i}`} icon={<Warning sx={{ fontSize: 12 }} />} label={skill} size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 600, fontSize: '0.7rem', '& .MuiChip-icon': { color: '#DC2626' } }} />;
                        })}
                        {!empPath.strengths?.length && !empPath.weaknesses?.length && (
                          <Typography variant="caption" color="#94A3B8">Not enough activity yet to identify specific strengths or focus areas.</Typography>
                        )}
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box flex={1}>
                          <LinearProgress variant="determinate" value={empPath.overall_score || 0} sx={{
                            height: 8, borderRadius: 4, bgcolor: '#E2E8F0',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                              borderRadius: 4,
                            },
                          }} />
                        </Box>
                        <Typography variant="body2" fontWeight={700} color="#0F172A">{empPath.overall_score}%</Typography>
                      </Box>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}

          {Object.keys(byEmployee).length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Box sx={{ width: 72, height: 72, borderRadius: '20px', bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <People sx={{ fontSize: 32, color: '#94A3B8' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} color="#334155" mb={0.5}>No workforce data yet</Typography>
              <Typography variant="body2" color="#94A3B8">Team analytics will populate as members complete evaluations</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
