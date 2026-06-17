import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, MenuItem, Select,
  FormControl, InputLabel, Chip, IconButton, Grid, Alert, Divider,
} from '@mui/material';
import { Add, Delete, Description, Style, Quiz, Route as RouteIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { createTrack, listTracks, deleteTrack } from '../../api/tracks';
import { getDocuments } from '../../api/documents';
import { getFlashcardSets } from '../../api/flashcards';
import { getAssessments } from '../../api/assessments';
import { getDepartments } from '../../api/auth';
import { fadeInUp, brandPillButton } from '../../theme/glass';

const TYPE_ICON = { document: <Description sx={{ fontSize: 16 }} />, flashcard_set: <Style sx={{ fontSize: 16 }} />, assessment: <Quiz sx={{ fontSize: 16 }} /> };

export default function HRTracksPage() {
  const theme = useTheme();
  const [tracks, setTracks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [docs, setDocs] = useState([]);
  const [sets, setSets] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', access_type: 'all', departments: [], items: [] });
  const [picker, setPicker] = useState({ type: 'document', resource_id: '' });
  const [msg, setMsg] = useState('');

  const load = () => { listTracks().then((r) => setTracks(r.data)).catch(() => {}); };
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

  const addItem = () => {
    const opt = options.find((o) => o.id === picker.resource_id);
    if (!opt) return;
    setForm({ ...form, items: [...form.items, { type: picker.type, resource_id: opt.id, title: opt.title }] });
    setPicker({ ...picker, resource_id: '' });
  };

  const submit = async () => {
    setMsg('');
    if (!form.name || form.items.length === 0) { setMsg('Add a name and at least one item.'); return; }
    try {
      await createTrack(form);
      setForm({ name: '', description: '', access_type: 'all', departments: [], items: [] });
      load();
    } catch (e) { setMsg(e.response?.data?.detail || 'Failed to create'); }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Learning Tracks</Typography>
        <Typography variant="body2" color="text.secondary">Sequence documents, training, and evaluations into a guided course.</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={fadeInUp(40)}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>New Track</Typography>
              {msg && <Alert severity="warning" sx={{ mb: 2 }}>{msg}</Alert>}
              <TextField fullWidth label="Track name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="dense" />
              <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} margin="dense" />
              <FormControl fullWidth margin="dense">
                <InputLabel>Access</InputLabel>
                <Select value={form.access_type} label="Access" onChange={(e) => setForm({ ...form, access_type: e.target.value })}>
                  <MenuItem value="all">Organization-wide</MenuItem>
                  <MenuItem value="specific">Department-specific</MenuItem>
                </Select>
              </FormControl>
              {form.access_type === 'specific' && (
                <FormControl fullWidth margin="dense">
                  <InputLabel>Departments</InputLabel>
                  <Select multiple value={form.departments} label="Departments" onChange={(e) => setForm({ ...form, departments: e.target.value })} renderValue={(sel) => sel.join(', ')}>
                    {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              )}

              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" fontWeight={600} mb={1}>Add items (in order)</Typography>
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
                <IconButton onClick={addItem} sx={{ bgcolor: theme.palette.custom.blueTint, color: '#3B82F6' }}><Add /></IconButton>
              </Box>
              {form.items.map((s, i) => (
                <Box key={i} display="flex" alignItems="center" gap={1} mb={0.5} sx={{ p: 1, borderRadius: '8px', bgcolor: 'action.hover' }}>
                  <Chip icon={TYPE_ICON[s.type]} label={`${i + 1}`} size="small" sx={{ height: 20 }} />
                  <Typography variant="body2" flex={1} noWrap>{s.title}</Typography>
                  <IconButton size="small" onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })}><Delete fontSize="small" /></IconButton>
                </Box>
              ))}
              <Button fullWidth variant="contained" onClick={submit} sx={{ ...brandPillButton, mt: 2 }}>Create Track</Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={fadeInUp(60)}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={1.5}>Existing Tracks</Typography>
              {tracks.length === 0 && <Typography variant="body2" color="text.disabled">None yet.</Typography>}
              {tracks.map((t) => (
                <Box key={t.id} display="flex" alignItems="center" gap={1} mb={1} sx={{ p: 1.5, borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: theme.palette.custom.blueTint, color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RouteIcon sx={{ fontSize: 18 }} /></Box>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600} noWrap>{t.name}</Typography>
                    <Typography variant="caption" color="text.disabled">{t.item_count} items · {t.access_type === 'all' ? 'All teams' : 'Restricted'}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => deleteTrack(t.id).then(load)}><Delete fontSize="small" /></IconButton>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
