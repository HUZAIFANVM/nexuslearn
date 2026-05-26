import { useEffect, useState } from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import { Person, AutoAwesome, MenuBook } from '@mui/icons-material';
import NexusMark from '../brand/NexusMark';

/**
 * HeroChatPreview — self-playing live demo of the Knowledge Assistant.
 *
 * Cycles 3 example Q&A pairs. Each scenario:
 *   1. User message lands instantly with the source-doc chip
 *   2. ~600 ms beat, then typing dots
 *   3. Assistant streams answer char-by-char
 *   4. Read pause, then advance to next scenario
 * No external chat library — pure state machine + setTimeout.
 */

const SCENARIOS = [
  {
    docTag: 'Data Retention Policy',
    user: 'How long do we keep customer support tickets?',
    bot: 'Per Section 4.2: support tickets are kept for **18 months** after resolution, then auto-purged from the CRM. Legal-hold records are exempt until the hold is cleared.',
  },
  {
    docTag: 'Engineering Onboarding',
    user: 'What\'s the first-week checklist for a new engineer?',
    bot: 'Week 1 covers four things: IT setup + access, intros + 1:1 with manager, read the engineering handbook, and ship a tiny PR by Friday. Full list in Section 2 of the onboarding doc.',
  },
  {
    docTag: 'Code of Conduct',
    user: 'Can I accept a gift from a vendor?',
    bot: 'Gifts under **$50** are fine without disclosure. Anything above must be logged with your manager within 5 business days. Cash or cash-equivalents are never acceptable.',
  },
];

const USER_HOLD_MS = 600;
const TYPING_MS = 800;
const CHAR_INTERVAL_MS = 18;
const READ_PAUSE_MS = 3800;

function renderInlineBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (
    p.startsWith('**') && p.endsWith('**')
      ? <Box key={i} component="strong" sx={{ color: 'text.primary', fontWeight: 700 }}>{p.slice(2, -2)}</Box>
      : <Box key={i} component="span">{p}</Box>
  ));
}

