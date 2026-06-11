import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Chip,
  CircularProgress,
} from '@mui/material';
import { Add, Delete, Style, LayersOutlined, Public, Lock } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getFlashcardSets, createFlashcardSet, deleteFlashcardSet } from '../../api/flashcards';
import { getDocuments } from '../../api/documents';
import { getDepartments } from '../../api/auth';
import { fadeInUp, brandPillButton, glassShineHover } from '../../theme/glass';
import { formatDueDate } from '../../utils/dueDate';

export default function FlashcardsPage() {
  const theme = useTheme();
  const [sets, setSets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', document_id: '', num_cards: 10, difficulty: 'medium', card_style: 'scenario', access_type: 'all', departments: [], due_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    getFlashcardSets().then((r) => setSets(r.data)).catch(() => {});
    getDocuments().then((r) => setDocuments(r.data)).catch(() => {});
    getDepartments().then((r) => setDepartments(r.data.departments)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      await createFlashcardSet(form);
      setSuccess('Training set generated successfully');
      setOpen(false);
      setForm({ name: '', document_id: '', num_cards: 10, difficulty: 'medium', card_style: 'scenario', access_type: 'all', departments: [], due_date: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create training set');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this training set?')) return;
    await deleteFlashcardSet(id);
    load();
  };

  const difficultyConfig = {
    easy: { color: '#10B981', bg: theme.palette.custom.greenTint, label: 'Foundational' },
    medium: { color: '#F59E0B', bg: theme.palette.custom.amberTint, label: 'Intermediate' },
    hard: { color: '#EF4444', bg: theme.palette.custom.redTint, label: 'Advanced' },
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Retention Training</Typography>
          <Typography variant="body2" color="text.secondary">
            Generate AI-powered spaced repetition training sets from corporate knowledge documents.
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}
          sx={brandPillButton}
        >
          Build Training Set
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip icon={<Style sx={{ fontSize: 16 }} />} label={`${sets.length} Training Sets`} sx={{ bgcolor: theme.palette.custom.amberTint, color: '#D97706', fontWeight: 600 }} />
        <Chip label={`${sets.reduce((s, x) => s + (x.num_cards || 0), 0)} Total Cards`} sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 500 }} />
      </Box>

      <Grid container spacing={2}>
        {sets.map((s, idx) => {
          const dc = difficultyConfig[s.difficulty] || difficultyConfig.medium;
          return (
            <Grid item xs={12} sm={6} md={4} key={s.id}>
              <Card sx={{
                ...fadeInUp(idx * 40),
                ...glassShineHover,
                '&:hover': { borderColor: dc.color, transform: 'translateY(-3px)' },
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" gap={2} alignItems="flex-start">
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '12px',
                      bgcolor: theme.palette.custom.amberTint, color: '#F59E0B',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <LayersOutlined sx={{ fontSize: 22 }} />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>{s.name}</Typography>
                      <Typography variant="caption" color="text.disabled" noWrap>{s.document_name}</Typography>
                      <Box mt={1} display="flex" gap={0.5} flexWrap="wrap">
                        <Chip label={`${s.num_cards} cards`} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }} />
                        <Chip label={dc.label} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: dc.bg, color: dc.color }} />
                        <Chip
                          icon={s.access_type === 'all' || !s.access_type ? <Public sx={{ fontSize: 12 }} /> : <Lock sx={{ fontSize: 12 }} />}
                          label={s.access_type === 'all' || !s.access_type ? 'All Teams' : 'Restricted'}
                          size="small"
                          sx={{
                            fontSize: '0.65rem', height: 22, fontWeight: 600,
                            bgcolor: s.access_type === 'all' || !s.access_type ? theme.palette.custom.blueTint : theme.palette.custom.amberTint,
                            color: s.access_type === 'all' || !s.access_type ? '#3B82F6' : '#D97706',
                            '& .MuiChip-icon': { color: 'inherit' },
                          }}
                        />
                        {s.due_date && (
                          <Chip
                            label={`Due ${formatDueDate(s.due_date)}`}
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: theme.palette.custom.amberTint, color: '#D97706' }}
                          />
                        )}
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={() => handleDelete(s.id)} sx={{ color: 'text.disabled', '&:hover': { color: '#EF4444', bgcolor: theme.palette.custom.redTint } }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
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
              <Typography variant="h6" fontWeight={600} color="text.primary" mb={0.5}>No training sets yet</Typography>
              <Typography variant="body2" color="text.disabled" mb={2}>Generate spaced repetition cards from your uploaded resources</Typography>
              <Button variant="outlined" startIcon={<Add />} onClick={() => setOpen(true)} sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '10px' }}>
                Build First Training Set
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem' }}>Build Retention Training Set</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
          <TextField fullWidth label="Training Set Name" placeholder="e.g. Q1 Compliance Training" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Source Document</InputLabel>
            <Select value={form.document_id} onChange={(e) => setForm({ ...form, document_id: e.target.value })} label="Source Document">
              {documents.map((d) => <MenuItem key={d.id} value={d.id}>{d.filename}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Number of Cards" type="number" value={form.num_cards} onChange={(e) => setForm({ ...form, num_cards: parseInt(e.target.value) || 10 })} margin="normal" inputProps={{ min: 1, max: 30 }} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Card Style</InputLabel>
            <Select value={form.card_style} onChange={(e) => setForm({ ...form, card_style: e.target.value })} label="Card Style">
              <MenuItem value="scenario">Workplace Scenario — situation → best practice (SOPs, policies)</MenuItem>
              <MenuItem value="technical">Technical Workshop — concept → explanation → example (tech stacks)</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Proficiency Level</InputLabel>
            <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} label="Proficiency Level">
              <MenuItem value="easy">Foundational</MenuItem>
              <MenuItem value="medium">Intermediate</MenuItem>
              <MenuItem value="hard">Advanced</MenuItem>
            </Select>
          </FormControl>
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
          <TextField
            fullWidth
            label="Due Date (optional)"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            helperText="Employees should study it before end of this day (Pakistan time). Leave blank for no deadline."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading}
            sx={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', borderRadius: '10px', px: 3 }}>
            {loading ? <CircularProgress size={20} /> : 'Generate Cards'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
