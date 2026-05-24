import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, IconButton,
  CircularProgress, Avatar,
} from '@mui/material';
import { Add, Delete, SmartToy, Public, Lock } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getChatbots, createChatbot, deleteChatbot } from '../../api/chatbots';
import { getDocuments } from '../../api/documents';
import { getDepartments } from '../../api/auth';
import { fadeInUp, brandPillButton, glassShineHover } from '../../theme/glass';

export default function ChatbotsPage() {
  const theme = useTheme();
  const [chatbots, setChatbots] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', document_id: '', access_type: 'all', departments: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    getChatbots().then((r) => setChatbots(r.data)).catch(() => {});
    getDocuments().then((r) => setDocuments(r.data)).catch(() => {});
    getDepartments().then((r) => setDepartments(r.data.departments)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      await createChatbot(form);
      setOpen(false);
      setForm({ name: '', document_id: '', access_type: 'all', departments: [] });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this knowledge assistant?')) return;
    await deleteChatbot(id);
    load();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Knowledge Assistants</Typography>
          <Typography variant="body2" color="text.secondary">
            Deploy AI-powered document assistants for natural language Q&A across your organization.
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}
          sx={brandPillButton}
        >
          Deploy Assistant
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip icon={<SmartToy sx={{ fontSize: 16 }} />} label={`${chatbots.length} Active Assistants`} sx={{ bgcolor: theme.palette.custom.purpleTint, color: '#8B5CF6', fontWeight: 600 }} />
      </Box>

      <Grid container spacing={2}>
        {chatbots.map((bot, idx) => (
          <Grid item xs={12} sm={6} md={4} key={bot.id}>
            <Card sx={{
              ...fadeInUp(idx * 40),
              ...glassShineHover,
              '&:hover': { borderColor: '#8B5CF6', transform: 'translateY(-3px)' },
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" gap={2} alignItems="flex-start">
                  <Avatar sx={{
                    width: 44, height: 44, borderRadius: '12px',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                  }}>
                    <SmartToy sx={{ fontSize: 22 }} />
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>{bot.name}</Typography>
                    <Typography variant="caption" color="text.disabled" noWrap>Source: {bot.document_name}</Typography>
                    <Box mt={1} display="flex" gap={0.5}>
                      <Chip
                        icon={bot.access_type === 'all' ? <Public sx={{ fontSize: 12 }} /> : <Lock sx={{ fontSize: 12 }} />}
                        label={bot.access_type === 'all' ? 'All Teams' : 'Restricted'}
                        size="small"
                        sx={{
                          fontSize: '0.65rem', height: 22, fontWeight: 600,
                          bgcolor: bot.access_type === 'all' ? theme.palette.custom.blueTint : theme.palette.custom.amberTint,
                          color: bot.access_type === 'all' ? '#3B82F6' : '#D97706',
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={() => handleDelete(bot.id)} sx={{ color: 'text.disabled', '&:hover': { color: '#EF4444', bgcolor: theme.palette.custom.redTint } }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {chatbots.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: '16px', border: '2px dashed', borderColor: 'divider' }}>
              <Box sx={{ width: 72, height: 72, borderRadius: '20px', bgcolor: theme.palette.custom.purpleTint, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <SmartToy sx={{ fontSize: 32, color: '#8B5CF6' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} color="text.primary" mb={0.5}>No assistants deployed</Typography>
              <Typography variant="body2" color="text.disabled" mb={2}>Create an AI assistant to enable natural language document queries</Typography>
              <Button variant="outlined" startIcon={<Add />} onClick={() => setOpen(true)} sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '10px' }}>
                Deploy First Assistant
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem' }}>Deploy Knowledge Assistant</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
          <TextField fullWidth label="Assistant Name" placeholder="e.g. Policy Advisor" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Source Document</InputLabel>
            <Select value={form.document_id} onChange={(e) => setForm({ ...form, document_id: e.target.value })} label="Source Document">
              {documents.map((d) => <MenuItem key={d.id} value={d.id}>{d.filename}</MenuItem>)}
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading}
            sx={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', borderRadius: '10px', px: 3 }}>
            {loading ? <CircularProgress size={20} /> : 'Deploy'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
