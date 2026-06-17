import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, MenuItem, Select,
  FormControl, InputLabel, Chip, IconButton, Grid, Alert, Divider, LinearProgress,
} from '@mui/material';
import { Add, Delete, Description, Style, Quiz } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { createTemplate, listTemplates, deleteTemplate, getOnboardingStatus } from '../../api/onboarding';
import { getDocuments } from '../../api/documents';
import { getFlashcardSets } from '../../api/flashcards';
import { getAssessments } from '../../api/assessments';
import { getDepartments } from '../../api/auth';
import { fadeInUp, brandPillButton } from '../../theme/glass';

const TYPE_ICON = { document: <Description sx={{ fontSize: 16 }} />, flashcard_set: <Style sx={{ fontSize: 16 }} />, assessment: <Quiz sx={{ fontSize: 16 }} /> };

export default function HROnboardingPage() {
  const theme = useTheme();
  const [templates, setTemplates] = useState([]);
  const [status, setStatus] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [docs, setDocs] = useState([]);
  const [sets, setSets] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [form, setForm] = useState({ title: '', department: '', steps: [] });
  const [picker, setPicker] = useState({ type: 'document', resource_id: '' });
  const [msg, setMsg] = useState('');

  const load = () => {
    listTemplates().then((r) => setTemplates(r.data)).catch(() => {});
    getOnboardingStatus().then((r) => setStatus(r.data)).catch(() => {});
  };
  useEffect(() => {
    load();
    getDepartments().then((r) => setDepartments(r.data.departments)).catch(() => {});
    getDocuments().then((r) => setDocs(r.data)).catch(() => {});
    getFlashcardSets().then((r) => setSets(r.data)).catch(() => {});
    getAssessments().then((r) => setQuizzes(r.data)).catch(() => {});
  }, []);

  const options = picker.type === 'document'
    ? docs.map((d) => ({ id: d.id, title: d.filename }))
    : picker.type === 'flashcard_set'
      ? sets.map((s) => ({ id: s.id, title: s.name }))
      : quizzes.map((q) => ({ id: q.id, title: q.name }));

  const addStep = () => {
    const opt = options.find((o) => o.id === picker.resource_id);
    if (!opt) return;
    setForm({ ...form, steps: [...form.steps, { type: picker.type, resource_id: opt.id, title: opt.title }] });
    setPicker({ ...picker, resource_id: '' });
  };

  const submit = async () => {
    setMsg('');
    if (!form.title || form.steps.length === 0) { setMsg('Add a title and at least one step.'); return; }
    try {
      await createTemplate({ title: form.title, role: 'employee', department: form.department || null, steps: form.steps });
      setForm({ title: '', department: '', steps: [] });
      load();
    } catch (e) { setMsg(e.response?.data?.detail || 'Failed to create'); }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Onboarding Paths</Typography>
        <Typography variant="body2" color="text.secondary">Build role/department onboarding checklists for new hires and track their progress.</Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Builder */}
        <Grid item xs={12} md={6}>
          <Card sx={fadeInUp(40)}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>New Onboarding Path</Typography>
              {msg && <Alert severity="warning" sx={{ mb: 2 }}>{msg}</Alert>}
              <TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} margin="dense" placeholder="e.g. Engineering New Hire" />
              <FormControl fullWidth margin="dense">
                <InputLabel>Department (optional)</InputLabel>
                <Select value={form.department} label="Department (optional)" onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <MenuItem value="">All departments</MenuItem>
                  {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" fontWeight={600} mb={1}>Add steps</Typography>
              <Box display="flex" gap={1} mb={1}>
                <FormControl sx={{ minWidth: 130 }} size="small">
                  <Select value={picker.type} onChange={(e) => setPicker({ type: e.target.value, resource_id: '' })}>
                    <MenuItem value="document">Document</MenuItem>
                    <MenuItem value="flashcard_set">Training</MenuItem>
                    <MenuItem value="assessment">Evaluation</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <Select value={picker.resource_id} displayEmpty onChange={(e) => setPicker({ ...picker, resource_id: e.target.value })}>
                    <MenuItem value="" disabled>Select…</MenuItem>
                    {options.map((o) => <MenuItem key={o.id} value={o.id}>{o.title}</MenuItem>)}
                  </Select>
                </FormControl>
                <IconButton onClick={addStep} sx={{ bgcolor: theme.palette.custom.blueTint, color: '#3B82F6' }}><Add /></IconButton>
              </Box>

              {form.steps.map((s, i) => (
                <Box key={i} display="flex" alignItems="center" gap={1} mb={0.5} sx={{ p: 1, borderRadius: '8px', bgcolor: 'action.hover' }}>
                  <Chip icon={TYPE_ICON[s.type]} label={`${i + 1}`} size="small" sx={{ height: 20 }} />
                  <Typography variant="body2" flex={1} noWrap>{s.title}</Typography>
                  <IconButton size="small" onClick={() => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })}><Delete fontSize="small" /></IconButton>
                </Box>
              ))}

              <Button fullWidth variant="contained" onClick={submit} sx={{ ...brandPillButton, mt: 2 }}>Create Path</Button>
            </CardContent>
          </Card>

          {/* Existing templates */}
          <Card sx={{ mt: 2, ...fadeInUp(60) }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={1.5}>Existing Paths</Typography>
              {templates.length === 0 && <Typography variant="body2" color="text.disabled">None yet.</Typography>}
              {templates.map((t) => (
                <Box key={t.id} display="flex" alignItems="center" gap={1} mb={1} sx={{ p: 1.5, borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600}>{t.title}</Typography>
                    <Typography variant="caption" color="text.disabled">{t.department || 'All depts'} · {t.steps.length} steps</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => deleteTemplate(t.id).then(load)}><Delete fontSize="small" /></IconButton>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Status */}
        <Grid item xs={12} md={6}>
          <Card sx={fadeInUp(80)}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>New-hire Progress</Typography>
              {status.length === 0 && <Typography variant="body2" color="text.disabled">No employees with an assigned path yet.</Typography>}
              {status.map((e) => (
                <Box key={e.user_id} mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: '70%' }}>{e.full_name} <Typography component="span" variant="caption" color="text.disabled">· {e.department}</Typography></Typography>
                    <Typography variant="body2" fontWeight={700} color={e.percentage === 100 ? '#10B981' : '#3B82F6'}>{e.percentage}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={e.percentage} sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 3, background: e.percentage === 100 ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg,#3B82F6,#8B5CF6)' } }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
