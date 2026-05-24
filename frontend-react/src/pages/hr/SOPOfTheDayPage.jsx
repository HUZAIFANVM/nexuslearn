import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  IconButton, Alert, TextField, Switch, Snackbar,
} from '@mui/material';
import {
  MenuBook, Add, Delete, CheckCircle, Cancel,
  LightbulbOutlined, TipsAndUpdates, AutoAwesome,
  Schedule, PlayArrow, Warning, SmartToy, Person,
} from '@mui/icons-material';
import { fadeInUp, brandPillButton, glassShineHover, floatGently } from '../../theme/glass';
import { useTheme } from '@mui/material/styles';
import { getDocuments } from '../../api/documents';
import {
  createSOPOfTheDay, getSOPHistory, deactivateSOPOfTheDay,
  getAutomationConfig, updateAutomationConfig, triggerAutomation,
} from '../../api/sopOfTheDay';

export default function SOPOfTheDayPage() {
  const theme = useTheme();
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Automation state
  const [autoConfig, setAutoConfig] = useState(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = () => {
    getSOPHistory().then((r) => setHistory(r.data || [])).catch(() => {});
    getDocuments().then((r) => setDocuments(r.data || [])).catch(() => {});
    getAutomationConfig().then((r) => setAutoConfig(r.data)).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const activeSop = history.find((s) => s.is_active);

  const handleCreate = async () => {
    if (!selectedDoc) return;
    setCreating(true);
    setError('');
    try {
      await createSOPOfTheDay(selectedDoc);
      setDialogOpen(false);
      setSelectedDoc('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create SOP of the Day');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivateSOPOfTheDay(id);
      fetchData();
    } catch { /* ignore */ }
  };

  // --- Automation Handlers ---

  const handleAutoToggle = async (enabled) => {
    setAutoLoading(true);
    try {
      const res = await updateAutomationConfig({ enabled });
      setAutoConfig(res.data);
      setSnackbar({
        open: true,
        message: enabled ? 'Automation enabled' : 'Automation disabled',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to update automation',
        severity: 'error',
      });
    } finally {
      setAutoLoading(false);
    }
  };

  const handleAutoTimeChange = async (time) => {
    try {
      const res = await updateAutomationConfig({ schedule_time: time });
      setAutoConfig(res.data);
    } catch { /* ignore */ }
  };

  const handleAutoDocChange = async (docId) => {
    setAutoLoading(true);
    try {
      const res = await updateAutomationConfig({ document_id: docId });
      setAutoConfig(res.data);
      setSnackbar({
        open: true,
        message: 'Source document updated. Topic history cleared.',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to update document',
        severity: 'error',
      });
    } finally {
      setAutoLoading(false);
    }
  };

  const handleReuseSameDoc = async () => {
    setAutoLoading(true);
    try {
      const res = await updateAutomationConfig({ clear_history: true });
      setAutoConfig(res.data);
      setSnackbar({
        open: true,
        message: 'Topic history cleared. Automation will start fresh.',
        severity: 'success',
      });
    } catch { /* ignore */ }
    finally { setAutoLoading(false); }
  };

  const handleTriggerNow = async () => {
    setTriggerLoading(true);
    try {
      await triggerAutomation();
      setSnackbar({
        open: true,
        message: 'SOP generated successfully!',
        severity: 'success',
      });
      fetchData();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to trigger generation',
        severity: 'error',
      });
    } finally {
      setTriggerLoading(false);
    }
  };

  const SourceBadge = ({ source }) => (
    <Chip
      label={source === 'automated' ? 'Auto' : 'Manual'}
      size="small"
      icon={source === 'automated' ? <SmartToy sx={{ fontSize: 12 }} /> : <Person sx={{ fontSize: 12 }} />}
      sx={{
        bgcolor: source === 'automated' ? '#EDE9FE' : '#F0FDF4',
        color: source === 'automated' ? '#7C3AED' : '#16A34A',
        fontWeight: 600,
        fontSize: '0.65rem',
        height: 22,
        '& .MuiChip-icon': { color: source === 'automated' ? '#7C3AED' : '#16A34A' },
      }}
    />
  );

  return (
    <Box>
      {/* Header */}
      <Card sx={{
        ...fadeInUp(0), ...glassShineHover,
        mb: 2.5, position: 'relative', overflow: 'hidden',
        background: (t) => t.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.85) 60%, rgba(51,65,85,0.85) 100%)'
          : 'linear-gradient(135deg, rgba(245,158,11,0.92) 0%, rgba(249,115,22,0.92) 60%, rgba(220,38,38,0.85) 100%)',
        color: '#fff',
      }}>
        <Box sx={{
          position: 'absolute', top: -40, right: -40, width: 220, height: 220,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
          ...floatGently,
        }} />
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Chip
              icon={<MenuBook sx={{ fontSize: 14 }} />}
              label="SOP of the Day"
              size="small"
              sx={{ mb: 2, bgcolor: 'rgba(245,158,11,0.2)', color: '#FCD34D', fontWeight: 600, borderRadius: '8px', '& .MuiChip-icon': { color: '#FCD34D' } }}
            />
            <Typography variant="h4" fontWeight={700} mb={0.5}>
              SOP of the Day
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: 500 }}>
              Set a daily SOP highlight from your ingested documents. All employees see it as a notification when they log in.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              mt: 1,
              ...brandPillButton,
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
              '&:hover': {
                background: 'rgba(255,255,255,0.28)',
                borderColor: 'rgba(255,255,255,0.45)',
                boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Set New SOP
          </Button>
        </CardContent>
      </Card>

      {/* Automation Settings Card */}
      {autoConfig && (
        <Card sx={{
          mb: 3, borderRadius: '16px',
          border: autoConfig.document_exhausted ? '2px solid #EF4444' : 1, borderColor: autoConfig.document_exhausted ? '#EF4444' : 'divider',
        }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Schedule sx={{ fontSize: 22, color: '#fff' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    Automation Settings
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Auto-generate a unique SOP daily from one document
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  size="small"
                  label={
                    autoConfig.document_exhausted ? 'Exhausted' :
                    !autoConfig.enabled ? 'Disabled' :
                    !autoConfig.document_id ? 'No Document' : 'Active'
                  }
                  sx={{
                    fontWeight: 600,
                    bgcolor: autoConfig.document_exhausted ? theme.palette.custom.redTint :
                             autoConfig.enabled && autoConfig.document_id ? theme.palette.custom.greenTint : 'action.hover',
                    color: autoConfig.document_exhausted ? '#DC2626' :
                           autoConfig.enabled && autoConfig.document_id ? '#059669' : 'text.secondary',
                  }}
                />
                <Switch
                  checked={autoConfig.enabled}
                  onChange={(e) => handleAutoToggle(e.target.checked)}
                  disabled={autoLoading}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#8B5CF6' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8B5CF6' },
                  }}
                />
              </Box>
            </Box>

            {/* Exhaustion Alert */}
            {autoConfig.document_exhausted && (
              <Alert
                severity="warning"
                icon={<Warning />}
                sx={{ mb: 2, borderRadius: '12px' }}
                action={
                  <Box display="flex" gap={1}>
                    <Button size="small" onClick={handleReuseSameDoc} disabled={autoLoading}
                      sx={{ textTransform: 'none', fontWeight: 600 }}>
                      Reuse Same Doc
                    </Button>
                  </Box>
                }
              >
                All topics covered from &quot;{autoConfig.document_name}&quot;. Select a new document below or reuse the same one to start fresh.
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* Schedule Time */}
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Daily Schedule"
                  type="time"
                  value={autoConfig.schedule_time}
                  onChange={(e) => handleAutoTimeChange(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  disabled={!autoConfig.enabled}
                />
              </Grid>

              {/* Document Selector */}
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Source Document</InputLabel>
                  <Select
                    value={autoConfig.document_id || ''}
                    onChange={(e) => handleAutoDocChange(e.target.value)}
                    label="Source Document"
                    disabled={!autoConfig.enabled || autoLoading}
                  >
                    {documents.map((doc) => (
                      <MenuItem key={doc.id} value={doc.id}>{doc.filename}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Stats */}
              <Grid item xs={12} sm={2}>
                <Box sx={{
                  p: 1, borderRadius: '10px', bgcolor: 'background.default', textAlign: 'center',
                  height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                }}>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    {autoConfig.generated_count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Generated</Typography>
                </Box>
              </Grid>

              {/* Trigger Button */}
              <Grid item xs={12} sm={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={triggerLoading ? <CircularProgress size={16} /> : <PlayArrow />}
                  onClick={handleTriggerNow}
                  disabled={triggerLoading || !autoConfig.document_id || autoConfig.document_exhausted}
                  sx={{
                    height: '100%',
                    minHeight: 40,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '10px',
                    borderColor: '#8B5CF6',
                    color: '#8B5CF6',
                    '&:hover': { borderColor: '#7C3AED', bgcolor: theme.palette.custom.purpleTint },
                  }}
                >
                  {triggerLoading ? 'Generating...' : 'Trigger Now'}
                </Button>
              </Grid>
            </Grid>

            {/* Previously covered topics */}
            {autoConfig.previous_topics.length > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                  PREVIOUSLY COVERED TOPICS ({autoConfig.previous_topics.length})
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {autoConfig.previous_topics.map((topic, i) => (
                    <Chip key={i} label={topic} size="small"
                      sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontSize: '0.7rem' }} />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Currently Active */}
      {activeSop && (
        <Card sx={{ mb: 2.5, border: '2px solid #F59E0B', borderRadius: '16px' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MenuBook sx={{ fontSize: 22, color: '#fff' }} />
                </Box>
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Chip label="Currently Active" size="small" icon={<CheckCircle sx={{ fontSize: 14 }} />}
                      sx={{ bgcolor: theme.palette.custom.greenTint, color: '#059669', fontWeight: 700, '& .MuiChip-icon': { color: '#059669' } }} />
                    <SourceBadge source={activeSop.source} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="text.primary">{activeSop.title}</Typography>
                </Box>
              </Box>
              <IconButton onClick={() => handleDeactivate(activeSop.id)} sx={{ color: '#EF4444' }}>
                <Delete />
              </IconButton>
            </Box>

            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'background.default', border: 1, borderColor: 'divider', mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <LightbulbOutlined sx={{ fontSize: 16, color: '#F59E0B' }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary">OVERVIEW</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">{activeSop.summary}</Typography>
            </Box>

            <Grid container spacing={1.5} mb={2}>
              {activeSop.key_points?.map((point, i) => (
                <Grid item xs={12} sm={4} key={i}>
                  <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: theme.palette.custom.blueTint, height: '100%' }}>
                    <Typography variant="caption" fontWeight={700} color="#3B82F6" display="block" mb={0.3}>
                      Key Point {i + 1}
                    </Typography>
                    <Typography variant="caption" color="text.primary">{point}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: theme.palette.custom.amberTint, border: '1px solid #FDE68A' }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <TipsAndUpdates sx={{ fontSize: 16, color: '#D97706' }} />
                <Typography variant="caption" fontWeight={700} color="#92400E">TODAY'S TIP</Typography>
              </Box>
              <Typography variant="body2" color="#78350F">{activeSop.practical_tip}</Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mt={2}>
              <Typography variant="caption" color="text.disabled">
                Source: {activeSop.document_name}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Created: {new Date(activeSop.created_at).toLocaleDateString()} by {activeSop.created_by}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={700} color="text.primary" mb={0.5}>History</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>Previous SOP of the Day entries</Typography>

          {history.filter((s) => !s.is_active).length > 0 ? (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {history.filter((s) => !s.is_active).map((sop) => (
                <Box key={sop.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 2, p: 2,
                  borderRadius: '12px', border: 1, borderColor: 'divider',
                  transition: 'all 0.15s', '&:hover': { bgcolor: 'background.default' },
                }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: '10px', bgcolor: 'action.hover',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <MenuBook sx={{ fontSize: 20, color: 'text.disabled' }} />
                  </Box>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>{sop.title}</Typography>
                    <Typography variant="caption" color="text.disabled" noWrap>{sop.document_name}</Typography>
                  </Box>
                  <SourceBadge source={sop.source} />
                  <Chip
                    icon={<Cancel sx={{ fontSize: 12 }} />}
                    label="Inactive"
                    size="small"
                    sx={{ bgcolor: 'action.hover', color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem', '& .MuiChip-icon': { color: 'text.disabled' } }}
                  />
                  <Typography variant="caption" color="text.disabled" sx={{ minWidth: 80, textAlign: 'right' }}>
                    {new Date(sop.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '16px', bgcolor: 'action.hover',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
              }}>
                <MenuBook sx={{ fontSize: 28, color: 'text.disabled' }} />
              </Box>
              <Typography variant="body2" color="text.secondary" mb={0.5}>No past entries yet</Typography>
              <Typography variant="caption" color="text.disabled">Previous SOP of the Day highlights will appear here</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => !creating && setDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '12px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AutoAwesome sx={{ fontSize: 20, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">Set SOP of the Day</Typography>
              <Typography variant="caption" color="text.secondary">AI will generate an engaging highlight</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Document</InputLabel>
            <Select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              label="Select Document"
              disabled={creating}
            >
              {documents.map((doc) => (
                <MenuItem key={doc.id} value={doc.id}>{doc.filename}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {creating && (
            <Box display="flex" alignItems="center" gap={1.5} mt={2} sx={{ p: 2, borderRadius: '12px', bgcolor: theme.palette.custom.amberTint }}>
              <CircularProgress size={20} sx={{ color: '#F59E0B' }} />
              <Typography variant="body2" color="#92400E" fontWeight={500}>
                AI is generating the SOP highlight...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={creating}
            sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!selectedDoc || creating}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #D97706 0%, #EA580C 100%)' },
            }}
          >
            {creating ? 'Generating...' : 'Generate & Set'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: '10px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
