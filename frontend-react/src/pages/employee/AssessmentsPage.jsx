import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  Radio, RadioGroup, FormControlLabel, FormControl, Paper,
  LinearProgress, Alert, CircularProgress, Avatar,
} from '@mui/material';
import { Quiz, ArrowBack, CheckCircle, Cancel, EmojiEvents, AccessTime } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getAssessments, getAssessment, submitAssessment } from '../../api/assessments';
import { fadeInUp, brandPillButton, glassShineHover } from '../../theme/glass';

const typeConfig = {
  mcq: { label: 'Multiple Choice', color: '#3B82F6', bg: '#EFF6FF' },
  scenario: { label: 'Scenario-Based', color: '#8B5CF6', bg: '#F5F3FF' },
  mixed: { label: 'Comprehensive', color: '#10B981', bg: '#ECFDF5' },
};

const difficultyConfig = {
  easy: { label: 'Foundational', color: '#10B981', bg: '#ECFDF5' },
  medium: { label: 'Intermediate', color: '#F59E0B', bg: '#FFFBEB' },
  hard: { label: 'Advanced', color: '#EF4444', bg: '#FEE2E2' },
};

export default function EmployeeAssessmentsPage() {
  const theme = useTheme();
  const [assessments, setAssessments] = useState([]);
  const [taking, setTaking] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null); // seconds remaining when assessment is timed; null when untimed
  const startTimeRef = useRef(null);
  const submitRef = useRef(null); // holds latest handleSubmit so the timer effect never reads a stale closure

  useEffect(() => {
    getAssessments().then((r) => setAssessments(r.data)).catch(() => {});
  }, []);

  // Countdown ticker — runs only while an attempt is in progress, only when the assessment has a time limit.
  useEffect(() => {
    if (!taking?.time_limit_minutes || result) return undefined;
    const tick = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(tick);
          // Auto-submit when time expires.
          if (submitRef.current) submitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [taking, result]);

  const startAssessment = async (a) => {
    setLoading(true);
    try {
      const res = await getAssessment(a.id);
      setTaking(res.data);
      setAnswers({});
      setCurrentQ(0);
      setResult(null);
      startTimeRef.current = Date.now();
      // Initialise countdown from server-stamped start time when available so
      // a page refresh shows the real remaining time (no refresh-to-reset cheat).
      if (res.data.time_limit_minutes) {
        const totalSeconds = res.data.time_limit_minutes * 60;
        if (res.data.attempt_started_at) {
          const startedAtMs = new Date(res.data.attempt_started_at).getTime();
          const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
          setTimeLeft(Math.max(0, totalSeconds - elapsed));
        } else {
          setTimeLeft(totalSeconds);
        }
      } else {
        setTimeLeft(null);
      }
    } catch {} finally { setLoading(false); }
  };

  const handleAnswer = (questionId, answerId) => {
    setAnswers({ ...answers, [questionId]: answerId });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const formattedAnswers = Object.entries(answers).map(([qid, aid]) => ({
      question_id: qid, selected_answer_id: aid,
    }));
    try {
      const res = await submitAssessment(taking.id, formattedAnswers, timeTaken);
      setResult(res.data);
    } catch {} finally { setSubmitting(false); }
  };

  // Keep submitRef in sync so the countdown effect can call the latest handleSubmit (avoids stale-closure bugs).
  submitRef.current = handleSubmit;

  const goBack = () => { setTaking(null); setResult(null); setTimeLeft(null); };

  const formatTime = (s) => {
    if (s === null || s === undefined) return '';
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  };

  // List view
  if (!taking) {
    return (
      <Box>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={700} color="text.primary" mb={0.5}>Competency Evaluations</Typography>
          <Typography variant="body2" color="text.secondary">Take AI-generated assessments to measure and improve your professional competency.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip icon={<Quiz sx={{ fontSize: 16 }} />} label={`${assessments.length} Available`} sx={{ bgcolor: theme.palette.custom.greenTint, color: '#10B981', fontWeight: 600 }} />
        </Box>
        <Grid container spacing={2}>
          {assessments.map((a, idx) => {
            const tc = typeConfig[a.assessment_type] || typeConfig.mcq;
            const dc = difficultyConfig[a.difficulty] || difficultyConfig.medium;
            return (
              <Grid item xs={12} sm={6} md={4} key={a.id}>
                <Card sx={{
                  ...fadeInUp(idx * 40), ...glassShineHover,
                  '&:hover': { borderColor: tc.color, transform: 'translateY(-3px)' },
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box display="flex" gap={2} alignItems="flex-start" mb={2}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: theme.palette.custom.greenTint, color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Quiz sx={{ fontSize: 22 }} />
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>{a.name}</Typography>
                        <Typography variant="caption" color="text.disabled" noWrap>{a.document_name}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" gap={0.5} mb={2} flexWrap="wrap">
                      <Chip label={tc.label} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: tc.bg, color: tc.color }} />
                      <Chip label={dc.label} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: dc.bg, color: dc.color }} />
                      <Chip label={`${a.num_questions} Q`} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }} />
                      {a.time_limit_minutes && <Chip label={`${a.time_limit_minutes}m`} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }} />}
                    </Box>
                    <Button
                      fullWidth variant="contained" size="small" onClick={() => startAssessment(a)}
                      disabled={loading}
                      sx={{
                        background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                        borderRadius: '999px', py: 1,
                        boxShadow: '0 6px 18px rgba(99,102,241,0.32)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                          boxShadow: '0 10px 24px rgba(99,102,241,0.45)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      {loading ? <CircularProgress size={16} /> : 'Begin Evaluation'}
                    </Button>
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
                <Typography variant="h6" fontWeight={600} color="text.primary" mb={0.5}>No evaluations available</Typography>
                <Typography variant="body2" color="text.disabled">Your HR administrator will assign competency evaluations to your team.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  }

  // Results view
  if (result) {
    return (
      <Box maxWidth={700} mx="auto" mt={2}>
        <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 2, color: 'text.secondary' }}>
          Back to Evaluations
        </Button>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '20px', mx: 'auto', mb: 2,
              background: result.percentage >= 70 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : result.percentage >= 50 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <EmojiEvents sx={{ fontSize: 36, color: '#fff' }} />
            </Box>
            <Typography variant="h3" fontWeight={800} color={result.percentage >= 70 ? '#10B981' : result.percentage >= 50 ? '#F59E0B' : '#EF4444'}>
              {result.percentage}%
            </Typography>
            <Typography variant="h6" fontWeight={600} color="text.primary">{result.score} / {result.total} correct</Typography>
            {result.time_taken_seconds && (
              <Typography variant="body2" color="text.disabled" mt={1}>
                Completed in {Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s
              </Typography>
            )}
          </CardContent>
        </Card>

        {result.answers.map((a, i) => {
          const q = taking.questions[i];
          return (
            <Card key={a.question_id} sx={{ mb: 2, borderLeft: '4px solid', borderLeftColor: a.is_correct ? '#10B981' : '#EF4444' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" gap={1} alignItems="center" mb={1}>
                  {a.is_correct
                    ? <CheckCircle sx={{ fontSize: 20, color: '#10B981' }} />
                    : <Cancel sx={{ fontSize: 20, color: '#EF4444' }} />
                  }
                  <Typography fontWeight={700} color="text.primary" fontSize="0.95rem">Q{i + 1}: {q?.question}</Typography>
                </Box>
                {q?.scenario_context && (
                  <Box sx={{ p: 2, mb: 1.5, bgcolor: 'background.default', borderRadius: '10px', border: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">{q.scenario_context}</Typography>
                  </Box>
                )}
                <Typography variant="body2" color={a.is_correct ? '#059669' : '#DC2626'} mb={0.5}>
                  Your answer: {q?.options?.find((o) => o.id === a.selected_answer_id)?.text}
                </Typography>
                {!a.is_correct && (
                  <Typography variant="body2" color="#059669" mb={0.5}>
                    Correct: {q?.options?.find((o) => o.id === a.correct_answer_id)?.text}
                  </Typography>
                )}
                {a.explanation && (
                  <Box sx={{ mt: 1.5, p: 2, bgcolor: 'background.default', borderRadius: '10px' }}>
                    <Typography variant="body2" color="text.secondary">{a.explanation}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  }

  // Taking assessment
  const question = taking.questions[currentQ];
  const progress = ((currentQ + 1) / taking.questions.length) * 100;
  const allAnswered = taking.questions.every((q) => answers[q.id]);

  // Countdown styling — green/default > 5min, amber 1-5min, red < 1min with pulse
  const timerLow = timeLeft !== null && timeLeft < 300;     // under 5 minutes
  const timerCritical = timeLeft !== null && timeLeft < 60; // under 1 minute
  const timerColor = timerCritical ? '#EF4444' : timerLow ? '#F59E0B' : '#10B981';
  const timerBg = timerCritical
    ? 'rgba(239,68,68,0.12)'
    : timerLow
      ? 'rgba(245,158,11,0.12)'
      : 'rgba(16,185,129,0.12)';

  return (
    <Box maxWidth={700} mx="auto" mt={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ color: 'text.secondary' }}>Exit</Button>

        <Box display="flex" alignItems="center" gap={1.5}>
          {timeLeft !== null && (
            <Chip
              icon={<AccessTime sx={{ fontSize: 16, color: timerColor }} />}
              label={formatTime(timeLeft)}
              size="small"
              sx={{
                fontFamily: '"SF Mono", "Roboto Mono", monospace',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: timerColor,
                bgcolor: timerBg,
                border: `1px solid ${timerColor}55`,
                px: 0.5,
                height: 30,
                '& .MuiChip-icon': { color: timerColor },
                '@media (prefers-reduced-motion: no-preference)': timerCritical ? {
                  animation: 'nl-timer-pulse 1s ease-in-out infinite',
                } : {},
                '@keyframes nl-timer-pulse': {
                  '0%, 100%': { boxShadow: `0 0 0 0 ${timerColor}55` },
                  '50%':      { boxShadow: `0 0 0 6px ${timerColor}00` },
                },
              }}
            />
          )}
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {currentQ + 1} / {taking.questions.length}
          </Typography>
        </Box>
      </Box>
      <LinearProgress variant="determinate" value={progress} sx={{
        mb: 3, height: 6, borderRadius: 3, bgcolor: 'divider',
        '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #10B981, #059669)', borderRadius: 3 },
      }} />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {question.scenario_context && (
            <Box sx={{ p: 2.5, mb: 2.5, bgcolor: 'background.default', borderRadius: '12px', border: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" color="text.disabled" mb={0.5}>SCENARIO</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} fontStyle="italic">{question.scenario_context}</Typography>
            </Box>
          )}
          <Typography variant="h6" fontWeight={700} color="text.primary" mb={2.5}>
            Q{currentQ + 1}. {question.question}
          </Typography>
          <FormControl>
            <RadioGroup
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
            >
              {question.options.map((opt) => (
                <FormControlLabel
                  key={opt.id} value={opt.id} control={<Radio />}
                  label={opt.text}
                  sx={{
                    mb: 1, p: 1.5, borderRadius: '12px',
                    border: '1px solid',
                    borderColor: answers[question.id] === opt.id ? '#3B82F6' : 'divider',
                    bgcolor: answers[question.id] === opt.id ? theme.palette.custom.blueTint : 'transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: 'background.default', borderColor: 'divider' },
                    '& .MuiTypography-root': { fontSize: '0.9rem' },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between">
        <Button
          disabled={currentQ === 0}
          onClick={() => setCurrentQ(currentQ - 1)}
          sx={{ color: 'text.secondary' }}
        >
          Previous
        </Button>
        {currentQ < taking.questions.length - 1 ? (
          <Button
            variant="contained" onClick={() => setCurrentQ(currentQ + 1)}
            sx={{ ...brandPillButton, px: 4 }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained" onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            sx={{ ...brandPillButton, px: 4 }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit Evaluation'}
          </Button>
        )}
      </Box>
    </Box>
  );
}
