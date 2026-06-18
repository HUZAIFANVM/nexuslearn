import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Chip, Container,
} from '@mui/material';
import {
  Favorite, Handshake, ShoppingBag, IntegrationInstructions,
  ArrowForward, ArrowBack, Email, AutoAwesome, School, ContentCopy,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import NexusMark from '../components/brand/NexusMark';
import {
  glassCard, glassNavbar, glassButton,
  auroraBackground, auroraDrift, brandPillButton,
} from '../theme/glass';
import { useInView } from '../hooks/useInView';

const CONTACT_EMAIL = 'nexusslearnai@gmail.com';

/* ------------------------------------------------------------------ */
/* The four ways to support — each opens a pre-filled mailto.          */
/* ------------------------------------------------------------------ */
const WAYS = [
  {
    icon: <Favorite sx={{ fontSize: 24 }} />,
    color: '#EC4899',
    title: 'Support us',
    body: 'We are a team of students building NexusLearn in our spare time. A sponsorship — or simply spreading the word — keeps the servers running and the features shipping.',
    cta: 'Become a supporter',
    subject: 'I want to support NexusLearn',
  },
  {
    icon: <Handshake sx={{ fontSize: 24 }} />,
    color: '#6366F1',
    title: 'Acquire NexusLearn',
    body: 'Interested in taking over the platform, the codebase, and the brand? We are open to a full acquisition by the right team or company.',
    cta: 'Discuss an acquisition',
    subject: 'Acquisition inquiry — NexusLearn',
  },
  {
    icon: <ShoppingBag sx={{ fontSize: 24 }} />,
    color: '#10B981',
    title: 'Buy a license',
    body: 'Want to use NexusLearn commercially without the strings? Purchase a one-time license or a white-label build for your organisation.',
    cta: 'Buy a license',
    subject: 'License purchase — NexusLearn',
  },
  {
    icon: <IntegrationInstructions sx={{ fontSize: 24 }} />,
    color: '#F59E0B',
    title: 'Integrate into your company',
    body: 'Already have an internal stack? We can integrate NexusLearn’s knowledge assistants, retention training, and analytics into your existing tools.',
    cta: 'Plan an integration',
    subject: 'Integration request — NexusLearn',
  },
];

const mailto = (subject) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

export default function SupportPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const [waysRef, waysInView] = useInView({ threshold: 0.1 });

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the mailto link still works */
    }
  };

  return (
    <Box sx={{ overflowX: 'hidden', position: 'relative', minHeight: '100vh' }}>
      {/* Page-wide aurora background */}
      <Box
        aria-hidden
        sx={{
          ...auroraBackground(theme),
          ...auroraDrift,
          backgroundSize: '120% 120%, 120% 120%, 120% 120%, 120% 120%, 100% 100%',
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        }}
      />

      {/* Floating pill navbar — mirrors the landing page */}
      <Box sx={{
        position: 'fixed', top: { xs: 12, md: 18 },
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 100,
        width: { xs: 'calc(100% - 24px)', md: 'auto' },
        maxWidth: 1180,
        ...glassNavbar(theme),
        borderRadius: { xs: '18px', md: '999px' },
        px: { xs: 2, md: 3.5 }, py: { xs: 1, md: 1.25 },
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 2,
      }}>
        <Box
          onClick={() => navigate('/')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
        >
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <NexusMark size={20} />
          </Box>
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em" color="text.primary" fontSize="1.15rem">
            NexusLearn
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            onClick={() => navigate('/')}
            startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
            sx={{ color: 'text.secondary', fontWeight: 500, display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Home
          </Button>
          <Button
            variant="contained"
            href={mailto('Hello from NexusLearn')}
            sx={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              borderRadius: '999px', px: 3,
              boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                boxShadow: '0 8px 24px rgba(99,102,241,0.45)',
              },
            }}
          >
            Get in touch
          </Button>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* ========================================================== */}
        {/* HERO                                                        */}
        {/* ========================================================== */}
        <Box sx={{
          pt: { xs: 16, md: 20 }, pb: { xs: 6, md: 8 },
          px: { xs: 3, md: 8 },
          textAlign: 'center',
        }}>
          <Container maxWidth="md">
            <Chip
              icon={<School sx={{ fontSize: 14 }} />}
              label="Built by students"
              size="small"
              sx={{
                mb: 3, bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 600,
                border: '1px solid #C7D2FE', borderRadius: '8px',
                '& .MuiChip-icon': { color: '#4F46E5' },
              }}
            />
            <Typography variant="h2" sx={{
              fontSize: { xs: '2.1rem', sm: '3rem', md: '3.6rem' },
              fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.08,
              color: 'text.primary', mb: 3,
            }}>
              Made by students.{' '}
              <Box component="span" sx={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Kept alive by you.
              </Box>
            </Typography>
            <Typography variant="body1" sx={{
              color: 'text.secondary', fontSize: { xs: '1rem', md: '1.15rem' },
              maxWidth: 640, mx: 'auto', lineHeight: 1.65,
            }}>
              NexusLearn is an independent project built by a small team of students.
              There are a few ways you can help it grow — back us, buy it, acquire it,
              or bring it into your company. Whatever fits, we’d love to hear from you.
            </Typography>
          </Container>
        </Box>

        {/* ========================================================== */}
        {/* WAYS TO HELP — four glass cards                            */}
        {/* ========================================================== */}
        <Box ref={waysRef} sx={{ py: { xs: 3, md: 5 }, px: { xs: 3, md: 8 } }}>
          <Container maxWidth="lg">
            <Grid container spacing={3}>
              {WAYS.map((w, idx) => (
                <Grid item xs={12} sm={6} key={w.title}>
                  <Box sx={{
                    ...glassCard(theme),
                    p: { xs: 3, md: 3.5 }, borderRadius: '20px', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    opacity: waysInView ? 1 : 0,
                    transform: waysInView ? 'translateY(0)' : 'translateY(24px)',
                    transition: `opacity 0.6s ease ${idx * 90}ms, transform 0.6s ease ${idx * 90}ms, border-color 0.3s ease, box-shadow 0.35s ease`,
                    '&:hover': {
                      borderColor: `${w.color}66`,
                      boxShadow: `0 18px 44px -12px ${w.color}40`,
                    },
                  }}>
                    <Box sx={{
                      width: 52, height: 52, borderRadius: '14px',
                      bgcolor: `${w.color}15`, color: w.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mb: 2.5,
                    }}>
                      {w.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={800} color="text.primary" mb={1} letterSpacing="-0.01em">
                      {w.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.65} mb={3} sx={{ flex: 1 }}>
                      {w.body}
                    </Typography>
                    <Button
                      href={mailto(w.subject)}
                      endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                      sx={{
                        alignSelf: 'flex-start',
                        color: w.color, fontWeight: 700, px: 0,
                        '&:hover': { background: 'transparent', textDecoration: 'underline' },
                      }}
                    >
                      {w.cta}
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ========================================================== */}
        {/* CONTACT — single glass bento card                          */}
        {/* ========================================================== */}
        <Box sx={{ py: { xs: 6, md: 9 }, px: { xs: 3, md: 8 } }}>
          <Container maxWidth="md">
            <Box sx={{
              ...glassCard(theme),
              borderRadius: { xs: '24px', md: '32px' },
              p: { xs: 4, md: 7 },
              position: 'relative', overflow: 'hidden', textAlign: 'center',
            }}>
              <Box aria-hidden sx={{
                position: 'absolute', top: -180, right: -180,
                width: 420, height: 420, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.32) 0%, rgba(99,102,241,0.14) 40%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <Box aria-hidden sx={{
                position: 'absolute', bottom: -160, left: -160,
                width: 340, height: 340, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, mb: 2 }}>
                  <AutoAwesome sx={{ fontSize: 16, color: '#6366F1' }} />
                  <Typography sx={{
                    fontSize: '0.72rem', fontWeight: 700,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6366F1',
                  }}>
                    One inbox for everything
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{
                  color: 'text.primary',
                  fontSize: { xs: '1.8rem', md: '2.6rem' },
                  fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, mb: 2,
                }}>
                  Let’s talk.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{
                  mb: 4, maxWidth: 520, mx: 'auto',
                  fontSize: { xs: '0.98rem', md: '1.08rem' }, lineHeight: 1.6,
                }}>
                  Support, acquisition, licensing, integration — or just to say hi.
                  Reach the team directly at the address below.
                </Typography>

                <Box sx={{
                  display: 'flex', flexWrap: 'wrap', gap: 1.5,
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  <Button
                    variant="contained" size="large"
                    href={mailto('Hello from NexusLearn')}
                    startIcon={<Email />}
                    sx={{ ...brandPillButton, px: 4, py: 1.5, fontSize: '1rem' }}
                  >
                    {CONTACT_EMAIL}
                  </Button>
                  <Button
                    size="large"
                    onClick={copyEmail}
                    startIcon={<ContentCopy sx={{ fontSize: 18 }} />}
                    sx={{
                      ...glassButton(theme),
                      px: 3.5, py: 1.5, fontSize: '1rem',
                      borderRadius: '999px', fontWeight: 600,
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy address'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Footer */}
        <Box sx={{
          mt: { xs: 2, md: 4 }, py: { xs: 3, md: 3.5 }, px: { xs: 3, md: 8 },
          borderTop: '1px solid',
          borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.10)',
        }}>
          <Container maxWidth="lg">
            <Box sx={{
              display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center', justifyContent: 'space-between', gap: { xs: 1.5, sm: 2 },
            }}>
              <Box
                onClick={() => navigate('/')}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
              >
                <Box sx={{
                  width: 22, height: 22, borderRadius: '6px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  <NexusMark size={13} />
                </Box>
                <Typography fontWeight={700} color="text.primary" fontSize="0.85rem" letterSpacing="-0.01em">
                  NexusLearn
                </Typography>
              </Box>
              <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                &copy; {new Date().getFullYear()} NexusLearn. Built by students.
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
