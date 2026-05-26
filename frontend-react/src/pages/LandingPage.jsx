import { useRef, useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip, Container,
  Accordion, AccordionSummary, AccordionDetails, useMediaQuery,
} from '@mui/material';
import {
  SmartToy, Style, Quiz, Route, KeyboardArrowDown,
  Timer, People, TrendingUp, Psychology,
  CheckCircle, ArrowForward, AutoAwesome, Shield, Speed, Insights,
  ExpandMore, HelpOutline, AdminPanelSettings, Badge as BadgeIcon, Person,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { homeForRole } from '../components/auth/ProtectedRoute';
import NexusMark from '../components/brand/NexusMark';
import AnimatedHeading from '../components/landing/AnimatedHeading';
import HeroChatPreview from '../components/landing/HeroChatPreview';
import {
  KnowledgeAssistantMock, RetentionTrainingMock,
  CompetencyEvaluationMock, GrowthRoadmapMock,
} from '../components/landing/FeatureMocks';
import {
  glassCard, glassNavbar, glassButton,
  auroraBackground, auroraBackgroundSubtle, auroraDrift,
  revealOnScroll,
} from '../theme/glass';
import { useInView, useCountUp } from '../hooks/useInView';

/* ------------------------------------------------------------------ */
/* Stats — product capability claims, not faked customer outcomes      */
/* ------------------------------------------------------------------ */
const stats = [
  { value: '0%',  label: 'Hallucinated answers',  icon: <Shield /> },
  { value: '3x',  label: 'Faster onboarding',     icon: <Speed /> },
  { value: '4',   label: 'AI artifacts per doc',  icon: <AutoAwesome /> },
  { value: '24/7', label: 'Available to your team', icon: <Insights /> },
];

const parseStat = (raw) => {
  const m = String(raw).match(/^(\d+(?:\.\d+)?)(.*)$/);
  return m ? { num: parseFloat(m[1]), suffix: m[2] } : { num: 0, suffix: '' };
};

function AnimatedStat({ raw, label, start }) {
  const parsed = parseStat(raw);
  const value = useCountUp(parsed.num, { duration: 1600, start });
  const display = Number.isInteger(parsed.num) ? Math.round(value) : value.toFixed(1);
  return (
    <Box sx={{ textAlign: 'center', color: '#fff' }}>
      <Typography variant="h3" fontWeight={800} sx={{
        background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        mb: 0.5, fontVariantNumeric: 'tabular-nums',
      }}>
        {display}{parsed.suffix}
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>{label}</Typography>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Persona cards — Built for HR / Team Members / Super Admins         */
/* ------------------------------------------------------------------ */
const personas = [
  {
    role: 'Super Admin',
    icon: <AdminPanelSettings sx={{ fontSize: 24 }} />,
    color: '#6366F1',
    blurb: 'Bring your HR team on board and own access at the org level.',
    bullets: [
      'Approve HR signups with full audit trail',
      'Suspend, reinstate, or remove users at any time',
      'Org-wide visibility into who knows what',
    ],
  },
  {
    role: 'HR / L&D',
    icon: <BadgeIcon sx={{ fontSize: 24 }} />,
    color: '#3B82F6',
    blurb: 'Upload your docs, generate the AI artifacts, manage your people.',
    bullets: [
      'One upload → assistant + cards + tests + roadmaps',
      'Build assessments with optional time limits',
      'See competency growth per employee, per department',
    ],
  },
  {
    role: 'Team Members',
    icon: <Person sx={{ fontSize: 24 }} />,
    color: '#10B981',
    blurb: 'Ask, learn, get tested, and see what to study next.',
    bullets: [
      'Chat with company knowledge in plain English',
      'Review SM-2 spaced cards when they are due',
      'Follow a roadmap that adapts as you grow',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Capabilities — outcomes-flavoured tiles                            */
/* ------------------------------------------------------------------ */
const capabilities = [
  { icon: <Timer sx={{ fontSize: 28, color: '#3B82F6' }} />, title: 'Accelerate Onboarding', desc: 'New hires get instant access to institutional knowledge instead of hunting through Drive.', color: '#3B82F6' },
  { icon: <People sx={{ fontSize: 28, color: '#8B5CF6' }} />, title: 'Scale Personalization', desc: 'Every employee gets their own roadmap without growing your L&D headcount.', color: '#8B5CF6' },
  { icon: <TrendingUp sx={{ fontSize: 28, color: '#10B981' }} />, title: 'Measure Impact', desc: 'See who knows what across departments — and where the knowledge gaps actually are.', color: '#10B981' },
  { icon: <Shield sx={{ fontSize: 28, color: '#F59E0B' }} />, title: 'Ensure Compliance', desc: 'Mandatory tracks plus auto-graded competency tests keep workforce readiness audit-ready.', color: '#F59E0B' },
];

/* ------------------------------------------------------------------ */
/* FAQ — tightened copy                                                */
/* ------------------------------------------------------------------ */
const faqs = [
  {
    q: 'What exactly does NexusLearn do?',
    a: 'You upload a document — an SOP, a policy, a piece of training material. NexusLearn turns it into four things: a Knowledge Assistant your team can chat with, Retention Training cards on a spaced-repetition schedule, Competency Evaluations to test what they know, and a Growth Roadmap that adapts to each person.',
  },
  {
    q: 'Will the AI make things up?',
    a: 'No. The Knowledge Assistant retrieves the most relevant chunks from your document (vector search via Pinecone) and feeds them to Groq\'s Llama 4 Scout at temperature 0.2. Answers come from your content, with a source citation — not from the public internet.',
  },
  {
    q: 'How does Retention Training (spaced repetition) work?',
    a: 'We use the SM-2 algorithm — the same one behind Anki and Duolingo. Each card\'s next review is computed from your past quality ratings, so easy cards space out and tricky ones come back sooner. Mastery is measured per-card, per-employee.',
  },
  {
    q: 'What roles does the platform support?',
    a: 'Three: Super Admin (moderates HR signups, controls org access), HR / L&D Administrator (uploads docs, creates assistants and assessments, manages employees), and Team Member (consumes learning, takes assessments, follows their roadmap). Departments scope what each Team Member sees.',
  },
  {
    q: 'Is our data secure?',
    a: 'JWT auth with bcrypt-hashed passwords, mandatory email verification, optional Google OAuth. Documents stored in your private MongoDB GridFS; embeddings in your private Pinecone index. SOC 2-aligned controls, GDPR-ready, with rate limiting, structured logging, and locked-down CORS in production.',
  },
  {
    q: 'How fast can a new employee start using it?',
    a: 'Once HR has uploaded the relevant docs, a new employee signs up, verifies their email, and starts chatting or taking competency tests the same day. Their personalized roadmap auto-generates from their first few assessment results.',
  },
];

/* ------------------------------------------------------------------ */
/* Feature rows — alternating left/right                               */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    chip: 'Knowledge Assistants',
    chipColor: '#3B82F6',
    icon: <SmartToy sx={{ fontSize: 20 }} />,
    heading: ['Every document becomes', 'a real-time expert.'],
    body: 'Upload a PDF — within seconds, your team can ask it questions in plain English and get answers cited from the actual document. Grounded in your content, never from the public internet.',
    Mock: KnowledgeAssistantMock,
    mockLeft: false,
  },
  {
    chip: 'Retention Training',
    chipColor: '#8B5CF6',
    icon: <Style sx={{ fontSize: 20 }} />,
    heading: ['Most training is forgotten.', 'Ours is not.'],
    body: 'NexusLearn schedules every card review using the SM-2 algorithm — the same science behind Anki and Duolingo. The right material comes back at the right time, so knowledge sticks instead of leaks.',
    Mock: RetentionTrainingMock,
    mockLeft: true,
  },
  {
    chip: 'Competency Evaluations',
    chipColor: '#10B981',
    icon: <Quiz sx={{ fontSize: 20 }} />,
    heading: ['Prove they actually', 'know it.'],
    body: 'AI generates assessments straight from your documents — multiple choice, scenario-based, optionally timed. Auto-graded with attempt-level analytics on where your team is strong and where they need work.',
    Mock: CompetencyEvaluationMock,
    mockLeft: false,
  },
  {
    chip: 'Growth Roadmaps',
    chipColor: '#F59E0B',
    icon: <Route sx={{ fontSize: 20 }} />,
    heading: ['A personalized plan', 'for every employee.'],
    body: 'After a few assessments, NexusLearn builds each team member a development roadmap — what to study next, when to review, what they are ready to be tested on. It re-adapts every time they finish a step.',
    Mock: GrowthRoadmapMock,
    mockLeft: true,
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // Narrow phones need a shorter headline — the wipe bars require whiteSpace: nowrap
  // per line, so we swap to shorter copy below the `sm` breakpoint to avoid overflow.
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const headlineLines = isPhone
    ? ['Train your team', 'on what you know.']
    : ['Train your team on what', 'your company already knows.'];

  const [statsRef, statsInView] = useInView({ threshold: 0.3 });
  const [personasRef, personasInView] = useInView({ threshold: 0.2 });
  const [capabilitiesRef, capabilitiesInView] = useInView({ threshold: 0.15 });
  const [faqRef, faqInView] = useInView({ threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ threshold: 0.2 });

  // Mouse-follow spotlight in the hero — soft glow that tracks the cursor.
  const heroRef = useRef(null);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 35 });
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return undefined;
    const handler = (e) => {
      const rect = el.getBoundingClientRect();
      setSpotlight({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    el.addEventListener('mousemove', handler);
    return () => el.removeEventListener('mousemove', handler);
  }, []);

  if (user) return <Navigate to={homeForRole(user.role)} />;

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

      {/* Floating pill navbar */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={() => navigate('/login')} sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Sign In
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/signup')}
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
            Get Started
          </Button>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1 }}>

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <Box ref={heroRef} sx={{
        position: 'relative',
        minHeight: '100vh', pt: { xs: 14, md: 16 },
        display: 'flex', alignItems: 'center',
        px: { xs: 3, md: 8 }, pb: { xs: 10, md: 12 },
        flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 6, md: 6 },
        overflow: 'hidden',
      }}>
        {/* Mouse-follow spotlight */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute', inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle 420px at ${spotlight.x}% ${spotlight.y}%, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0.08) 40%, transparent 70%)`,
            transition: 'background 0.4s ease',
            zIndex: 0,
            display: { xs: 'none', md: 'block' },
          }}
        />

        {/* Left: copy + CTAs */}
        <Box sx={{
          flex: { xs: '1 1 auto', md: '0 0 55%' },
          textAlign: { xs: 'center', md: 'left' },
          position: 'relative', zIndex: 1,
        }}>
          <Chip
            icon={<AutoAwesome sx={{ fontSize: 14 }} />}
            label="AI-Powered Enterprise Learning"
            size="small"
            sx={{
              mb: 3, bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 600,
              border: '1px solid #C7D2FE', borderRadius: '8px',
              '& .MuiChip-icon': { color: '#4F46E5' },
            }}
          />
          {/* Animated wipe-reveal headline */}
          <AnimatedHeading
            lines={headlineLines}
            delay={600}
            staggerMs={140}
            sx={{
              fontSize: { xs: '1.85rem', sm: '2.6rem', md: '3.6rem' },
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.08,
              mb: 3,
              color: 'text.primary',
              '& > span > span': { fontFamily: 'inherit' },
            }}
          />
          <Typography variant="body1" sx={{
            color: 'text.secondary', mb: 4, fontSize: { xs: '1rem', md: '1.1rem' },
            maxWidth: 540, lineHeight: 1.7,
            mx: { xs: 'auto', md: 0 },
          }}>
            Upload your SOPs, policies, and training materials. NexusLearn instantly turns each one into a Knowledge Assistant, Retention Training cards, Competency Evaluations, and a Growth Roadmap — for every employee on your team.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' }, mb: 4, flexWrap: 'wrap' }}>
            <Button
              variant="contained" size="large"
              onClick={() => navigate('/signup')}
              endIcon={<ArrowForward />}
              sx={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                px: 4, py: 1.5, fontSize: '1rem', borderRadius: '999px',
                boxShadow: '0 10px 30px rgba(99,102,241,0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                  boxShadow: '0 14px 40px rgba(99,102,241,0.5)',
                },
              }}
            >
              Start free trial
            </Button>
            <Button
              size="large"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              sx={{
                ...glassButton(theme),
                px: 4, py: 1.5, fontSize: '1rem', borderRadius: '999px',
                fontWeight: 600,
              }}
            >
              See how it works
            </Button>
          </Box>
          {/* Trust pills */}
          <Box sx={{
            display: 'flex', gap: 3, alignItems: 'center',
            justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: 'wrap',
          }}>
            {['SOC 2 aligned', 'GDPR ready', 'Source-cited answers'].map((text) => (
              <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
                <Typography variant="body2" color="text.secondary" fontSize="0.8rem">{text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right: live chat preview */}
        <Box sx={{
          flex: { xs: '1 1 auto', md: '0 0 40%' },
          width: '100%', maxWidth: 500,
          position: 'relative', zIndex: 1,
        }}>
          <HeroChatPreview />
        </Box>

        {/* Scroll-down indicator */}
        <Box
          onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          aria-label="Scroll to features"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          sx={{
            position: 'absolute',
            bottom: { xs: 20, md: 28 },
            left: '50%', transform: 'translateX(-50%)',
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column', alignItems: 'center', gap: 0.75,
            cursor: 'pointer',
            color: 'text.secondary',
            opacity: 0.7,
            transition: 'opacity 0.2s ease, color 0.2s ease',
            outline: 'none',
            '&:hover, &:focus-visible': { opacity: 1, color: '#3B82F6' },
            '@keyframes nl-scroll-bounce': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(6px)' },
            },
          }}
        >
          <Typography variant="caption" sx={{
            fontSize: '0.7rem', letterSpacing: '0.18em',
            textTransform: 'uppercase', fontWeight: 600, color: 'inherit',
          }}>
            Discover More
          </Typography>
          <Box sx={{
            width: 36, height: 36, borderRadius: '50%',
            border: '1.5px solid currentColor',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'nl-scroll-bounce 1.8s ease-in-out infinite',
            backdropFilter: 'blur(4px)',
          }}>
            <KeyboardArrowDown sx={{ fontSize: 22 }} />
          </Box>
        </Box>
      </Box>

      {/* ============================================================ */}
      {/* STATS BAR                                                     */}
      {/* ============================================================ */}
      <Box ref={statsRef} sx={{
        py: 4, px: { xs: 3, md: 8 },
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <Box aria-hidden sx={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <Grid container spacing={3} justifyContent="center" sx={{ position: 'relative' }}>
          {stats.map((s, idx) => (
            <Grid item xs={6} md={3} key={s.label} sx={{ ...revealOnScroll(statsInView, idx * 100) }}>
              <AnimatedStat raw={s.value} label={s.label} start={statsInView} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ============================================================ */}
      {/* FEATURES — alternating rows                                   */}
      {/* ============================================================ */}
      <Box id="features" sx={{
        py: { xs: 7, md: 10 }, px: { xs: 3, md: 8 },
        ...auroraBackgroundSubtle(theme),
      }}>
        <Box textAlign="center" mb={{ xs: 6, md: 8 }} sx={{ maxWidth: 720, mx: 'auto' }}>
          <Chip label="HOW IT WORKS" size="small" sx={{
            mb: 2, bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 700,
            letterSpacing: '0.05em', fontSize: '0.7rem', borderRadius: '6px',
          }} />
          <Typography variant="h3" sx={{
            fontSize: { xs: '1.9rem', md: '2.6rem' }, mb: 2,
            color: 'text.primary', letterSpacing: '-0.02em',
          }}>
            One upload. Four AI artifacts.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
            Drop a document into NexusLearn. We turn it into the four things your team actually needs to learn from it.
          </Typography>
        </Box>

        <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 8, md: 12 } }}>
          {FEATURES.map((f, idx) => (
            <FeatureRow key={f.chip} {...f} index={idx} />
          ))}
        </Container>
      </Box>

      {/* ============================================================ */}
      {/* BUILT FOR — persona cards                                     */}
      {/* ============================================================ */}
      <Box ref={personasRef} sx={{ py: { xs: 7, md: 10 }, px: { xs: 3, md: 8 } }}>
        <Box textAlign="center" mb={{ xs: 5, md: 7 }} sx={{ maxWidth: 720, mx: 'auto' }}>
          <Chip label="BUILT FOR" size="small" sx={{
            mb: 2, bgcolor: theme.palette.custom.purpleTint, color: '#7C3AED', fontWeight: 700,
            letterSpacing: '0.05em', fontSize: '0.7rem', borderRadius: '6px',
          }} />
          <Typography variant="h3" sx={{
            fontSize: { xs: '1.9rem', md: '2.6rem' }, mb: 2,
            color: 'text.primary', letterSpacing: '-0.02em',
          }}>
            Built for the people who run learning.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
            Three roles, each with a workspace shaped around what they actually do.
          </Typography>
        </Box>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {personas.map((p, idx) => (
              <Grid item xs={12} md={4} key={p.role} sx={{ ...revealOnScroll(personasInView, idx * 120) }}>
                <Box sx={{
                  ...glassCard(theme),
                  p: { xs: 3, md: 3.5 }, borderRadius: '20px',
                  height: '100%',
                  display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.35s cubic-bezier(0.34,1.4,0.64,1), border-color 0.3s ease, box-shadow 0.35s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: `${p.color}55`,
                    boxShadow: `0 24px 60px -18px ${p.color}40`,
                  },
                  '&:hover .nl-persona-icon': {
                    transform: 'scale(1.08) rotate(-4deg)',
                  },
                }}>
                  <Box className="nl-persona-icon" sx={{
                    width: 52, height: 52, borderRadius: '14px',
                    background: `linear-gradient(135deg, ${p.color} 0%, ${p.color}AA 100%)`,
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mb: 2.5,
                    boxShadow: `0 10px 24px ${p.color}55`,
                    transition: 'transform 0.45s cubic-bezier(0.34,1.6,0.64,1)',
                  }}>
                    {p.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="text.primary" mb={1} fontSize="1.15rem">
                    {p.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                    {p.blurb}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 'auto', pt: 1 }}>
                    {p.bullets.map((b) => (
                      <Box key={b} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <CheckCircle sx={{ fontSize: 16, color: p.color, mt: '2px', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                          {b}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ============================================================ */}
      {/* CAPABILITIES                                                  */}
      {/* ============================================================ */}
      <Box ref={capabilitiesRef} sx={{
        py: { xs: 7, md: 9 }, px: { xs: 3, md: 8 },
        ...auroraBackgroundSubtle(theme),
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5}>
              <Chip label="WHY NEXUSLEARN" size="small" sx={{
                mb: 2, bgcolor: theme.palette.custom.greenTint, color: '#059669', fontWeight: 700,
                letterSpacing: '0.05em', fontSize: '0.7rem', borderRadius: '6px',
              }} />
              <Typography variant="h3" sx={{
                fontSize: { xs: '1.8rem', md: '2.3rem' }, mb: 2,
                color: 'text.primary', letterSpacing: '-0.02em',
              }}>
                Outcomes you can actually point to.
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3} lineHeight={1.7}>
                Built for teams that need their training investment to show up in real numbers — faster ramp-up, higher retention, fewer audit findings, less time spent in 1:1 onboarding.
              </Typography>
              <Button
                variant="contained" endIcon={<ArrowForward />}
                onClick={() => navigate('/signup')}
                sx={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  px: 4, py: 1.5, borderRadius: '999px',
                  boxShadow: '0 10px 30px rgba(99,102,241,0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                    boxShadow: '0 14px 40px rgba(99,102,241,0.5)',
                  },
                }}
              >
                Request demo
              </Button>
            </Grid>
            <Grid item xs={12} md={7}>
              <Grid container spacing={2.5}>
                {capabilities.map((c, idx) => (
                  <Grid item xs={12} sm={6} key={c.title} sx={{ ...revealOnScroll(capabilitiesInView, 200 + idx * 100) }}>
                    <Box sx={{
                      ...glassCard(theme),
                      p: 3, borderRadius: '18px', height: '100%',
                      transition: 'transform 0.35s cubic-bezier(0.34,1.4,0.64,1), border-color 0.3s ease, box-shadow 0.35s ease',
                      '&:hover': {
                        transform: 'translateY(-5px) scale(1.012)',
                        borderColor: `${c.color}66`,
                        boxShadow: `0 18px 40px -10px ${c.color}38`,
                      },
                      '&:hover .nl-cap-icon': {
                        transform: 'rotate(-6deg) scale(1.1)',
                        background: `linear-gradient(135deg, ${c.color}25 0%, ${c.color}45 100%)`,
                      },
                    }}>
                      <Box className="nl-cap-icon" sx={{
                        width: 48, height: 48, borderRadius: '12px',
                        bgcolor: `${c.color}10`, color: c.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mb: 2,
                        transition: 'transform 0.45s cubic-bezier(0.34,1.6,0.64,1), background 0.35s ease',
                      }}>
                        {c.icon}
                      </Box>
                      <Typography fontWeight={700} mb={1} color="text.primary" fontSize="0.95rem">
                        {c.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                        {c.desc}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============================================================ */}
      {/* FAQ                                                            */}
      {/* ============================================================ */}
      <Box id="faq" ref={faqRef} sx={{
        py: { xs: 7, md: 9 }, px: { xs: 3, md: 8 },
        ...revealOnScroll(faqInView, 0),
      }}>
        <Box textAlign="center" mb={5}>
          <Chip
            icon={<HelpOutline sx={{ fontSize: 14 }} />}
            label="FREQUENTLY ASKED"
            size="small"
            sx={{
              mb: 2, bgcolor: theme.palette.custom.purpleTint, color: '#7C3AED', fontWeight: 700,
              letterSpacing: '0.05em', fontSize: '0.7rem', borderRadius: '6px',
              '& .MuiChip-icon': { color: '#7C3AED' },
            }}
          />
          <Typography variant="h3" sx={{
            fontSize: { xs: '1.9rem', md: '2.5rem' }, mb: 1.5,
            color: 'text.primary', letterSpacing: '-0.02em',
          }}>
            Frequently Asked Questions
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={600} mx="auto" fontSize="1.02rem">
            Everything teams typically ask before rolling out NexusLearn.
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 820, mx: 'auto' }}>
          {faqs.map((item, idx) => (
            <Accordion
              key={idx}
              disableGutters elevation={0} square={false}
              sx={{
                ...glassCard(theme),
                borderRadius: '16px !important', mb: 1.5, overflow: 'hidden',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  borderColor: 'rgba(139,92,246,0.55)',
                  boxShadow: '0 12px 36px -10px rgba(99,102,241,0.30)',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: 'text.secondary' }} />}
                sx={{
                  px: { xs: 2, md: 3 }, py: 0.5,
                  '& .MuiAccordionSummary-content': { my: 1.75 },
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Typography fontWeight={600} fontSize="1rem" color="text.primary">
                  {item.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pt: 0, pb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" lineHeight={1.75}>
                  {item.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box textAlign="center" mt={4}>
          <Typography variant="body2" color="text.secondary">
            Still have questions?{' '}
            <Box
              component="span"
              onClick={() => navigate('/signup')}
              sx={{
                color: '#3B82F6', fontWeight: 600, cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Start a free trial
            </Box>{' '}
            and explore the platform yourself.
          </Typography>
        </Box>
      </Box>

      {/* ============================================================ */}
      {/* CTA                                                            */}
      {/* ============================================================ */}
      <Box ref={ctaRef} sx={{
        py: { xs: 7, md: 9 }, px: { xs: 3, md: 8 },
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
        ...revealOnScroll(ctaInView, 0),
      }}>
        <Box sx={{
          position: 'absolute', top: -100, right: -100,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -80, left: -80,
          width: 250, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        }} />

        <Box position="relative" zIndex={1}>
          <Typography variant="h3" sx={{
            color: '#fff', mb: 2,
            fontSize: { xs: '1.9rem', md: '2.6rem' },
            letterSpacing: '-0.02em',
          }}>
            Ready to make your knowledge{' '}
            <Box component="span" sx={{
              background: 'linear-gradient(90deg, #60A5FA 0%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              stick
            </Box>
            ?
          </Typography>
          <Typography variant="body1" sx={{
            color: 'rgba(255,255,255,0.6)', mb: 4,
            maxWidth: 560, mx: 'auto', fontSize: '1.05rem',
          }}>
            Start free. Set up your first Knowledge Assistant in 10 minutes. No credit card needed.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained" size="large"
              onClick={() => navigate('/signup')}
              endIcon={<ArrowForward />}
              sx={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                px: 5, py: 1.5, fontSize: '1rem', borderRadius: '999px',
                boxShadow: '0 10px 30px rgba(99,102,241,0.45)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                  boxShadow: '0 14px 40px rgba(99,102,241,0.55)',
                },
              }}
            >
              Start free trial
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff', fontWeight: 600,
                px: 5, py: 1.5, fontSize: '1rem', borderRadius: '999px',
                transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  background: 'rgba(255,255,255,0.12)',
                  borderColor: 'rgba(255,255,255,0.32)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 8px 24px rgba(99,102,241,0.30)',
                },
              }}
            >
              Sign in
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, px: { xs: 3, md: 8 }, bgcolor: '#0F172A', textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
          <Box sx={{
            width: 28, height: 28, borderRadius: '8px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <NexusMark size={16} />
          </Box>
          <Typography fontWeight={700} color="#fff" fontSize="0.95rem">NexusLearn</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
          &copy; {new Date().getFullYear()} NexusLearn. AI-Powered Enterprise Learning Platform.
        </Typography>
      </Box>

      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* FeatureRow — one alternating section per AI artifact                */
/* ------------------------------------------------------------------ */
function FeatureRow({ chip, chipColor, icon, heading, body, Mock, mockLeft, index }) {
  const theme = useTheme();
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <Grid
      container
      spacing={{ xs: 4, md: 8 }}
      alignItems="center"
      direction={{ xs: 'column-reverse', md: mockLeft ? 'row-reverse' : 'row' }}
      ref={ref}
    >
      <Grid item xs={12} md={6} sx={{ ...revealOnScroll(inView, 0) }}>
        <Chip
          icon={icon}
          label={chip}
          size="small"
          sx={{
            mb: 2.5, fontWeight: 700, fontSize: '0.75rem',
            letterSpacing: '0.04em',
            bgcolor: `${chipColor}15`, color: chipColor,
            border: '1px solid', borderColor: `${chipColor}30`,
            borderRadius: '8px', py: 1.5,
            '& .MuiChip-icon': { color: chipColor },
          }}
        />
        <Typography variant="h3" sx={{
          fontSize: { xs: '1.7rem', md: '2.3rem' },
          fontWeight: 800, letterSpacing: '-0.02em',
          color: 'text.primary', mb: 2, lineHeight: 1.15,
        }}>
          {heading[0]}<br />
          <Box component="span" sx={{
            background: `linear-gradient(135deg, ${chipColor} 0%, ${chipColor}CC 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {heading[1]}
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.02rem', lineHeight: 1.7, maxWidth: 500 }}>
          {body}
        </Typography>
      </Grid>
      <Grid item xs={12} md={6} sx={{ ...revealOnScroll(inView, 150) }}>
        <Box sx={{
          maxWidth: 460,
          mx: { xs: 'auto', md: mockLeft ? 0 : 'auto' },
          ml: { md: mockLeft ? 0 : 'auto' },
          transform: 'perspective(1200px) rotateY(0deg)',
          transition: 'transform 0.5s ease',
          '&:hover': {
            transform: { md: `perspective(1200px) rotateY(${mockLeft ? '4deg' : '-4deg'})` },
          },
        }}>
          <Mock theme={theme} />
        </Box>
      </Grid>
    </Grid>
  );
}
