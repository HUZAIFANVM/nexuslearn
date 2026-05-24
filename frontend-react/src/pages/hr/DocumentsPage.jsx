import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox, Switch,
  CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import { CloudUpload, Delete, Description, InsertDriveFile, FolderOpen, DocumentScanner } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getDocuments, uploadDocument, deleteDocument } from '../../api/documents';
import { fadeInUp, brandPillButton, glassShineHover } from '../../theme/glass';

export default function DocumentsPage() {
  const theme = useTheme();
  const [documents, setDocuments] = useState([]);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [options, setOptions] = useState({ chatbot: false, knowledge_cards: false, quiz: false, learning_path: false, use_ocr: false });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => getDocuments().then((r) => setDocuments(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('create_chatbot', options.chatbot);
    formData.append('create_knowledge_cards', options.knowledge_cards);
    formData.append('create_quiz', options.quiz);
    formData.append('create_learning_path', options.learning_path);
    formData.append('use_ocr', options.use_ocr);
    try {
      await uploadDocument(formData);
      setSuccess('Resource uploaded successfully');
      setOpen(false);
      setFile(null);
      setOptions({ chatbot: false, knowledge_cards: false, quiz: false, learning_path: false, use_ocr: false });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this resource from the library?')) return;
    await deleteDocument(id);
    load();
  };

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return { color: '#EF4444', bg: theme.palette.custom.redTint };
    if (type?.includes('word') || type?.includes('docx')) return { color: '#3B82F6', bg: theme.palette.custom.blueTint };
    return { color: '#64748B', bg: theme.palette.action.hover };
  };

  return (
    <Box>
      {/* Page header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Resource Library</Typography>
          <Typography variant="body2" color="text.secondary">
            Upload and manage corporate knowledge documents for AI-powered training features.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => setOpen(true)}
          sx={brandPillButton}
        >
          Upload Resource
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Stats bar */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        <Chip icon={<Description sx={{ fontSize: 16 }} />} label={`${documents.length} Resources`} sx={{ bgcolor: theme.palette.custom.blueTint, color: '#3B82F6', fontWeight: 600 }} />
        <Chip label={`${(documents.reduce((s, d) => s + (d.size || 0), 0) / (1024 * 1024)).toFixed(1)} MB Total`} sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 500 }} />
      </Box>

      <Grid container spacing={2}>
        {documents.map((doc, idx) => {
          const fi = getFileIcon(doc.content_type);
          return (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card sx={{
                ...fadeInUp(idx * 40),
                ...glassShineHover,
                '&:hover': { borderColor: `${fi.color}66`, transform: 'translateY(-3px)' },
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" gap={2} alignItems="flex-start">
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '12px',
                      bgcolor: fi.bg, color: fi.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <InsertDriveFile sx={{ fontSize: 22 }} />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={700} color="text.primary" noWrap mb={0.3}>{doc.filename}</Typography>
                      <Typography variant="caption" color="text.disabled">
                        {(doc.size / 1024).toFixed(1)} KB
                      </Typography>
                      <Box mt={1} display="flex" gap={0.5}>
                        <Chip
                          label={doc.content_type?.split('/').pop()?.toUpperCase() || 'FILE'}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: fi.bg, color: fi.color }}
                        />
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={() => handleDelete(doc.id)} sx={{ color: 'text.disabled', '&:hover': { color: '#EF4444', bgcolor: theme.palette.custom.redTint } }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {documents.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{
              textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: '16px',
              border: '2px dashed', borderColor: 'divider',
            }}>
              <Box sx={{
                width: 72, height: 72, borderRadius: '20px', bgcolor: 'action.hover',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
              }}>
                <FolderOpen sx={{ fontSize: 32, color: 'text.disabled' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} color="text.primary" mb={0.5}>No resources yet</Typography>
              <Typography variant="body2" color="text.disabled" mb={2}>
                Upload PDF, DOCX, or TXT files to power your AI training features
              </Typography>
              <Button
                variant="outlined" startIcon={<CloudUpload />} onClick={() => setOpen(true)}
                sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '10px' }}
              >
                Upload Your First Resource
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem' }}>Upload Resource</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
          <Box
            component="label"
            sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              py: 3, mt: 1, mb: 2, borderRadius: '14px',
              border: '2px dashed', borderColor: file ? '#3B82F6' : 'divider',
              bgcolor: file ? theme.palette.custom.blueTint : 'background.default', cursor: 'pointer',
              transition: 'all 0.2s', '&:hover': { borderColor: '#3B82F6', bgcolor: theme.palette.custom.blueTint },
            }}
          >
            <CloudUpload sx={{ fontSize: 36, color: file ? '#3B82F6' : 'text.disabled', mb: 1 }} />
            <Typography variant="body2" fontWeight={600} color={file ? '#3B82F6' : 'text.secondary'}>
              {file ? file.name : 'Click to select file'}
            </Typography>
            <Typography variant="caption" color="text.disabled">PDF, DOCX, or TXT</Typography>
            <input type="file" hidden accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files[0])} />
          </Box>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            p: 1.5, mb: 2, borderRadius: '10px', bgcolor: options.use_ocr ? theme.palette.custom.blueTint : 'action.hover',
            border: '1px solid', borderColor: options.use_ocr ? '#3B82F6' : 'divider',
            transition: 'all 0.2s',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DocumentScanner sx={{ fontSize: 20, color: options.use_ocr ? '#3B82F6' : 'text.disabled' }} />
              <Box>
                <Typography variant="body2" fontWeight={600} color={options.use_ocr ? '#3B82F6' : 'text.primary'}>
                  Enable OCR
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Extract text from images in PDFs (slower)
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Enable for scanned documents or PDFs with embedded images">
              <Switch
                checked={options.use_ocr}
                onChange={(e) => setOptions({ ...options, use_ocr: e.target.checked })}
                size="small"
              />
            </Tooltip>
          </Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
            AUTO-GENERATE FROM RESOURCE
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <FormControlLabel control={<Checkbox checked={options.chatbot} onChange={(e) => setOptions({ ...options, chatbot: e.target.checked })} />} label="Knowledge Assistant" />
            <FormControlLabel control={<Checkbox checked={options.knowledge_cards} onChange={(e) => setOptions({ ...options, knowledge_cards: e.target.checked })} />} label="Retention Training Cards" />
            <FormControlLabel control={<Checkbox checked={options.quiz} onChange={(e) => setOptions({ ...options, quiz: e.target.checked })} />} label="Competency Evaluation" />
            <FormControlLabel control={<Checkbox checked={options.learning_path} onChange={(e) => setOptions({ ...options, learning_path: e.target.checked })} />} label="Growth Roadmap" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleUpload} disabled={!file || uploading}
            sx={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              borderRadius: '10px', px: 3,
            }}
          >
            {uploading ? <CircularProgress size={20} /> : 'Upload & Process'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
