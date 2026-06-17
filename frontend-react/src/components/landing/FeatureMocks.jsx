import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import {
  Description, AutoAwesome, CheckCircle, RadioButtonUnchecked,
  Bolt, AccessTime, LightbulbOutlined, TipsAndUpdates, Today,
  RocketLaunch, Lock, Diversity3, ArrowForward, Warning, Style, Quiz,
} from '@mui/icons-material';

/**
 * FeatureMocks — stylized mini product previews shown alongside each feature row.
 * No real screenshots; these are JSX/CSS renders that look like the real UI.
 * Each mock uses the matching feature accent color.
 */

const MOCK_SHELL = (theme, accent) => ({
  position: 'relative',
  borderRadius: '20px',
  background: theme.palette.mode === 'dark' ? 'rgba(17,24,39,0.72)' : 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.6)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 30px 70px -20px rgba(0,0,0,0.55)'
    : `0 30px 70px -20px ${accent}33`,
  p: { xs: 2, md: 2.5 },
  overflow: 'hidden',
});

/* ------------------------------------------------------------------ */
/* 1. Knowledge Assistants — mini chat                                */
/* ------------------------------------------------------------------ */
export function KnowledgeAssistantMock({ theme }) {
  const accent = '#3B82F6';
  return (
    <Box sx={MOCK_SHELL(theme, accent)}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{
          width: 28, height: 28, borderRadius: '8px',
          background: `linear-gradient(135deg, ${accent} 0%, #8B5CF6 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
          <Description sx={{ fontSize: 16 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block', lineHeight: 1.2 }}>
            Security Handbook.pdf
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            142 pages · indexed
          </Typography>
        </Box>
        <Chip label="GROUNDED" size="small" sx={{
          height: 18, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em',
          bgcolor: `${accent}15`, color: accent, borderRadius: '4px',
        }} />
      </Box>
      {/* User message */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.2 }}>
        <Box sx={{
          maxWidth: '80%',
          background: `linear-gradient(135deg, ${accent} 0%, #8B5CF6 100%)`,
          color: '#fff', px: 1.5, py: 1,
          borderRadius: '12px 12px 4px 12px',
        }}>
          <Typography variant="caption" sx={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
            What's our incident reporting window?
          </Typography>
        </Box>
      </Box>
      {/* Assistant message */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Box sx={{
          maxWidth: '85%',
          background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : `${accent}08`,
          border: '1px solid', borderColor: `${accent}25`,
          px: 1.5, py: 1, borderRadius: '12px 12px 12px 4px',
        }}>
          <Typography variant="caption" sx={{ fontSize: '0.78rem', lineHeight: 1.55, color: 'text.primary', display: 'block' }}>
            Section 3.1 requires reporting within{' '}
            <Box component="strong" sx={{ color: accent }}>24 hours</Box> of detection, plus a written postmortem within 5 business days.
          </Typography>
          <Box sx={{
            mt: 1, pt: 0.8, borderTop: '1px dashed',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : `${accent}25`,
            display: 'flex', alignItems: 'center', gap: 0.5,
          }}>
            <Description sx={{ fontSize: 11, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Source: Security Handbook · p.34
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Retention Training — flashcard + SM-2 rating row                */
/* ------------------------------------------------------------------ */
export function RetentionTrainingMock({ theme }) {
  const accent = '#8B5CF6';
  return (
    <Box sx={MOCK_SHELL(theme, accent)}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Chip
          icon={<AccessTime sx={{ fontSize: 12 }} />}
          label="Due now"
          size="small"
          sx={{
            height: 22, fontSize: '0.65rem', fontWeight: 700,
            bgcolor: `${accent}15`, color: accent, borderRadius: '6px',
            '& .MuiChip-icon': { color: accent },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          Card 4 of 12
        </Typography>
      </Box>
      {/* The card body */}
      <Box sx={{
        py: 3, px: 2,
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : `${accent}08`,
        border: '1px solid', borderColor: `${accent}25`,
        borderRadius: '14px',
        textAlign: 'center', mb: 1.5,
      }}>
        <Typography variant="caption" sx={{ color: accent, fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.65rem' }}>
          QUESTION
        </Typography>
        <Typography variant="body2" sx={{
          mt: 0.8, fontWeight: 600, color: 'text.primary', fontSize: '0.92rem', lineHeight: 1.4,
        }}>
          What's the SLA for a Tier-1 customer support ticket?
        </Typography>
        <Box sx={{
          mt: 1.5, pt: 1.5, borderTop: '1px dashed',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : `${accent}30`,
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Tap to reveal answer
          </Typography>
        </Box>
      </Box>
      {/* SM-2 rating bar */}
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem', display: 'block', mb: 0.7 }}>
        How well did you remember?
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.6 }}>
        {[
          { label: 'Again', color: '#EF4444' },
          { label: 'Hard',  color: '#F59E0B' },
          { label: 'Good',  color: accent },
          { label: 'Easy',  color: '#10B981' },
        ].map((r, i) => (
          <Box key={r.label} sx={{
            flex: 1,
            px: 0.5, py: 0.7,
            borderRadius: '8px',
            background: i === 2 ? `linear-gradient(135deg, ${accent} 0%, #6366F1 100%)` : `${r.color}12`,
            border: i === 2 ? 'none' : '1px solid',
            borderColor: `${r.color}30`,
            color: i === 2 ? '#fff' : r.color,
            textAlign: 'center',
            fontSize: '0.65rem',
            fontWeight: 700,
            boxShadow: i === 2 ? `0 4px 14px ${accent}40` : 'none',
          }}>
            {r.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Competency Evaluations — MCQ                                    */
/* ------------------------------------------------------------------ */
export function CompetencyEvaluationMock({ theme }) {
  const accent = '#10B981';
  const options = [
    { text: 'Notify legal within 72 hours', selected: false, correct: false },
    { text: 'Notify the affected user immediately', selected: true,  correct: true  },
    { text: 'File a CRM ticket for internal review', selected: false, correct: false },
    { text: 'Wait for the quarterly compliance audit', selected: false, correct: false },
  ];
  return (
    <Box sx={MOCK_SHELL(theme, accent)}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
          Question 3 of 10
        </Typography>
        <Chip
          icon={<AccessTime sx={{ fontSize: 12 }} />}
          label="14:32"
          size="small"
          sx={{
            height: 22, fontSize: '0.7rem', fontWeight: 700,
            bgcolor: `${accent}15`, color: accent, borderRadius: '6px',
            fontVariantNumeric: 'tabular-nums',
            '& .MuiChip-icon': { color: accent },
          }}
        />
      </Box>
      {/* Progress */}
      <LinearProgress
        variant="determinate"
        value={30}
        sx={{
          height: 5, borderRadius: 4, mb: 2,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : `${accent}15`,
          '& .MuiLinearProgress-bar': {
            background: `linear-gradient(90deg, ${accent} 0%, #34D399 100%)`,
            borderRadius: 4,
          },
        }}
      />
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 1.5, fontSize: '0.88rem', lineHeight: 1.4 }}>
        Under GDPR, what's the correct first step after a confirmed data breach?
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7 }}>
        {options.map((o, i) => (
          <Box key={i} sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: 1.2, py: 0.9,
            borderRadius: '10px',
            background: o.selected
              ? `${accent}12`
              : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)',
            border: '1px solid',
            borderColor: o.selected ? accent : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'),
          }}>
            {o.selected
              ? <CheckCircle sx={{ fontSize: 16, color: accent }} />
              : <RadioButtonUnchecked sx={{ fontSize: 16, color: 'text.disabled' }} />
            }
            <Typography variant="caption" sx={{
              fontSize: '0.78rem',
              color: o.selected ? 'text.primary' : 'text.secondary',
              fontWeight: o.selected ? 600 : 500,
            }}>
              {o.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Growth Roadmaps — adaptive step list                            */
/* ------------------------------------------------------------------ */
export function GrowthRoadmapMock({ theme }) {
  const accent = '#F59E0B';
  const steps = [
    { title: 'Security Fundamentals',     status: 'done',     score: '94%' },
    { title: 'Customer Data Handling',    status: 'done',     score: '88%' },
    { title: 'Incident Response Drills',  status: 'current',  score: null },
    { title: 'Vendor Risk Management',    status: 'upcoming', score: null },
    { title: 'Advanced Compliance',       status: 'upcoming', score: null },
  ];
  return (
    <Box sx={MOCK_SHELL(theme, accent)}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 28, height: 28, borderRadius: '8px',
            background: `linear-gradient(135deg, ${accent} 0%, #FCD34D 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <Bolt sx={{ fontSize: 16 }} />
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block', lineHeight: 1.2, fontSize: '0.78rem' }}>
              Sarah's Roadmap
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
              Operations · adaptive
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: accent, fontSize: '0.85rem', display: 'block', lineHeight: 1 }}>
            40%
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>
            complete
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
        {steps.map((s, i) => {
          const isDone = s.status === 'done';
          const isCurrent = s.status === 'current';
          return (
            <Box key={i} sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 1, py: 0.8,
              borderRadius: '10px',
              background: isCurrent
                ? `${accent}12`
                : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'transparent',
              border: '1px solid',
              borderColor: isCurrent ? accent : 'transparent',
            }}>
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%',
                background: isDone
                  ? `linear-gradient(135deg, ${accent} 0%, #FCD34D 100%)`
                  : isCurrent ? '#fff' : 'transparent',
                border: isDone ? 'none' : '2px solid',
                borderColor: isCurrent ? accent : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', flexShrink: 0,
                boxShadow: isCurrent ? `0 0 0 4px ${accent}25` : 'none',
              }}>
                {isDone && <CheckCircle sx={{ fontSize: 14 }} />}
                {isCurrent && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accent }} />}
              </Box>
              <Typography variant="caption" sx={{
                flex: 1, fontSize: '0.78rem',
                color: isDone || isCurrent ? 'text.primary' : 'text.secondary',
                fontWeight: isCurrent ? 700 : 500,
                textDecoration: 'none',
              }}>
                {s.title}
              </Typography>
              {s.score && (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: accent, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {s.score}
                </Typography>
              )}
              {isCurrent && (
                <Chip label="UP NEXT" size="small" sx={{
                  height: 16, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em',
                  bgcolor: accent, color: '#fff', borderRadius: '4px',
                }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 5. SOP of the Day — daily highlight dialog                         */
/* ------------------------------------------------------------------ */
export function SOPOfTheDayMock({ theme }) {
  const accent = '#06B6D4';
  return (
    <Box sx={MOCK_SHELL(theme, accent)}>
      {/* Date header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        mb: 1.8,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 28, height: 28, borderRadius: '8px',
            background: `linear-gradient(135deg, ${accent} 0%, #0891B2 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <LightbulbOutlined sx={{ fontSize: 15 }} />
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block', lineHeight: 1.2, fontSize: '0.78rem' }}>
              Today's highlight
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem' }}>
              Auto-rotated · 06:30 daily
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<Today sx={{ fontSize: 12 }} />}
          label="DAY 47"
          size="small"
          sx={{
            height: 20, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
            bgcolor: `${accent}15`, color: accent, borderRadius: '5px',
            '& .MuiChip-icon': { color: accent },
          }}
        />
      </Box>
      {/* Source doc chip */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1.2 }}>
        <Description sx={{ fontSize: 13, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          From: Customer Escalation SOP · §3.4
        </Typography>
      </Box>
      {/* Title */}
      <Typography variant="body2" sx={{
        fontWeight: 700, color: 'text.primary', mb: 1,
        fontSize: '0.95rem', lineHeight: 1.35,
      }}>
        Always confirm severity before escalating.
      </Typography>
      {/* Body — 3 key points */}
      <Box sx={{
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : `${accent}08`,
        border: '1px solid', borderColor: `${accent}25`,
        borderRadius: '12px',
        p: 1.5, mb: 1.5,
      }}>
        {[
          'P0 = customer-blocking, page on-call immediately',
          'P1 = degraded UX, file ticket in #escalations',
          'P2 = cosmetic, batch in weekly review',
        ].map((point, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, mb: i < 2 ? 0.7 : 0 }}>
            <Box sx={{
              minWidth: 16, mt: '3px',
              color: accent, fontSize: '0.7rem', fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {i + 1}.
            </Box>
            <Typography variant="caption" sx={{
              fontSize: '0.74rem', lineHeight: 1.5, color: 'text.primary',
            }}>
              {point}
            </Typography>
          </Box>
        ))}
      </Box>
      {/* Footer action */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem' }}>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
            <TipsAndUpdates sx={{ fontSize: 11, color: accent }} />
            Read in under 30 seconds
          </Box>
        </Typography>
        <Box sx={{
          px: 1.2, py: 0.5,
          borderRadius: '999px',
          background: `linear-gradient(135deg, ${accent} 0%, #0891B2 100%)`,
          color: '#fff',
          fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.02em',
          boxShadow: `0 4px 14px ${accent}40`,
        }}>
          Got it
        </Box>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Onboarding — new-hire checklist with progress                   */
/* ------------------------------------------------------------------ */
export function OnboardingMock({ theme }) {
  const accent = '#14B8A6';
  const steps = [
    { label: 'Read: Company Handbook', done: true },
    { label: 'Training: Security Basics', done: true },
    { label: 'Evaluation: Code of Conduct', done: false },
  ];
  return (
    <Box sx={MOCK_SHELL(theme, accent)}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: `linear-gradient(135deg, ${accent} 0%, #0D9488 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <RocketLaunch sx={{ fontSize: 16 }} />
        </Box>
        <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ flex: 1 }}>Engineering New Hire</Typography>
        <Typography variant="caption" fontWeight={700} sx={{ color: accent }}>67%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={67} sx={{ height: 6, borderRadius: 3, mb: 1.5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 3, background: `linear-gradient(90deg, ${accent}, #0D9488)` } }} />
      {steps.map((s) => (
        <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8, p: 1, borderRadius: '10px', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : `${accent}08`, borderLeft: '3px solid', borderColor: s.done ? accent : 'divider' }}>
          {s.done ? <CheckCircle sx={{ fontSize: 16, color: accent }} /> : <RadioButtonUnchecked sx={{ fontSize: 16, color: 'text.disabled' }} />}
          <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.primary' }}>{s.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Learning Tracks — sequential course steps                       */
/* ------------------------------------------------------------------ */
export function LearningTracksMock({ theme }) {
  const accent = '#6366F1';
  const items = [
    { icon: <Description sx={{ fontSize: 13 }} />, label: 'Intro to Kubernetes', state: 'done' },
    { icon: <Style sx={{ fontSize: 13 }} />, label: 'Pod Networking Cards', state: 'active' },
    { icon: <Quiz sx={{ fontSize: 13 }} />, label: 'Deployment Quiz', state: 'locked' },
  ];
  return (
    <Box sx={MOCK_SHELL(theme, accent)}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ flex: 1 }}>Kubernetes Fundamentals</Typography>
        <Chip label="TRACK" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${accent}15`, color: accent, borderRadius: '4px' }} />
      </Box>
      {items.map((it, i) => (
        <Box key={it.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8, p: 1, borderRadius: '10px', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : `${accent}08`, opacity: it.state === 'locked' ? 0.55 : 1, borderLeft: '3px solid', borderColor: it.state === 'done' ? '#10B981' : it.state === 'active' ? accent : 'divider' }}>
          <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: `${accent}18`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.icon}</Box>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.primary', flex: 1 }}>{it.label}</Typography>
          {it.state === 'done' ? <CheckCircle sx={{ fontSize: 15, color: '#10B981' }} /> : it.state === 'locked' ? <Lock sx={{ fontSize: 13, color: 'text.disabled' }} /> : <Bolt sx={{ fontSize: 14, color: accent }} />}
        </Box>
      ))}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 8. Mentorship — AI-suggested pairing                               */
/* ------------------------------------------------------------------ */
export function MentorshipMock({ theme }) {
  const accent = '#EC4899';
  return (
    <Box sx={MOCK_SHELL(theme, accent)}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: `linear-gradient(135deg, ${accent} 0%, #BE185D 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Diversity3 sx={{ fontSize: 16 }} />
        </Box>
        <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ flex: 1 }}>Suggested pairing</Typography>
        <Chip label="AI MATCH" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${accent}15`, color: accent, borderRadius: '4px' }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ flex: 1, textAlign: 'center', p: 1, borderRadius: '10px', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#10B98112' }}>
          <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block', fontSize: '0.72rem' }}>Sara A.</Typography>
          <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#10B981' }}>Strong · Docker</Typography>
        </Box>
        <ArrowForward sx={{ fontSize: 16, color: accent }} />
        <Box sx={{ flex: 1, textAlign: 'center', p: 1, borderRadius: '10px', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#EF444412' }}>
          <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block', fontSize: '0.72rem' }}>Bilal K.</Typography>
          <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#EF4444' }}>Gap · Docker</Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem' }}>
        Matched from growth-roadmap data — strength meets gap.
      </Typography>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 9. L&D Analytics — KPIs + skill-gap bars                            */
/* ------------------------------------------------------------------ */
export function AnalyticsMock({ theme }) {
  const accent = '#0EA5E9';
  const gaps = [
    { skill: 'Incident Response', v: 90 },
    { skill: 'Data Privacy', v: 55 },
    { skill: 'Access Control', v: 30 },
  ];
  return (
    <Box sx={MOCK_SHELL(theme, accent)}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        {[{ k: 'Avg Score', v: '82%' }, { k: 'Retention', v: '74%' }, { k: 'Roadmaps', v: '128' }].map((m) => (
          <Box key={m.k} sx={{ flex: 1, p: 1, borderRadius: '10px', textAlign: 'center', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : `${accent}0D` }}>
            <Typography variant="caption" fontWeight={800} color="text.primary" sx={{ display: 'block', fontSize: '0.9rem' }}>{m.v}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{m.k}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Warning sx={{ fontSize: 13, color: '#EF4444' }} />
        <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ fontSize: '0.68rem' }}>Top skill gaps</Typography>
      </Box>
      {gaps.map((g) => (
        <Box key={g.skill} sx={{ mb: 0.8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.primary' }}>{g.skill}</Typography>
          </Box>
          <LinearProgress variant="determinate" value={g.v} sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 3, background: g.v > 70 ? 'linear-gradient(90deg,#EF4444,#DC2626)' : g.v > 45 ? 'linear-gradient(90deg,#F59E0B,#D97706)' : 'linear-gradient(90deg,#10B981,#059669)' } }} />
        </Box>
      ))}
    </Box>
  );
}
