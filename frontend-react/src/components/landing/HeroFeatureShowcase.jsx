import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Avatar, Chip, LinearProgress } from '@mui/material';
import {
  SmartToy, Style, Quiz, Route, LightbulbOutlined,
  Person, AutoAwesome, MenuBook, Description, CheckCircle,
  RadioButtonUnchecked, AccessTime, Bolt, Today, TipsAndUpdates,
} from '@mui/icons-material';
import NexusMark from '../brand/NexusMark';

/**
 * HeroFeatureShowcase — the hero's living product preview.
 *
 * Shows an animated mini-demo for each of the 5 features. Auto-rotates
 * every ROTATE_MS, and can be switched manually with the selector pills
 * (which resets the rotation timer). Each demo is keyed by the active
 * index so it remounts and replays its entrance animation on switch.
 */

const FEATURES = [
  { key: 'knowledge',  label: 'Knowledge Assistants',   short: 'Assistant',  icon: <SmartToy sx={{ fontSize: 17 }} />,         color: '#3B82F6' },
  { key: 'retention',  label: 'Retention Training',      short: 'Retention',  icon: <Style sx={{ fontSize: 17 }} />,            color: '#8B5CF6' },
  { key: 'competency', label: 'Competency Evaluations',  short: 'Evaluation', icon: <Quiz sx={{ fontSize: 17 }} />,             color: '#10B981' },
  { key: 'roadmap',    label: 'Growth Roadmaps',         short: 'Roadmap',    icon: <Route sx={{ fontSize: 17 }} />,            color: '#F59E0B' },
  { key: 'sop',        label: 'SOP of the Day',          short: 'SOP',        icon: <LightbulbOutlined sx={{ fontSize: 17 }} />, color: '#06B6D4' },
];

const ROTATE_MS = 7000;
const DEMO_MIN_HEIGHT = 268;

/* small helper: a stagger-reveal box */
const reveal = (show, delayMs = 0, fromY = 8) => ({
  opacity: show ? 1 : 0,
  transform: show ? 'translateY(0)' : `translateY(${fromY}px)`,
  transition: `opacity 0.45s ease ${delayMs}ms, transform 0.45s ease ${delayMs}ms`,
});

/* ------------------------------------------------------------------ */
/* useStep — advance through animation phases via timed setTimeouts    */
/* ------------------------------------------------------------------ */
function useStep(stops) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = stops.map((at, i) => setTimeout(() => setStep(i + 1), at));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return step;
}

