import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Chip,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Tabs, Tab, Avatar,
} from '@mui/material';
import { Add, Delete, Quiz, Assessment, BarChart, Public, Lock } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getAssessments, createAssessment, deleteAssessment, getAllResults } from '../../api/assessments';
import { getDocuments } from '../../api/documents';
import { getDepartments } from '../../api/auth';
import { fadeInUp, brandPillButton, glassShineHover } from '../../theme/glass';
import { formatDueDate } from '../../utils/dueDate';

export default function AssessmentsPage() {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', document_id: '', assessment_type: 'mcq', question_style: 'general', difficulty: 'medium', num_questions: 10, access_type: 'all', departments: [], time_limit_minutes: null, due_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    getAssessments().then((r) => setAssessments(r.data)).catch(() => {});
    getAllResults().then((r) => setResults(r.data)).catch(() => {});
    getDocuments().then((r) => setDocuments(r.data)).catch(() => {});
    getDepartments().then((r) => setDepartments(r.data.departments)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      await createAssessment(form);
      setOpen(false);
      setForm({ name: '', document_id: '', assessment_type: 'mcq', question_style: 'general', difficulty: 'medium', num_questions: 10, access_type: 'all', departments: [], time_limit_minutes: null, due_date: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const typeConfig = {
    mcq: { label: 'Multiple Choice', color: '#3B82F6', bg: theme.palette.custom.blueTint },
    scenario: { label: 'Scenario-Based', color: '#8B5CF6', bg: theme.palette.custom.purpleTint },
    mixed: { label: 'Comprehensive', color: '#10B981', bg: theme.palette.custom.greenTint },
  };

  const difficultyConfig = {
    easy: { label: 'Foundational', color: '#10B981', bg: theme.palette.custom.greenTint },
    medium: { label: 'Intermediate', color: '#F59E0B', bg: theme.palette.custom.amberTint },
    hard: { label: 'Advanced', color: '#EF4444', bg: theme.palette.custom.redTint },
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Competency Evaluations</Typography>
          <Typography variant="body2" color="text.secondary">
            Create AI-generated assessments to measure team proficiency and identify skill gaps.
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}
          sx={brandPillButton}
        >
          Create Evaluation
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
        mb: 3,
        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, color: 'text.disabled', fontSize: '0.9rem' },
        '& .Mui-selected': { color: 'text.primary' },
        '& .MuiTabs-indicator': { height: 3, borderRadius: 2, bgcolor: 'text.primary' },
      }}>
        <Tab icon={<Assessment sx={{ fontSize: 18 }} />} iconPosition="start" label={`Evaluations (${assessments.length})`} />
        <Tab icon={<BarChart sx={{ fontSize: 18 }} />} iconPosition="start" label={`Results (${results.length})`} />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2}>
          {assessments.map((a, idx) => {
            const tc = typeConfig[a.assessment_type] || typeConfig.mcq;
            const dc = difficultyConfig[a.difficulty] || difficultyConfig.medium;
            return (
              <Grid item xs={12} sm={6} md={4} key={a.id}>
                <Card sx={{
                  ...fadeInUp(idx * 40),
                  ...glassShineHover,
                  '&:hover': { borderColor: tc.color, transform: 'translateY(-3px)' },
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                      <Box sx={{
                        width: 44, height: 44, borderRadius: '12px',
                        bgcolor: theme.palette.custom.greenTint, color: '#10B981',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Quiz sx={{ fontSize: 22 }} />
                      </Box>
                      <IconButton size="small" onClick={() => { deleteAssessment(a.id).then(load); }} sx={{ color: 'text.disabled', '&:hover': { color: '#EF4444', bgcolor: theme.palette.custom.redTint } }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="text.primary" mb={0.3}>{a.name}</Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>{a.document_name}</Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      <Chip label={tc.label} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: tc.bg, color: tc.color }} />
                      <Chip label={dc.label} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: dc.bg, color: dc.color }} />
                      <Chip label={`${a.num_questions} Q`} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }} />
                      <Chip
                        icon={a.access_type === 'all' ? <Public sx={{ fontSize: 12 }} /> : <Lock sx={{ fontSize: 12 }} />}
                        label={a.access_type === 'all' ? 'All Teams' : 'Restricted'}
                        size="small"
                        sx={{
                          fontSize: '0.65rem', height: 22, fontWeight: 600,
                          bgcolor: a.access_type === 'all' ? theme.palette.custom.blueTint : theme.palette.custom.amberTint,
                          color: a.access_type === 'all' ? '#3B82F6' : '#D97706',
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                      {a.due_date && (
                        <Chip
                          label={`Due ${formatDueDate(a.due_date)}`}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: theme.palette.custom.amberTint, color: '#D97706' }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {assessments.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: '16px', border: '2px dashed', borderColor: 'divider' }}>
                <Box sx={{ width: 72, height: 72, borderRadius: '20px', bgcolor: theme.palette.custom.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Quiz sx={{ fontSize: 32, color: '#10B981' }} />
                </Box>
                <Typography variant="h6" fontWeight={600} color="text.primary" mb={0.5}>No evaluations created</Typography>
                <Typography variant="body2" color="text.disabled" mb={2}>Generate AI-powered competency assessments from your resources</Typography>
                <Button variant="outlined" startIcon={<Add />} onClick={() => setOpen(true)} sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '10px' }}>
                  Create First Evaluation
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {tab === 1 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Team Member</TableCell>
                  <TableCell>Evaluation</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Performance</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.length > 0 ? results.map((r) => (
                  <TableRow key={r.id} sx={{ '&:hover': { bgcolor: 'background.default' } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, bgcolor: theme.palette.custom.blueTint, color: '#3B82F6' }}>
                          {r.user_email?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>{r.user_email}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.primary">{r.assessment_name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{r.score}/{r.total}</Typography></TableCell>
                    <TableCell>
                      <Chip
                        label={`${r.percentage}%`} size="small"
                        sx={{
                          fontWeight: 700, fontSize: '0.75rem',
                          bgcolor: r.percentage >= 70 ? theme.palette.custom.greenTint : r.percentage >= 50 ? theme.palette.custom.amberTint : theme.palette.custom.redTint,
                          color: r.percentage >= 70 ? '#059669' : r.percentage >= 50 ? '#D97706' : '#DC2626',
                        }}
                      />
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.disabled">{new Date(r.completed_at).toLocaleDateString()}</Typography></TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box textAlign="center" py={4}>
                        <Typography variant="body2" color="text.disabled">No results yet. Team members need to complete evaluations first.</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem' }}>Create Competency Evaluation</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
          <TextField fullWidth label="Evaluation Name" placeholder="e.g. Q1 Security Compliance Check" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Source Document</InputLabel>
            <Select value={form.document_id} onChange={(e) => setForm({ ...form, document_id: e.target.value })} label="Source Document">
              {documents.map((d) => <MenuItem key={d.id} value={d.id}>{d.filename}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Evaluation Format</InputLabel>
            <Select value={form.assessment_type} onChange={(e) => setForm({ ...form, assessment_type: e.target.value })} label="Evaluation Format">
              <MenuItem value="mcq">Multiple Choice</MenuItem>
              <MenuItem value="scenario">Scenario-Based</MenuItem>
              <MenuItem value="mixed">Comprehensive (Mixed)</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Question Style</InputLabel>
            <Select value={form.question_style} onChange={(e) => setForm({ ...form, question_style: e.target.value })} label="Question Style">
              <MenuItem value="general">General — policy / business knowledge</MenuItem>
              <MenuItem value="technical">Technical / Coding — engineering workshop (output, bug-fix, API choice)</MenuItem>
            </Select>
            {form.question_style === 'technical' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                For hands-on code questions, pick a document that contains code, commands, or config. A purely conceptual document yields concept-level technical questions instead.
              </Typography>
            )}
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Proficiency Level</InputLabel>
            <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} label="Proficiency Level">
              <MenuItem value="easy">Foundational</MenuItem>
              <MenuItem value="medium">Intermediate</MenuItem>
              <MenuItem value="hard">Advanced</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth label="Number of Questions" type="number" value={form.num_questions} onChange={(e) => setForm({ ...form, num_questions: parseInt(e.target.value) || 10 })} margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Access Scope</InputLabel>
            <Select value={form.access_type} onChange={(e) => setForm({ ...form, access_type: e.target.value })} label="Access Scope">
              <MenuItem value="all">Organization-Wide</MenuItem>
              <MenuItem value="specific">Department-Specific</MenuItem>
            </Select>
          </FormControl>
          {form.access_type === 'specific' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Departments</InputLabel>
              <Select multiple value={form.departments} onChange={(e) => setForm({ ...form, departments: e.target.value })} label="Departments"
                renderValue={(sel) => sel.join(', ')}>
                {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          <TextField fullWidth label="Time Limit (minutes, optional)" type="number" value={form.time_limit_minutes || ''} onChange={(e) => setForm({ ...form, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null })} margin="normal" />
          <TextField
            fullWidth
            label="Due Date (optional)"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            helperText="Employees must complete it before end of this day (Pakistan time). Leave blank for no deadline."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading}
            sx={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '10px', px: 3 }}>
            {loading ? <CircularProgress size={20} /> : 'Generate Evaluation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
