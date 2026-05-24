import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Table, TableHead, TableBody, TableRow,
  TableCell, Chip, Button, CircularProgress, Alert, Snackbar, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import { CheckCircle, Cancel, HourglassEmpty } from '@mui/icons-material';
import { listHRs, approveHR, rejectHR } from '../../api/admin';
import { fadeInUp, brandPillButton, glassShineHover, floatGently } from '../../theme/glass';

const STATUS_LABEL = {
  pending: { label: 'Pending', color: 'warning', icon: <HourglassEmpty fontSize="small" /> },
  approved: { label: 'Approved', color: 'success', icon: <CheckCircle fontSize="small" /> },
  rejected: { label: 'Rejected', color: 'error', icon: <Cancel fontSize="small" /> },
};

export default function PendingHRsPage() {
  const [tab, setTab] = useState('pending');
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState(null);

  // reject dialog
  const [rejectDialog, setRejectDialog] = useState({ open: false, hr: null });
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const fetchHRs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listHRs(tab);
      setHrs(res.data.hrs || []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load HR users');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchHRs(); }, [fetchHRs]);

  const handleApprove = async (hr) => {
    setActing(true);
    try {
      await approveHR(hr.id);
      setSnack({ severity: 'success', message: `${hr.full_name || hr.email} approved` });
      fetchHRs();
    } catch (e) {
      setSnack({ severity: 'error', message: e.response?.data?.detail || 'Approve failed' });
    } finally {
      setActing(false);
    }
  };

  const openReject = (hr) => {
    setRejectReason('');
    setRejectDialog({ open: true, hr });
  };

  const submitReject = async () => {
    const hr = rejectDialog.hr;
    setActing(true);
    try {
      await rejectHR(hr.id, rejectReason.trim());
      setSnack({ severity: 'success', message: `${hr.full_name || hr.email} rejected` });
      setRejectDialog({ open: false, hr: null });
      fetchHRs();
    } catch (e) {
      setSnack({ severity: 'error', message: e.response?.data?.detail || 'Reject failed' });
    } finally {
      setActing(false);
    }
  };

  return (
    <Box>
      {/* Glass hero */}
      <Box sx={{
        ...fadeInUp(0),
        position: 'relative', overflow: 'hidden',
        borderRadius: '20px', mb: 2.5, p: 3, color: '#fff',
        background: (t) => t.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.85) 100%)'
          : 'linear-gradient(135deg, rgba(99,102,241,0.92) 0%, rgba(139,92,246,0.92) 100%)',
        border: '1px solid', borderColor: 'rgba(255,255,255,0.18)',
        boxShadow: '0 20px 60px -10px rgba(99,102,241,0.35)',
      }}>
        <Box sx={{
          position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
          ...floatGently,
        }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" fontWeight={800} mb={0.5} sx={{ letterSpacing: '-0.02em' }}>HR Account Approvals</Typography>
          <Typography variant="body2" sx={{ opacity: 0.78 }}>
            Review HR signups. Pending HRs cannot log in until you approve them.
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ ...fadeInUp(80) }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Pending" value="pending" />
          <Tab label="Approved" value="approved" />
          <Tab label="Rejected" value="rejected" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : hrs.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>No {tab} HR accounts.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Auth</TableCell>
                <TableCell>Signed up</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hrs.map((hr) => {
                const s = STATUS_LABEL[hr.status] || STATUS_LABEL.pending;
                return (
                  <TableRow key={hr.id} hover>
                    <TableCell>{hr.full_name || '—'}</TableCell>
                    <TableCell>{hr.email}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={s.color}
                        icon={s.icon}
                        label={s.label}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{hr.auth_provider || 'local'}</TableCell>
                    <TableCell>
                      {hr.created_at ? new Date(hr.created_at).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {hr.status !== 'approved' && (
                        <Button
                          size="small"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleApprove(hr)}
                          disabled={acting}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>
                      )}
                      {hr.status !== 'rejected' && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => openReject(hr)}
                          disabled={acting}
                        >
                          Reject
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog
        open={rejectDialog.open}
        onClose={() => !acting && setRejectDialog({ open: false, hr: null })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Reject HR account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {rejectDialog.hr?.email}
          </Typography>
          <TextField
            label="Reason (optional)"
            fullWidth
            multiline
            minRows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, hr: null })} disabled={acting}>
            Cancel
          </Button>
          <Button onClick={submitReject} color="error" variant="contained" disabled={acting}>
            {acting ? 'Rejecting…' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {snack ? <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