/* ------------------------------------------------------------------ */
/* 1. Knowledge Assistant — typing → streamed answer                  */
/* ------------------------------------------------------------------ */
function KnowledgeDemo() {
  const accent = '#3B82F6';
  const answer = 'Section 3.1 requires reporting within 24 hours of detection, plus a written postmortem within 5 business days.';
  const [stage, setStage] = useState('user'); // user → typing → streaming → done
  const [streamed, setStreamed] = useState('');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('typing'), 500);
    const t2 = setTimeout(() => setStage('streaming'), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (stage !== 'streaming') return undefined;
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      if (i >= answer.length) { clearInterval(iv); setStreamed(answer); setStage('done'); }
      else setStreamed(answer.slice(0, i));
    }, 22);
    return () => clearInterval(iv);
  }, [stage]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1.5 }}>
        <Description sx={{ fontSize: 13, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          Security Handbook.pdf · indexed
        </Typography>
      </Box>
      {/* user msg */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.3, gap: 1 }}>
        <Box sx={{
          maxWidth: '80%', px: 1.75, py: 1,
          background: `linear-gradient(135deg, ${accent} 0%, #8B5CF6 100%)`,
          color: '#fff', borderRadius: '14px 14px 4px 14px',
          boxShadow: '0 6px 18px rgba(99,102,241,0.28)',
        }}>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
            What&apos;s our incident reporting window?
          </Typography>
        </Box>
        <Avatar sx={{ width: 26, height: 26, bgcolor: '#0F172A' }}><Person sx={{ fontSize: 13 }} /></Avatar>
      </Box>
      {/* assistant */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Avatar sx={{ width: 26, height: 26, borderRadius: '8px', background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' }}>
          <AutoAwesome sx={{ fontSize: 13 }} />
        </Avatar>
        <Box sx={{ maxWidth: '82%' }}>
          {(stage === 'user' || stage === 'typing') ? (
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.6,
              px: 1.75, py: 1.3, borderRadius: '14px 14px 14px 4px',
              background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : `${accent}08`,
              border: '1px solid', borderColor: `${accent}22`,
              '@keyframes nl-hs-typing': {
                '0%,60%,100%': { opacity: 0.3, transform: 'translateY(0)' },
                '30%': { opacity: 1, transform: 'translateY(-3px)' },
              },
            }}>
              {[0, 0.15, 0.3].map((d) => (
                <Box key={d} sx={{
                  width: 6, height: 6, borderRadius: '50%', bgcolor: accent,
                  animation: stage === 'typing' ? `nl-hs-typing 1.2s ease-in-out ${d}s infinite` : 'none',
                  opacity: stage === 'typing' ? 0.3 : 0,
                }} />
              ))}
            </Box>
          ) : (
            <Box sx={{
              px: 1.75, py: 1.3, borderRadius: '14px 14px 14px 4px',
              background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)',
              border: '1px solid', borderColor: `${accent}22`,
            }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'text.primary' }}>
                {streamed.replace('24 hours', '')}
                {streamed.includes('24 hours') && <Box component="strong" sx={{ color: accent }}>24 hours</Box>}
                {stage === 'streaming' && (
                  <Box component="span" sx={{
                    display: 'inline-block', width: 5, height: 13, ml: 0.3,
                    bgcolor: accent, verticalAlign: 'text-bottom',
                    animation: 'nl-hs-cursor 0.7s ease-in-out infinite',
                    '@keyframes nl-hs-cursor': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
                  }} />
                )}
              </Typography>
              {stage === 'done' && (
                <Box sx={{ mt: 1, pt: 0.7, borderTop: '1px dashed', borderColor: `${accent}25`, display: 'flex', alignItems: 'center', gap: 0.5, ...reveal(true) }}>
                  <Description sx={{ fontSize: 11, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.64rem' }}>
                    Source: Security Handbook · p.34
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Retention Training — flashcard reveal + rating                  */
/* ------------------------------------------------------------------ */
function RetentionDemo() {
  const accent = '#8B5CF6';
  // 1 = question, 2 = answer revealed, 3 = "Good" picked
  const step = useStep([1600, 3000]);
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.3 }}>
        <Chip icon={<AccessTime sx={{ fontSize: 12 }} />} label="Due now" size="small" sx={{
          height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${accent}15`, color: accent,
          borderRadius: '6px', '& .MuiChip-icon': { color: accent },
        }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Card 4 of 12</Typography>
      </Box>
      <Box sx={{
        py: 2.2, px: 2, mb: 1.3, borderRadius: '14px', textAlign: 'center',
        background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : `${accent}08`,
        border: '1px solid', borderColor: `${accent}25`,
      }}>
        <Typography variant="caption" sx={{ color: accent, fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.62rem' }}>
          QUESTION
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.6, fontWeight: 600, color: 'text.primary', fontSize: '0.9rem', lineHeight: 1.4 }}>
          What&apos;s the SLA for a Tier-1 support ticket?
        </Typography>
        <Box sx={{ mt: 1.3, pt: 1.3, borderTop: '1px dashed', borderColor: `${accent}30` }}>
          {step >= 1 ? (
            <Box sx={reveal(true)}>
              <Typography variant="caption" sx={{ color: accent, fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.62rem' }}>
                ANSWER
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.4, fontWeight: 600, color: 'text.primary', fontSize: '0.88rem' }}>
                First response within <Box component="strong" sx={{ color: accent }}>1 hour</Box>, resolution within 8.
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Revealing answer…
            </Typography>
          )}
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem', display: 'block', mb: 0.7 }}>
        How well did you remember?
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.6 }}>
        {[
          { label: 'Again', color: '#EF4444' },
          { label: 'Hard',  color: '#F59E0B' },
          { label: 'Good',  color: accent },
          { label: 'Easy',  color: '#10B981' },
        ].map((r) => {
          const picked = step >= 2 && r.label === 'Good';
          return (
            <Box key={r.label} sx={{
              flex: 1, py: 0.7, borderRadius: '8px', textAlign: 'center',
              fontSize: '0.65rem', fontWeight: 700,
              background: picked ? `linear-gradient(135deg, ${accent} 0%, #6366F1 100%)` : `${r.color}12`,
              border: picked ? 'none' : '1px solid', borderColor: `${r.color}30`,
              color: picked ? '#fff' : r.color,
              boxShadow: picked ? `0 4px 14px ${accent}45` : 'none',
              transform: picked ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.3s ease',
            }}>
              {r.label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Competency Evaluation — option select + grade                   */
/* ------------------------------------------------------------------ */
function CompetencyDemo() {
  const accent = '#10B981';
  const options = [
    'Notify legal within 72 hours',
    'Notify the affected user immediately',
    'File a CRM ticket for internal review',
    'Wait for the quarterly compliance audit',
  ];
  const correctIdx = 1;
  // 1 = selected, 2 = graded
  const step = useStep([1500, 2600]);
  const progress = step >= 2 ? 40 : 30;
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
          Question {step >= 2 ? 4 : 3} of 10
        </Typography>
        <Chip icon={<AccessTime sx={{ fontSize: 12 }} />} label="14:32" size="small" sx={{
          height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: `${accent}15`, color: accent,
          borderRadius: '6px', fontVariantNumeric: 'tabular-nums', '& .MuiChip-icon': { color: accent },
        }} />
      </Box>
      <LinearProgress variant="determinate" value={progress} sx={{
        height: 5, borderRadius: 4, mb: 1.6,
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : `${accent}15`,
        '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${accent} 0%, #34D399 100%)`, borderRadius: 4, transition: 'transform 0.6s ease' },
      }} />
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 1.3, fontSize: '0.86rem', lineHeight: 1.4 }}>
        Under GDPR, what&apos;s the correct first step after a confirmed data breach?
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
        {options.map((o, i) => {
          const selected = step >= 1 && i === correctIdx;
          const graded = step >= 2 && i === correctIdx;
          return (
            <Box key={i} sx={{
              display: 'flex', alignItems: 'center', gap: 1, px: 1.1, py: 0.85, borderRadius: '10px',
              background: selected ? `${accent}12` : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)',
              border: '1px solid',
              borderColor: graded ? accent : selected ? `${accent}80` : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
              transition: 'all 0.3s ease',
            }}>
              {selected
                ? <CheckCircle sx={{ fontSize: 16, color: accent }} />
                : <RadioButtonUnchecked sx={{ fontSize: 16, color: 'text.disabled' }} />}
              <Typography variant="caption" sx={{
                fontSize: '0.76rem', color: selected ? 'text.primary' : 'text.secondary', fontWeight: selected ? 600 : 500,
              }}>
                {o}
              </Typography>
              {graded && (
                <Typography variant="caption" sx={{ ml: 'auto', fontSize: '0.62rem', fontWeight: 800, color: accent, ...reveal(true) }}>
                  ✓ CORRECT
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Growth Roadmap — steps check off + % climbs                     */
/* ------------------------------------------------------------------ */
function RoadmapDemo() {
  const accent = '#F59E0B';
  const steps = [
    { title: 'Security Fundamentals',    score: '94%' },
    { title: 'Customer Data Handling',   score: '88%' },
    { title: 'Incident Response Drills', score: null },
    { title: 'Vendor Risk Management',   score: null },
    { title: 'Advanced Compliance',      score: null },
  ];
  // reveal count climbs: step 1 → 1 done, step 2 → 2 done (current = idx 2)
  const step = useStep([700, 1500]);
  const doneCount = step; // 0,1,2
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const target = 40;
    const started = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - started) / 1400);
      setPct(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 28, height: 28, borderRadius: '8px',
            background: `linear-gradient(135deg, ${accent} 0%, #FCD34D 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <Bolt sx={{ fontSize: 15 }} />
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block', lineHeight: 1.2, fontSize: '0.78rem' }}>
              Sarah&apos;s Roadmap
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem' }}>Operations · adaptive</Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" fontWeight={800} sx={{ color: accent, fontSize: '0.9rem', display: 'block', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {pct}%
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>complete</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {steps.map((s, i) => {
          const isDone = i < doneCount;
          const isCurrent = i === doneCount;
          return (
            <Box key={i} sx={{
              display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.7, borderRadius: '10px',
              background: isCurrent ? `${accent}12` : 'transparent',
              border: '1px solid', borderColor: isCurrent ? accent : 'transparent',
              transition: 'all 0.4s ease',
            }}>
              <Box sx={{
                width: 19, height: 19, borderRadius: '50%', flexShrink: 0,
                background: isDone ? `linear-gradient(135deg, ${accent} 0%, #FCD34D 100%)` : isCurrent ? '#fff' : 'transparent',
                border: isDone ? 'none' : '2px solid',
                borderColor: isCurrent ? accent : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                boxShadow: isCurrent ? `0 0 0 4px ${accent}25` : 'none',
                transition: 'all 0.4s ease',
              }}>
                {isDone && <CheckCircle sx={{ fontSize: 13 }} />}
                {isCurrent && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accent }} />}
              </Box>
              <Typography variant="caption" sx={{
                flex: 1, fontSize: '0.78rem',
                color: isDone || isCurrent ? 'text.primary' : 'text.secondary',
                fontWeight: isCurrent ? 700 : 500,
              }}>
                {s.title}
              </Typography>
              {isDone && s.score && (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: accent, fontWeight: 700 }}>{s.score}</Typography>
              )}
              {isCurrent && (
                <Chip label="UP NEXT" size="small" sx={{ height: 16, fontSize: '0.54rem', fontWeight: 700, bgcolor: accent, color: '#fff', borderRadius: '4px' }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* 5. SOP of the Day — highlight card with staggered points           */
/* ------------------------------------------------------------------ */
function SOPDemo() {
  const accent = '#06B6D4';
  const points = [
    'P0 = customer-blocking, page on-call immediately',
    'P1 = degraded UX, file ticket in #escalations',
    'P2 = cosmetic, batch in weekly review',
  ];
  const step = useStep([400, 700, 1000, 1300]);
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.4, ...reveal(step >= 1) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 28, height: 28, borderRadius: '8px',
            background: `linear-gradient(135deg, ${accent} 0%, #0891B2 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <LightbulbOutlined sx={{ fontSize: 15 }} />
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block', lineHeight: 1.2, fontSize: '0.78rem' }}>
              Today&apos;s highlight
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.64rem' }}>Auto-rotated · 06:30 daily</Typography>
          </Box>
        </Box>
        <Chip icon={<Today sx={{ fontSize: 12 }} />} label="DAY 47" size="small" sx={{
          height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${accent}15`, color: accent,
          borderRadius: '5px', '& .MuiChip-icon': { color: accent },
        }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1, ...reveal(step >= 1, 80) }}>
        <Description sx={{ fontSize: 13, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          From: Customer Escalation SOP · §3.4
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 1, fontSize: '0.92rem', lineHeight: 1.35, ...reveal(step >= 2) }}>
        Always confirm severity before escalating.
      </Typography>
      <Box sx={{
        p: 1.4, borderRadius: '12px', mb: 1.2,
        background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : `${accent}08`,
        border: '1px solid', borderColor: `${accent}25`,
      }}>
        {points.map((p, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, mb: i < 2 ? 0.6 : 0, ...reveal(step >= 3 + Math.min(i, 1), i * 90) }}>
            <Box sx={{ minWidth: 14, mt: '2px', color: accent, fontSize: '0.68rem', fontWeight: 800 }}>{i + 1}.</Box>
            <Typography variant="caption" sx={{ fontSize: '0.73rem', lineHeight: 1.45, color: 'text.primary' }}>{p}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...reveal(step >= 4, 120) }}>
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
          <TipsAndUpdates sx={{ fontSize: 11, color: accent }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.64rem' }}>Read in under 30 seconds</Typography>
        </Box>
        <Box sx={{
          px: 1.2, py: 0.5, borderRadius: '999px', fontSize: '0.66rem', fontWeight: 700,
          background: `linear-gradient(135deg, ${accent} 0%, #0891B2 100%)`, color: '#fff',
          boxShadow: `0 4px 14px ${accent}40`,
        }}>
          Got it
        </Box>
      </Box>
    </Box>
  );
}

const DEMOS = {
  knowledge: KnowledgeDemo,
  retention: RetentionDemo,
  competency: CompetencyDemo,
  roadmap: RoadmapDemo,
  sop: SOPDemo,
};

export default function HeroFeatureShowcase() {
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  // Auto-rotate; timer restarts whenever `active` changes (incl. manual click).
  useEffect(() => {
    const t = setTimeout(() => {
      if (!pausedRef.current) setActive((a) => (a + 1) % FEATURES.length);
    }, ROTATE_MS);
    return () => clearTimeout(t);
  }, [active]);

  const feature = FEATURES[active];
  const Demo = DEMOS[feature.key];

  const handlePick = (i) => setActive(i);

  return (
    <Box
      sx={{ position: 'relative', width: '100%', maxWidth: 500, mx: 'auto' }}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* tilted decorative cards behind */}
      <Box aria-hidden sx={{
        position: 'absolute', inset: 0, transform: 'translate(26px, 26px) rotate(4deg)',
        background: (t) => t.palette.mode === 'dark' ? 'rgba(99,102,241,0.10)' : 'rgba(99,102,241,0.08)',
        borderRadius: '24px', border: '1px solid',
        borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.22)',
        backdropFilter: 'blur(8px)', zIndex: 0,
      }} />
      <Box aria-hidden sx={{
        position: 'absolute', inset: 0, transform: 'translate(-20px, 16px) rotate(-3deg)',
        background: (t) => t.palette.mode === 'dark' ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.07)',
        borderRadius: '24px', border: '1px solid',
        borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.22)',
        backdropFilter: 'blur(8px)', zIndex: 0,
      }} />

      {/* main card */}
      <Box sx={{
        position: 'relative', zIndex: 1,
        background: (t) => t.palette.mode === 'dark' ? 'rgba(17,24,39,0.78)' : 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(28px) saturate(170%)',
        border: '1px solid',
        borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.6)',
        borderRadius: '24px',
        boxShadow: (t) => t.palette.mode === 'dark'
          ? '0 30px 80px -20px rgba(0,0,0,0.55)'
          : '0 30px 80px -20px rgba(99,102,241,0.30)',
        p: { xs: 2, md: 2.5 },
      }}>
        {/* header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '10px',
            background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}AA 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: `0 6px 16px ${feature.color}55`,
            transition: 'background 0.4s ease, box-shadow 0.4s ease',
          }}>
            <NexusMark size={19} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.1 }}>
              {feature.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Live preview · auto-rotating
            </Typography>
          </Box>
        </Box>

        {/* demo area — fixed min height, remounts per active feature */}
        <Box sx={{ minHeight: DEMO_MIN_HEIGHT }}>
          <Box key={active} sx={{ animation: 'nl-hs-fade 0.4s ease', '@keyframes nl-hs-fade': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
            <Demo />
          </Box>
        </Box>

        {/* selector pills */}
        <Box sx={{
          display: 'flex', gap: 0.6, mt: 2, pt: 1.75,
          borderTop: '1px solid', borderColor: 'divider',
          justifyContent: 'center', flexWrap: 'wrap',
        }}>
          {FEATURES.map((f, i) => {
            const isActive = i === active;
            return (
              <Box
                key={f.key}
                onClick={() => handlePick(i)}
                role="button"
                aria-label={`Show ${f.label}`}
                aria-pressed={isActive}
                title={f.label}
                sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 0.5,
                  px: isActive ? 1.3 : 0.9, py: 0.7,
                  borderRadius: '999px', cursor: 'pointer',
                  color: isActive ? '#fff' : 'text.secondary',
                  background: isActive ? `linear-gradient(135deg, ${f.color} 0%, ${f.color}CC 100%)` : 'transparent',
                  border: '1px solid',
                  borderColor: isActive ? 'transparent' : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)',
                  boxShadow: isActive ? `0 6px 16px ${f.color}45` : 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': { borderColor: isActive ? 'transparent' : `${f.color}66`, color: isActive ? '#fff' : f.color },
                }}
              >
                {f.icon}
                {isActive && (
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {f.short}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
