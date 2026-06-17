import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, Grid, CircularProgress, Tabs, Tab,
  TextField, Button, IconButton, Divider, LinearProgress, Avatar,
} from '@mui/material';
import {
  Diversity3, Send, ArrowBack, CheckCircle, Description, Style, Quiz,
  TrendingUp, TrendingFlat, EventNote, School, EmojiPeople, Add,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  getMyMentorships, getMentorship, completeMentorship,
  getSessions, addSession, getMessages, sendMessage, getProgress, getResources,
} from '../../api/mentorship';
import { downloadDocument } from '../../api/documents';
import { fadeInUp, glassShineHover, brandPillButton } from '../../theme/glass';

const ACCENT = '#EC4899';

export default function EmployeeMentorshipPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);  // selected mentorship detail
  const [tab, setTab] = useState(0);

  useEffect(() => {
    getMyMentorships().then((r) => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress sx={{ color: ACCENT }} /></Box>;

  if (active) {
    return <MentorshipDetail id={active} onBack={() => { setActive(null); setTab(0); }} tab={tab} setTab={setTab} navigate={navigate} theme={theme} refreshList={() => getMyMentorships().then((r) => setItems(r.data)).catch(() => {})} />;
  }

  const asMentor = items.filter((m) => m.role === 'mentor');
  const asMentee = items.filter((m) => m.role === 'mentee');

  const Card1 = ({ m, who }) => (
    <Card sx={{ ...glassShineHover, mb: 1.5, cursor: 'pointer', borderLeft: '4px solid', borderLeftColor: m.status === 'completed' ? '#10B981' : ACCENT }} onClick={() => setActive(m.id)}>
      <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: who === 'mentor' ? '#10B981' : '#3B82F6' }}>
          {who === 'mentor' ? <School sx={{ fontSize: 18 }} /> : <EmojiPeople sx={{ fontSize: 18 }} />}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={700} noWrap>{who === 'mentor' ? m.mentee_name : m.mentor_name}</Typography>
          <Box display="flex" gap={0.5} mt={0.3} alignItems="center">
            <Chip label={m.skill} size="small" sx={{ height: 18, bgcolor: theme.palette.custom.purpleTint, color: '#7C3AED', fontWeight: 600 }} />
            {m.status === 'completed' && <Chip label="Completed" size="small" sx={{ height: 18, bgcolor: theme.palette.custom.greenTint, color: '#059669', fontWeight: 700 }} />}
          </Box>
        </Box>
        <Typography variant="caption" color="text.disabled">Open →</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Mentorship</Typography>
        <Typography variant="body2" color="text.secondary">Message your mentor or mentee, log sessions, track progress on the target skill.</Typography>
      </Box>
      {items.length === 0 ? (
        <Card><CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Diversity3 sx={{ fontSize: 40, color: '#94A3B8', mb: 1 }} />
          <Typography variant="h6" fontWeight={600}>No mentorships yet</Typography>
          <Typography variant="body2" color="text.disabled">Your HR team will pair you based on your growth roadmap.</Typography>
        </CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}><School sx={{ color: '#10B981' }} /><Typography variant="h6" fontWeight={700}>You're Mentoring</Typography></Box>
            {asMentor.length === 0 && <Typography variant="body2" color="text.disabled" mb={2}>Not mentoring anyone yet.</Typography>}
            {asMentor.map((m) => <Card1 key={m.id} m={m} who="mentor" />)}
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}><EmojiPeople sx={{ color: '#3B82F6' }} /><Typography variant="h6" fontWeight={700}>Your Mentors</Typography></Box>
            {asMentee.length === 0 && <Typography variant="body2" color="text.disabled" mb={2}>No mentor assigned yet.</Typography>}
            {asMentee.map((m) => <Card1 key={m.id} m={m} who="mentee" />)}
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

/* ---------------- Detail view: chat / sessions / progress / resources --------- */
function MentorshipDetail({ id, onBack, tab, setTab, navigate, theme, refreshList }) {
  const [m, setM] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionNote, setSessionNote] = useState('');
  const [progress, setProgress] = useState(null);
  const [resources, setResources] = useState(null);
  const scrollRef = useRef(null);

  const loadMeta = () => getMentorship(id).then((r) => setM(r.data)).catch(() => {});
  const loadMessages = () => getMessages(id).then((r) => setMessages(r.data)).catch(() => {});

  useEffect(() => {
    loadMeta(); loadMessages();
    getSessions(id).then((r) => setSessions(r.data)).catch(() => {});
    getProgress(id).then((r) => setProgress(r.data)).catch(() => {});
    getResources(id).then((r) => setResources(r.data)).catch(() => {});
  }, [id]);

  // Poll chat every 5s while on the Chat tab
  useEffect(() => {
    if (tab !== 0) return undefined;
    const iv = setInterval(loadMessages, 5000);
    return () => clearInterval(iv);
  }, [tab, id]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try { await sendMessage(id, text); loadMessages(); } catch {}
  };

  const logSession = async () => {
    const note = sessionNote.trim();
    if (!note) return;
    setSessionNote('');
    try { await addSession(id, note); getSessions(id).then((r) => setSessions(r.data)); } catch {}
  };

  const markComplete = async () => {
    try { await completeMentorship(id); loadMeta(); refreshList(); } catch {}
  };

  const openDoc = async (rid) => {
    try {
      const res = await downloadDocument(rid);
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { alert('Could not open this document.'); }
  };

  if (!m) return <Box display="flex" justifyContent="center" py={12}><CircularProgress sx={{ color: ACCENT }} /></Box>;

  const other = m.my_role === 'mentor' ? m.mentee_name : m.mentor_name;

  return (
    <Box maxWidth={780} mx="auto">
      <Button startIcon={<ArrowBack />} onClick={onBack} sx={{ color: 'text.secondary', mb: 2 }}>Back</Button>

      <Card sx={{ mb: 2, ...fadeInUp(20) }}>
        <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: ACCENT }}><Diversity3 /></Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" fontWeight={700} noWrap>{other}</Typography>
            <Box display="flex" gap={0.5} mt={0.3}>
              <Chip label={m.skill} size="small" sx={{ height: 20, bgcolor: theme.palette.custom.purpleTint, color: '#7C3AED', fontWeight: 600 }} />
              <Chip label={m.my_role === 'mentor' ? 'You mentor' : 'Your mentor'} size="small" sx={{ height: 20, bgcolor: 'action.hover' }} />
              <Chip label={m.status} size="small" sx={{ height: 20, textTransform: 'capitalize', bgcolor: m.status === 'completed' ? theme.palette.custom.greenTint : theme.palette.custom.amberTint, color: m.status === 'completed' ? '#059669' : '#D97706', fontWeight: 700 }} />
            </Box>
          </Box>
          {m.status !== 'completed' && (
            <Button size="small" variant="outlined" startIcon={<CheckCircle />} onClick={markComplete} sx={{ borderRadius: '999px' }}>Complete</Button>
          )}
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 40 }, '& .Mui-selected': { color: ACCENT }, '& .MuiTabs-indicator': { bgcolor: ACCENT } }}>
        <Tab label="Chat" /><Tab label="Sessions" /><Tab label="Progress" /><Tab label="Resources" />
      </Tabs>

      {/* CHAT */}
      {tab === 0 && (
        <Card sx={fadeInUp(20)}>
          <CardContent sx={{ p: 2 }}>
            <Box ref={scrollRef} sx={{ height: 360, overflowY: 'auto', px: 0.5, mb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {messages.length === 0 && <Typography variant="body2" color="text.disabled" textAlign="center" mt={6}>No messages yet — say hello 👋</Typography>}
              {messages.map((msg) => (
                <Box key={msg.id} sx={{ alignSelf: msg.mine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                  {!msg.mine && <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>{msg.sender_name}</Typography>}
                  <Box sx={{
                    px: 1.5, py: 1, borderRadius: msg.mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.mine ? `linear-gradient(135deg, ${ACCENT} 0%, #BE185D 100%)` : 'action.hover',
                    color: msg.mine ? '#fff' : 'text.primary',
                  }}>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            <Box display="flex" gap={1}>
              <TextField fullWidth size="small" placeholder="Type a message…" value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
              <IconButton onClick={send} disabled={!draft.trim()} sx={{ bgcolor: ACCENT, color: '#fff', '&:hover': { bgcolor: '#BE185D' }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}><Send fontSize="small" /></IconButton>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* SESSIONS */}
      {tab === 1 && (
        <Card sx={fadeInUp(20)}>
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" gap={1} mb={2}>
              <TextField fullWidth size="small" multiline maxRows={3} placeholder="Log a check-in — what did you cover?" value={sessionNote} onChange={(e) => setSessionNote(e.target.value)} />
              <Button variant="contained" startIcon={<Add />} onClick={logSession} sx={{ ...brandPillButton, whiteSpace: 'nowrap' }}>Log</Button>
            </Box>
            {sessions.length === 0 && <Typography variant="body2" color="text.disabled">No sessions logged yet.</Typography>}
            {sessions.map((s) => (
              <Box key={s.id} sx={{ display: 'flex', gap: 1.5, mb: 1.5, p: 1.5, borderRadius: '12px', bgcolor: 'action.hover' }}>
                <EventNote sx={{ color: ACCENT, fontSize: 20, mt: 0.3 }} />
                <Box flex={1}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{s.note}</Typography>
                  <Typography variant="caption" color="text.disabled">{s.logged_by_name} · {s.date}</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PROGRESS */}
      {tab === 2 && progress && (
        <Card sx={fadeInUp(20)}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              {progress.skill_status === 'gap_closed'
                ? <Chip icon={<CheckCircle />} label="Goal met — gap closed" sx={{ bgcolor: theme.palette.custom.greenTint, color: '#059669', fontWeight: 700, '& .MuiChip-icon': { color: '#059669' } }} />
                : progress.skill_status === 'gap_remaining'
                  ? <Chip icon={<TrendingUp />} label="In progress — gap remaining" sx={{ bgcolor: theme.palette.custom.amberTint, color: '#D97706', fontWeight: 700, '& .MuiChip-icon': { color: '#D97706' } }} />
                  : <Chip label="No roadmap data yet" sx={{ bgcolor: 'action.hover' }} />}
            </Box>
            {progress.first_score != null && (
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box textAlign="center"><Typography variant="h5" fontWeight={800}>{progress.first_score}%</Typography><Typography variant="caption" color="text.disabled">First</Typography></Box>
                <TrendingFlat sx={{ color: 'text.disabled' }} />
                <Box textAlign="center"><Typography variant="h5" fontWeight={800} color={progress.latest_score >= progress.first_score ? '#10B981' : '#EF4444'}>{progress.latest_score}%</Typography><Typography variant="caption" color="text.disabled">Latest</Typography></Box>
              </Box>
            )}
            <Typography variant="body2" fontWeight={700} mb={1}>Assessments on “{progress.skill}”</Typography>
            {progress.trend.length === 0 && <Typography variant="body2" color="text.disabled">No assessment attempts on this skill yet.</Typography>}
            {progress.trend.map((t, i) => (
              <Box key={i} mb={1}>
                <Box display="flex" justifyContent="space-between"><Typography variant="caption" noWrap sx={{ maxWidth: '70%' }}>{t.assessment_name}</Typography><Typography variant="caption" fontWeight={700}>{t.percentage}%</Typography></Box>
                <LinearProgress variant="determinate" value={t.percentage} sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 3, background: 'linear-gradient(90deg,#EC4899,#BE185D)' } }} />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* RESOURCES */}
      {tab === 3 && resources && (
        <Card sx={fadeInUp(20)}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={2}>Material related to “{resources.skill}” to work through together.</Typography>
            <ResourceList title="Documents" icon={<Description sx={{ fontSize: 16 }} />} items={resources.documents} onOpen={(it) => openDoc(it.id)} theme={theme} />
            <ResourceList title="Training" icon={<Style sx={{ fontSize: 16 }} />} items={resources.flashcard_sets} onOpen={() => navigate('/employee/flashcards')} theme={theme} />
            <ResourceList title="Evaluations" icon={<Quiz sx={{ fontSize: 16 }} />} items={resources.assessments} onOpen={() => navigate('/employee/assessments')} theme={theme} />
            {resources.documents.length + resources.flashcard_sets.length + resources.assessments.length === 0 && (
              <Typography variant="body2" color="text.disabled">No matching material found for this skill yet.</Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function ResourceList({ title, icon, items, onOpen, theme }) {
  if (!items || items.length === 0) return null;
  return (
    <Box mb={2}>
      <Box display="flex" alignItems="center" gap={0.5} mb={1}>{icon}<Typography variant="body2" fontWeight={700}>{title}</Typography></Box>
      {items.map((it) => (
        <Box key={it.id} display="flex" alignItems="center" gap={1} mb={0.8} sx={{ p: 1.2, borderRadius: '10px', bgcolor: 'action.hover' }}>
          <Typography variant="body2" flex={1} noWrap>{it.name}</Typography>
          <Button size="small" variant="outlined" onClick={() => onOpen(it)} sx={{ borderRadius: '999px' }}>Open</Button>
        </Box>
      ))}
    </Box>
  );
}
