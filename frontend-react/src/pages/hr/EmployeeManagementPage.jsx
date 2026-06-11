import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Avatar, Button,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, IconButton, Drawer, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, Pagination, Snackbar, Divider,
  LinearProgress, Tooltip,
} from '@mui/material';
import {
  Search, People, PersonOff, Business, Edit, Block, CheckCircle,
  LockReset, Close, Visibility, TrendingUp, School, Style, Quiz,
  Route, FlagCircle, Warning, Assignment, Build, EmojiEvents,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  getEmployees, getEmployeeStats, getEmployee,
  updateEmployee, deactivateEmployee, activateEmployee,
  resetPassword, bulkAction,
} from '../../api/employees';
import { getEmployeePath } from '../../api/learningPaths';
import { getAvatarUrl } from '../../api/auth';
import { fadeInUp, glassShineHover, floatGently } from '../../theme/glass';

export default function EmployeeManagementPage() {
  const theme = useTheme();
  // Data state
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Selection state
  const [selected, setSelected] = useState([]);

  // Detail drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ department: '', role: '', is_active: true });
  const [editEmployee, setEditEmployee] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Reset password dialog state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmployee, setResetEmployee] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Growth Roadmap dialog state
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [roadmapData, setRoadmapData] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapEmployee, setRoadmapEmployee] = useState(null);

  const departments = ['Data Engineer', 'AI Engineer', 'Software Engineer', 'QA Engineer', 'Data Analyst'];

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (department) params.department = department;
      if (statusFilter) params.status = statusFilter;
      const res = await getEmployees(params);
      setEmployees(res.data.employees);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, department, statusFilter]);

  const fetchStats = async () => {
    try {
      const res = await getEmployeeStats();
      setStats(res.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(employees.map((emp) => emp.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Detail drawer
  const openDetail = async (emp) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const res = await getEmployee(emp.id);
      setDetailEmployee(res.data);
    } catch {
      setDetailEmployee(emp);
    } finally {
      setDetailLoading(false);
    }
  };

  // Edit dialog
  const openEdit = (emp) => {
    setEditEmployee(emp);
    setEditData({
      department: emp.department || '',
      role: emp.role,
      is_active: emp.is_active,
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      await updateEmployee(editEmployee.id, editData);
      setSnackbar({ open: true, message: 'Employee updated successfully', severity: 'success' });
      setEditOpen(false);
      fetchEmployees();
      fetchStats();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Update failed', severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async (emp) => {
    try {
      if (emp.is_active) {
        await deactivateEmployee(emp.id);
        setSnackbar({ open: true, message: `${emp.full_name} deactivated`, severity: 'success' });
      } else {
        await activateEmployee(emp.id);
        setSnackbar({ open: true, message: `${emp.full_name} activated`, severity: 'success' });
      }
      fetchEmployees();
      fetchStats();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Action failed', severity: 'error' });
    }
  };

  // Reset password
  const openResetPassword = (emp) => {
    setResetEmployee(emp);
    setTempPassword('');
    setResetOpen(true);
  };

  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      const res = await resetPassword(resetEmployee.id);
      setTempPassword(res.data.temporary_password);
      setSnackbar({ open: true, message: 'Password reset successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Reset failed', severity: 'error' });
    } finally {
      setResetLoading(false);
    }
  };

  // Bulk action
  const handleBulkAction = async (action) => {
    try {
      const res = await bulkAction(selected, action);
      setSnackbar({ open: true, message: res.data.message, severity: 'success' });
      setSelected([]);
      fetchEmployees();
      fetchStats();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Bulk action failed', severity: 'error' });
    }
  };

  // View Growth Roadmap
  const openRoadmap = async (emp) => {
    setRoadmapEmployee(emp);
    setRoadmapData(null);
    setRoadmapOpen(true);
    setRoadmapLoading(true);
    try {
      const res = await getEmployeePath(emp.id || emp._id);
      setRoadmapData(res.data);
    } catch {
      setRoadmapData(null);
    } finally {
      setRoadmapLoading(false);
    }
  };

  const severityConfig = {
    critical: { color: '#EF4444', bg: theme.palette.custom.redTint, label: 'Critical' },
    moderate: { color: '#F59E0B', bg: theme.palette.custom.amberTint, label: 'Moderate' },
    minor: { color: '#3B82F6', bg: theme.palette.custom.blueTint, label: 'Minor' },
  };

  const priorityConfig = {
    high: { color: '#EF4444', bg: theme.palette.custom.redTint },
    medium: { color: '#F59E0B', bg: theme.palette.custom.amberTint },
    low: { color: '#10B981', bg: theme.palette.custom.greenTint },
  };

  return (
    <Box>
      {/* Hero Header — glass with brand gradient bleed */}
      <Card sx={{
        ...fadeInUp(0), ...glassShineHover,
        position: 'relative', overflow: 'hidden',
        background: (t) => t.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.85) 100%)'
          : 'linear-gradient(135deg, rgba(99,102,241,0.92) 0%, rgba(139,92,246,0.92) 100%)',
        color: '#fff', mb: 2.5,
      }}>
        <Box sx={{
          position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
          ...floatGently,
        }} />
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" fontWeight={800} mb={0.5} sx={{ letterSpacing: '-0.02em' }}>Employee Management</Typography>
          <Typography variant="body2" sx={{ opacity: 0.78 }}>
            Manage your workforce, track learning progress, and maintain team accounts.
          </Typography>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <Grid container spacing={2} mb={2}>
        {[
          { label: 'Total Employees', value: stats?.total || 0, icon: <People />, color: '#3B82F6', bg: theme.palette.custom.blueTint },
          { label: 'Active', value: stats?.active || 0, icon: <CheckCircle />, color: '#10B981', bg: theme.palette.custom.greenTint },
          { label: 'Inactive', value: stats?.inactive || 0, icon: <PersonOff />, color: '#EF4444', bg: theme.palette.custom.redTint },
          { label: 'Departments', value: stats?.departments || 0, icon: <Business />, color: '#8B5CF6', bg: theme.palette.custom.purpleTint },
        ].map((stat, idx) => (
          <Grid item xs={6} md={3} key={stat.label}>
            <Card sx={{ ...fadeInUp(60 + idx * 30), ...glassShineHover }}>
              <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '14px',
                  bgcolor: stat.bg, color: stat.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  ...floatGently,
                }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={800} color="text.primary">{stat.value}</Typography>
                  <Typography variant="caption" color="text.disabled">{stat.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search & Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.disabled' }} /></InputAdornment>,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Department</InputLabel>
            <Select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} label="Department">
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} label="Status">
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selected.length > 0 && (
        <Card sx={{ mb: 2, bgcolor: theme.palette.custom.blueTint, border: '1px solid #BFDBFE' }}>
          <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" fontWeight={600} color="#1E40AF">
              {selected.length} selected
            </Typography>
            <Button size="small" variant="contained" color="success" onClick={() => handleBulkAction('activate')}
              sx={{ textTransform: 'none', borderRadius: '8px' }}>
              Activate
            </Button>
            <Button size="small" variant="contained" color="error" onClick={() => handleBulkAction('deactivate')}
              sx={{ textTransform: 'none', borderRadius: '8px' }}>
              Deactivate
            </Button>
            <Button size="small" onClick={() => setSelected([])} sx={{ textTransform: 'none', ml: 'auto' }}>
              Clear Selection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Employee Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < employees.length}
                    checked={employees.length > 0 && selected.length === employees.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>EMPLOYEE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>DEPARTMENT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>ROLE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>JOINED</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }} align="right">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '16px', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <People sx={{ fontSize: 28, color: 'text.disabled' }} />
                    </Box>
                    <Typography variant="body1" fontWeight={600} color="text.primary">No employees found</Typography>
                    <Typography variant="body2" color="text.disabled">Try adjusting your search or filters</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    hover
                    sx={{ '&:hover': { bgcolor: 'background.default' }, cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.includes(emp.id)}
                        onChange={() => handleSelect(emp.id)}
                      />
                    </TableCell>
                    <TableCell onClick={() => openDetail(emp)}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar
                          src={getAvatarUrl(emp.id)}
                          sx={{
                            width: 36, height: 36, fontSize: 14, fontWeight: 700,
                            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                          }}
                          imgProps={{ onError: (e) => { e.target.style.display = 'none'; } }}
                        >
                          {emp.full_name?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} color="text.primary">{emp.full_name}</Typography>
                          <Typography variant="caption" color="text.disabled">{emp.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{emp.department || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={emp.role === 'hr' ? 'HR Admin' : 'Team Member'}
                        size="small"
                        sx={{
                          fontWeight: 600, fontSize: '0.7rem',
                          bgcolor: emp.role === 'hr' ? theme.palette.custom.purpleTint : theme.palette.custom.blueTint,
                          color: emp.role === 'hr' ? '#7C3AED' : '#3B82F6',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={emp.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          fontWeight: 600, fontSize: '0.7rem',
                          bgcolor: emp.is_active ? theme.palette.custom.greenTint : theme.palette.custom.redTint,
                          color: emp.is_active ? '#059669' : '#DC2626',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.disabled">
                        {emp.created_at ? new Date(emp.created_at).toLocaleDateString() : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box display="flex" justifyContent="flex-end" gap={0.5}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => openDetail(emp)}><Visibility sx={{ fontSize: 18 }} /></IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(emp)}><Edit sx={{ fontSize: 18 }} /></IconButton>
                        </Tooltip>
                        <Tooltip title={emp.is_active ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => handleToggleStatus(emp)}>
                            {emp.is_active ? <Block sx={{ fontSize: 18, color: '#EF4444' }} /> : <CheckCircle sx={{ fontSize: 18, color: '#10B981' }} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Password">
                          <IconButton size="small" onClick={() => openResetPassword(emp)}><LockReset sx={{ fontSize: 18 }} /></IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pages > 1 && (
          <Box display="flex" justifyContent="center" py={2}>
            <Pagination count={pages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        )}
      </Card>

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 0 } }}
      >
        {/* Drawer Header */}
        <Box sx={{
          background: (t) => t.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.95) 0%, rgba(139,92,246,0.95) 100%)',
          p: 3, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Typography variant="h6" fontWeight={700}>Employee Details</Typography>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <Close />
          </IconButton>
        </Box>

        {detailLoading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : detailEmployee && (
          <Box sx={{ p: 3 }}>
            {/* Profile */}
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Avatar
                src={getAvatarUrl(detailEmployee.id)}
                sx={{
                  width: 80, height: 80, fontSize: 32, fontWeight: 700, mb: 1.5,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  border: 3, borderColor: 'divider',
                }}
                imgProps={{ onError: (e) => { e.target.style.display = 'none'; } }}
              >
                {detailEmployee.full_name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="h6" fontWeight={700} color="text.primary">{detailEmployee.full_name}</Typography>
              <Typography variant="body2" color="text.secondary">{detailEmployee.email}</Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip label={detailEmployee.role === 'hr' ? 'HR Admin' : 'Team Member'} size="small"
                  sx={{ fontWeight: 600, bgcolor: theme.palette.custom.blueTint, color: '#3B82F6' }} />
                <Chip label={detailEmployee.is_active ? 'Active' : 'Inactive'} size="small"
                  sx={{ fontWeight: 600, bgcolor: detailEmployee.is_active ? theme.palette.custom.greenTint : theme.palette.custom.redTint, color: detailEmployee.is_active ? '#059669' : '#DC2626' }} />
              </Box>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {/* Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.disabled" fontWeight={700} mb={1.5} sx={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                DETAILS
              </Typography>
              {[
                { label: 'Department', value: detailEmployee.department || '—' },
                { label: 'Auth Provider', value: detailEmployee.auth_provider || 'local' },
                { label: 'Joined', value: detailEmployee.created_at ? new Date(detailEmployee.created_at).toLocaleDateString() : '—' },
              ].map((item) => (
                <Box key={item.label} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">{item.value}</Typography>
                </Box>
              ))}
            </Box>

            {/* Learning Stats */}
            {detailEmployee.learning_stats && (
              <>
                <Divider sx={{ mb: 2.5 }} />
                <Typography variant="subtitle2" color="text.disabled" fontWeight={700} mb={2} sx={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                  LEARNING PROGRESS
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    { label: 'Evaluations', value: detailEmployee.learning_stats.assessments_completed, icon: <Quiz sx={{ fontSize: 18 }} />, color: '#3B82F6', bg: theme.palette.custom.blueTint },
                    { label: 'Avg Score', value: `${detailEmployee.learning_stats.avg_assessment_score}%`, icon: <TrendingUp sx={{ fontSize: 18 }} />, color: '#10B981', bg: theme.palette.custom.greenTint },
                    { label: 'Cards Reviewed', value: detailEmployee.learning_stats.cards_reviewed, icon: <Style sx={{ fontSize: 18 }} />, color: '#8B5CF6', bg: theme.palette.custom.purpleTint },
                    { label: 'Cards Mastered', value: detailEmployee.learning_stats.cards_mastered, icon: <School sx={{ fontSize: 18 }} />, color: '#F59E0B', bg: theme.palette.custom.amberTint },
                  ].map((stat) => (
                    <Grid item xs={6} key={stat.label}>
                      <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: stat.bg, textAlign: 'center' }}>
                        <Box sx={{ color: stat.color, mb: 0.5 }}>{stat.icon}</Box>
                        <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: '1.1rem' }}>{stat.value}</Typography>
                        <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {detailEmployee.learning_stats.learning_path_score !== null && (
                  <Box sx={{ mt: 2, p: 2, borderRadius: '12px', bgcolor: 'background.default' }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight={600} color="text.primary">Growth Roadmap Score</Typography>
                      <Typography variant="body2" fontWeight={700} color="text.primary">{detailEmployee.learning_stats.learning_path_score}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={detailEmployee.learning_stats.learning_path_score || 0}
                      sx={{
                        height: 8, borderRadius: 4, bgcolor: 'divider',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Button
                      variant="outlined" size="small" fullWidth startIcon={<Route />}
                      onClick={() => openRoadmap(detailEmployee)}
                      sx={{ mt: 1.5, borderRadius: '10px', textTransform: 'none', borderColor: '#8B5CF6', color: '#8B5CF6',
                        '&:hover': { borderColor: '#7C3AED', bgcolor: theme.palette.custom.purpleTint } }}
                    >
                      View Full Growth Roadmap
                    </Button>
                  </Box>
                )}
              </>
            )}

            {/* Actions */}
            <Divider sx={{ my: 2.5 }} />
            <Box display="flex" gap={1}>
              <Button variant="outlined" size="small" fullWidth startIcon={<Edit />}
                onClick={() => { setDrawerOpen(false); openEdit(detailEmployee); }}
                sx={{ borderRadius: '10px', textTransform: 'none' }}>
                Edit
              </Button>
              <Button variant="outlined" size="small" fullWidth startIcon={<LockReset />}
                onClick={() => { setDrawerOpen(false); openResetPassword(detailEmployee); }}
                sx={{ borderRadius: '10px', textTransform: 'none' }}>
                Reset Password
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Edit Employee
          <Typography variant="body2" color="text.secondary">{editEmployee?.full_name}</Typography>
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Department</InputLabel>
            <Select value={editData.department} onChange={(e) => setEditData({ ...editData, department: e.target.value })} label="Department">
              {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Role</InputLabel>
            <Select value={editData.role} onChange={(e) => setEditData({ ...editData, role: e.target.value })} label="Role">
              <MenuItem value="employee">Team Member</MenuItem>
              <MenuItem value="hr">HR Administrator</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Status</InputLabel>
            <Select value={editData.is_active} onChange={(e) => setEditData({ ...editData, is_active: e.target.value })} label="Status">
              <MenuItem value={true}>Active</MenuItem>
              <MenuItem value={false}>Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editLoading}
            sx={{
              textTransform: 'none', borderRadius: '10px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' },
            }}>
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Password</DialogTitle>
        <DialogContent>
          {!tempPassword ? (
            <>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Generate a temporary password for <strong>{resetEmployee?.full_name}</strong>?
                They will need to use this to log in.
              </Typography>
              {resetEmployee?.auth_provider === 'google' && (
                <Alert severity="warning" sx={{ borderRadius: '10px' }}>
                  This user signed up with Google. Password reset may not apply.
                </Alert>
              )}
            </>
          ) : (
            <>
              <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>Password reset successfully!</Alert>
              <Typography variant="body2" color="text.secondary" mb={1}>Temporary password:</Typography>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '10px', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', color: 'text.primary', userSelect: 'all' }}>
                {tempPassword}
              </Box>
              <Typography variant="caption" color="text.disabled" display="block" mt={1}>
                Copy this password and share it securely with the employee.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {!tempPassword ? (
            <>
              <Button onClick={() => setResetOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
              <Button variant="contained" color="warning" onClick={handleResetPassword} disabled={resetLoading}
                sx={{ textTransform: 'none', borderRadius: '10px' }}>
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => setResetOpen(false)}
              sx={{
                textTransform: 'none', borderRadius: '10px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              }}>
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Growth Roadmap Dialog */}
      <Dialog open={roadmapOpen} onClose={() => setRoadmapOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', maxHeight: '85vh' } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Growth Roadmap</Typography>
            <Typography variant="body2" color="text.secondary">{roadmapEmployee?.full_name} — {roadmapEmployee?.department}</Typography>
          </Box>
          <IconButton onClick={() => setRoadmapOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {roadmapLoading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: '#3B82F6' }} /></Box>
          ) : !roadmapData ? (
            <Box textAlign="center" py={6}>
              <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <Route sx={{ fontSize: 32, color: '#fff' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="text.primary" mb={1}>No Roadmap Generated</Typography>
              <Typography variant="body2" color="text.secondary">This employee hasn't generated a growth roadmap yet. They need to complete evaluations or training first.</Typography>
            </Box>
          ) : (
            <Box>
              {/* Score + Strengths + Weaknesses */}
              <Box display="flex" alignItems="flex-start" gap={3} mb={3} flexWrap="wrap">
                <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                  <CircularProgress variant="determinate" value={roadmapData.overall_score || 0} size={90} thickness={5}
                    sx={{ color: roadmapData.overall_score >= 70 ? '#10B981' : roadmapData.overall_score >= 50 ? '#F59E0B' : '#EF4444', '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="text.primary">{roadmapData.overall_score}%</Typography>
                    <Typography variant="caption" color="text.disabled" fontSize="0.55rem">OVERALL</Typography>
                  </Box>
                </Box>
                <Box flex={1} sx={{ minWidth: 0 }}>
                  <Grid container spacing={2}>
                    {roadmapData.strengths?.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                          <TrendingUp sx={{ fontSize: 16, color: '#10B981' }} />
                          <Typography variant="subtitle2" color="text.secondary" fontSize="0.7rem">STRENGTHS</Typography>
                        </Box>
                        {roadmapData.strengths.map((s, i) => {
                          const skill = typeof s === 'string' ? s : s.skill;
                          const evidence = typeof s === 'string' ? '' : s.evidence;
                          return (
                            <Box key={i} sx={{ mb: 1, p: 1.5, borderRadius: '10px', bgcolor: theme.palette.custom.greenTint }}>
                              <Box display="flex" alignItems="center" gap={1} mb={evidence ? 0.5 : 0}>
                                <Chip label={typeof s === 'string' ? 'competent' : (s.proficiency || 'competent')} size="small"
                                  sx={{ bgcolor: '#059669', color: '#fff', fontWeight: 600, fontSize: '0.6rem', height: 18, textTransform: 'capitalize' }} />
                                <Typography variant="body2" fontWeight={700} color="text.primary" fontSize="0.85rem">{skill}</Typography>
                              </Box>
                              {evidence && <Typography variant="caption" color="text.secondary">{evidence}</Typography>}
                            </Box>
                          );
                        })}
                      </Grid>
                    )}
                    {roadmapData.weaknesses?.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                          <Warning sx={{ fontSize: 16, color: '#EF4444' }} />
                          <Typography variant="subtitle2" color="text.secondary" fontSize="0.7rem">FOCUS AREAS</Typography>
                        </Box>
                        {roadmapData.weaknesses.map((w, i) => {
                          const skill = typeof w === 'string' ? w : w.skill;
                          const evidence = typeof w === 'string' ? '' : w.evidence;
                          const severity = typeof w === 'string' ? 'moderate' : (w.severity || 'moderate');
                          const gap = typeof w === 'string' ? '' : w.gap_description;
                          const sc = severityConfig[severity] || severityConfig.moderate;
                          return (
                            <Box key={i} sx={{ mb: 1, p: 1.5, borderRadius: '10px', bgcolor: sc.bg, borderLeft: `3px solid ${sc.color}` }}>
                              <Box display="flex" alignItems="center" gap={1} mb={(evidence || gap) ? 0.5 : 0}>
                                <Chip label={sc.label} size="small" sx={{ bgcolor: sc.color, color: '#fff', fontWeight: 600, fontSize: '0.6rem', height: 18 }} />
                                <Typography variant="body2" fontWeight={700} color="text.primary" fontSize="0.85rem">{skill}</Typography>
                              </Box>
                              {evidence && <Typography variant="caption" color="text.secondary" display="block">{evidence}</Typography>}
                              {gap && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>{gap}</Typography>}
                            </Box>
                          );
                        })}
                      </Grid>
                    )}
                    {!roadmapData.strengths?.length && !roadmapData.weaknesses?.length && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Not enough detailed activity yet to identify specific strengths or focus
                          areas. The overall score reflects real evaluation and training data.
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>

              {/* Project Recommendations */}
              {roadmapData.project_recommendations?.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary" mb={0.5}>Suggested Projects for Growth</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>Practical projects that would help this employee develop their weaker areas</Typography>
                  <Grid container spacing={1.5}>
                    {roadmapData.project_recommendations.map((proj, i) => (
                      <Grid item xs={12} md={6} key={i}>
                        <Box sx={{ p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: proj.assignment_fitness === 'ready' ? '#16A34A' : proj.assignment_fitness === 'supervised' ? '#D97706' : proj.assignment_fitness === 'not_ready' ? '#DC2626' : '#8B5CF6', height: '100%' }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Assignment sx={{ fontSize: 18, color: '#8B5CF6' }} />
                              <Typography variant="body2" fontWeight={700} color="text.primary">{proj.title}</Typography>
                            </Box>
                            {proj.assignment_fitness && (
                              <Chip
                                label={proj.assignment_fitness === 'ready' ? 'Ready' : proj.assignment_fitness === 'supervised' ? 'Supervised' : 'Not Ready'}
                                size="small"
                                sx={{
                                  fontWeight: 700, fontSize: '0.65rem', height: 22,
                                  bgcolor: proj.assignment_fitness === 'ready' ? '#DCFCE7' : proj.assignment_fitness === 'supervised' ? '#FEF3C7' : '#FEE2E2',
                                  color: proj.assignment_fitness === 'ready' ? '#15803D' : proj.assignment_fitness === 'supervised' ? '#92400E' : '#DC2626',
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" mb={1} lineHeight={1.5}>{proj.description}</Typography>
                          {proj.skills_required?.length > 0 && (
                            <Box display="flex" gap={0.5} flexWrap="wrap" mb={0.5}>
                              {proj.skills_required.map((sk) => (
                                <Chip key={sk} label={sk} size="small"
                                  sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, fontSize: '0.6rem', height: 20 }} />
                              ))}
                            </Box>
                          )}
                          {proj.skills_developed?.length > 0 && (
                            <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
                              {proj.skills_developed.map((sk) => (
                                <Chip key={sk} label={sk} size="small" icon={<Build sx={{ fontSize: 10 }} />}
                                  sx={{ bgcolor: theme.palette.custom.purpleTint, color: '#7C3AED', fontWeight: 600, fontSize: '0.65rem', height: 22, '& .MuiChip-icon': { color: '#7C3AED' } }} />
                              ))}
                            </Box>
                          )}
                          {proj.fitness_rationale && (
                            <Box sx={{ p: 1, bgcolor: proj.assignment_fitness === 'ready' ? '#F0FDF4' : proj.assignment_fitness === 'supervised' ? '#FFFBEB' : '#FEF2F2', borderRadius: '8px', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">{proj.fitness_rationale}</Typography>
                            </Box>
                          )}
                          {proj.rationale && (
                            <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: '8px' }}>
                              <Typography variant="caption" color="text.secondary" fontStyle="italic">{proj.rationale}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Document Recommendations */}
              {roadmapData.recommendations?.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary" mb={0.5}>Recommended Development Plan</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>Prioritized resources based on performance gaps</Typography>
                  {roadmapData.recommendations.map((rec, i) => {
                    const pc = priorityConfig[rec.priority] || priorityConfig.medium;
                    return (
                      <Box key={i} sx={{ mb: 1.5, p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider', borderLeft: `4px solid ${pc.color}` }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: 24, height: 24, borderRadius: '6px', bgcolor: pc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pc.color, fontSize: '0.75rem', fontWeight: 800 }}>
                              {i + 1}
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="text.primary">{rec.topic}</Typography>
                          </Box>
                          <Chip label={rec.priority} size="small" sx={{ bgcolor: pc.bg, color: pc.color, fontWeight: 600, fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{rec.description}</Typography>
                        {rec.document_name && <Typography variant="caption" color="text.disabled">Resource: {rec.document_name}</Typography>}
                        {rec.reason && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: '8px' }}>
                            <Typography variant="caption" color="text.secondary" fontStyle="italic">{rec.reason}</Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Assessment + Flashcard Summary */}
              <Grid container spacing={2}>
                {roadmapData.assessment_summary?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <EmojiEvents sx={{ fontSize: 18, color: '#10B981' }} />
                        <Typography variant="body2" fontWeight={700} color="text.primary">Evaluation Summary</Typography>
                      </Box>
                      {roadmapData.assessment_summary.map((a, i) => (
                        <Box key={i} mb={1.5}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" fontWeight={500} color="text.primary" noWrap sx={{ maxWidth: '65%' }}>{a.name}</Typography>
                            <Typography variant="caption" fontWeight={700} color={a.percentage >= 70 ? '#10B981' : a.percentage >= 50 ? '#F59E0B' : '#EF4444'}>{a.percentage}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={a.percentage} sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': { borderRadius: 3, background: a.percentage >= 70 ? 'linear-gradient(90deg, #10B981, #059669)' : a.percentage >= 50 ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, #EF4444, #DC2626)' } }} />
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                )}
                {roadmapData.flashcard_summary?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <School sx={{ fontSize: 18, color: '#F59E0B' }} />
                        <Typography variant="body2" fontWeight={700} color="text.primary">Retention Training Summary</Typography>
                      </Box>
                      {roadmapData.flashcard_summary.map((f, i) => (
                        <Box key={i} mb={1.5}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" fontWeight={500} color="text.primary" noWrap sx={{ maxWidth: '55%' }}>{f.set_name}</Typography>
                            <Typography variant="caption" fontWeight={700} color="#8B5CF6">{f.mastered}/{f.total} ({f.retention_rate}%)</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={(f.mastered / Math.max(f.total, 1)) * 100} sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': { borderRadius: 3, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)' } }} />
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>

              {/* Generated timestamp */}
              {roadmapData.generated_at && (
                <Typography variant="caption" color="text.disabled" display="block" mt={2} textAlign="right">
                  Generated: {new Date(roadmapData.generated_at).toLocaleDateString()} at {new Date(roadmapData.generated_at).toLocaleTimeString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: '10px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