export default function HeroChatPreview() {
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState('user');  // user → typing → streaming → done
  const [streamed, setStreamed] = useState('');

  const scenario = SCENARIOS[idx];

  // Reset + scheduling for each scenario.
  useEffect(() => {
    setStreamed('');
    setStage('user');
    const t1 = setTimeout(() => setStage('typing'), USER_HOLD_MS);
    const t2 = setTimeout(() => setStage('streaming'), USER_HOLD_MS + TYPING_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [idx]);

  // Character streaming during streaming stage.
  useEffect(() => {
    if (stage !== 'streaming') return undefined;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i >= scenario.bot.length) {
        clearInterval(interval);
        setStreamed(scenario.bot);
        setStage('done');
      } else {
        setStreamed(scenario.bot.slice(0, i));
      }
    }, CHAR_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [stage, scenario]);

  // Auto-advance after done.
  useEffect(() => {
    if (stage !== 'done') return undefined;
    const t = setTimeout(() => setIdx((i) => (i + 1) % SCENARIOS.length), READ_PAUSE_MS);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 500, mx: 'auto' }}>
      {/* Two tilted glass cards drifting behind — purely decorative */}
      <Box aria-hidden sx={{
        position: 'absolute', inset: 0,
        transform: 'translate(26px, 26px) rotate(4deg)',
        background: (t) => t.palette.mode === 'dark' ? 'rgba(99,102,241,0.10)' : 'rgba(99,102,241,0.08)',
        borderRadius: '24px',
        border: '1px solid',
        borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.22)',
        backdropFilter: 'blur(8px)',
        zIndex: 0,
      }} />
      <Box aria-hidden sx={{
        position: 'absolute', inset: 0,
        transform: 'translate(-20px, 16px) rotate(-3deg)',
        background: (t) => t.palette.mode === 'dark' ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.07)',
        borderRadius: '24px',
        border: '1px solid',
        borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.22)',
        backdropFilter: 'blur(8px)',
        zIndex: 0,
      }} />

      {/* Main preview card */}
      <Box sx={{
        position: 'relative',
        zIndex: 1,
        background: (t) => t.palette.mode === 'dark' ? 'rgba(17,24,39,0.78)' : 'rgba(255,255,255,0.80)',
        backdropFilter: 'blur(28px) saturate(170%)',
        border: '1px solid',
        borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.6)',
        borderRadius: '24px',
        boxShadow: (t) => t.palette.mode === 'dark'
          ? '0 30px 80px -20px rgba(0,0,0,0.55)'
          : '0 30px 80px -20px rgba(99,102,241,0.30)',
        p: { xs: 2, md: 2.5 },
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          mb: 2.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '11px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 6px 16px rgba(99,102,241,0.40)',
          }}>
            <NexusMark size={20} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.1 }}>
              Knowledge Assistant
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              Live preview · cycling examples
            </Typography>
          </Box>
          <Chip
            icon={<MenuBook sx={{ fontSize: 13 }} />}
            label={scenario.docTag}
            size="small"
            sx={{
              bgcolor: 'rgba(99,102,241,0.12)',
              color: '#6366F1',
              fontWeight: 600,
              fontSize: '0.66rem',
              height: 22,
              borderRadius: '6px',
              '& .MuiChip-icon': { color: '#6366F1' },
              maxWidth: 180,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Box>

        {/* User message */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5, gap: 1 }}>
          <Box sx={{
            maxWidth: '78%',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            color: '#fff',
            px: 2, py: 1.25,
            borderRadius: '16px 16px 4px 16px',
            boxShadow: '0 6px 20px rgba(99,102,241,0.30)',
          }}>
            <Typography variant="body2" sx={{ lineHeight: 1.55, fontSize: '0.88rem' }}>
              {scenario.user}
            </Typography>
          </Box>
          <Avatar sx={{
            width: 28, height: 28, bgcolor: '#0F172A', fontSize: 13,
            border: '2px solid', borderColor: 'background.paper',
          }}>
            <Person sx={{ fontSize: 14 }} />
          </Avatar>
        </Box>

        {/* Assistant response — typing dots → streamed text */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1, minHeight: 124 }}>
          <Avatar sx={{
            width: 28, height: 28, borderRadius: '8px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
          }}>
            <AutoAwesome sx={{ fontSize: 14 }} />
          </Avatar>
          <Box sx={{ maxWidth: '78%', flex: 1 }}>
            {(stage === 'user' || stage === 'typing') ? (
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.06)',
                border: '1px solid',
                borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.15)',
                px: 2, py: 1.4,
                borderRadius: '16px 16px 16px 4px',
                '@keyframes nl-typing': {
                  '0%, 60%, 100%': { opacity: 0.3, transform: 'translateY(0)' },
                  '30%': { opacity: 1, transform: 'translateY(-3px)' },
                },
              }}>
                {[0, 0.15, 0.3].map((d) => (
                  <Box key={d} sx={{
                    width: 7, height: 7, borderRadius: '50%',
                    bgcolor: '#8B5CF6',
                    animation: stage === 'typing' ? `nl-typing 1.2s ease-in-out ${d}s infinite` : 'none',
                    opacity: stage === 'typing' ? 0.3 : 0,
                  }} />
                ))}
              </Box>
            ) : (
              <Box sx={{
                background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(12px)',
                border: '1px solid',
                borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.15)',
                px: 2, py: 1.4,
                borderRadius: '16px 16px 16px 4px',
                boxShadow: (t) => t.palette.mode === 'dark' ? 'none' : '0 6px 20px -6px rgba(99,102,241,0.20)',
              }}>
                <Typography variant="body2" sx={{ lineHeight: 1.6, fontSize: '0.88rem', color: 'text.primary' }}>
                  {renderInlineBold(streamed)}
                  {stage === 'streaming' && (
                    <Box component="span" sx={{
                      display: 'inline-block',
                      width: 6, height: 14, ml: 0.3,
                      bgcolor: '#8B5CF6',
                      verticalAlign: 'text-bottom',
                      animation: 'nl-cursor 0.7s ease-in-out infinite',
                      '@keyframes nl-cursor': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0 },
                      },
                    }} />
                  )}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Scenario indicator dots */}
        <Box sx={{
          display: 'flex', justifyContent: 'center', gap: 0.7,
          mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider',
        }}>
          {SCENARIOS.map((_, i) => (
            <Box key={i} sx={{
              width: i === idx ? 24 : 7, height: 7, borderRadius: 4,
              background: i === idx
                ? 'linear-gradient(90deg, #3B82F6, #8B5CF6)'
                : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.15)',
              transition: 'width 0.4s ease, background 0.4s ease',
            }} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
