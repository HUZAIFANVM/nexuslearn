import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Tab, Tabs, Grid, Card, CardContent, Avatar, Chip, Container,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  SmartToy, Style, Quiz, Route, KeyboardArrowDown,
  Timer, People, TrendingUp, Psychology,
  CheckCircle, ArrowForward, AutoAwesome, Shield, Speed, Insights,
  ExpandMore, HelpOutline,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { homeForRole } from '../components/auth/ProtectedRoute';
import NexusMark from '../components/brand/NexusMark';
import {
  glassCard, glassNavbar, glassButton,
  auroraBackground, auroraBackgroundSubtle,
} from '../theme/glass';

const stats = [
  { value: '94%', label: 'Knowledge Retention', icon: <Psychology /> },
  { value: '3x', label: 'Faster Onboarding', icon: <Speed /> },
  { value: '89%', label: 'Employee Satisfaction', icon: <TrendingUp /> },
  { value: '100%', label: 'AI-Powered Analytics', icon: <Insights /> },
];

const capabilities = [
  { icon: <Timer sx={{ fontSize: 28, color: '#3B82F6' }} />, title: 'Accelerate Onboarding', desc: 'Reduce ramp-up time with AI-curated learning materials and instant access to institutional knowledge.', color: '#3B82F6' },
  { icon: <People sx={{ fontSize: 28, color: '#8B5CF6' }} />, title: 'Scale Personalization', desc: 'Deliver individualized training programs to your entire workforce without increasing L&D overhead.', color: '#8B5CF6' },
  { icon: <TrendingUp sx={{ fontSize: 28, color: '#10B981' }} />, title: 'Measure Impact', desc: 'Track competency growth with real-time analytics, data-driven assessments, and actionable dashboards.', color: '#10B981' },
  { icon: <Shield sx={{ fontSize: 28, color: '#F59E0B' }} />, title: 'Ensure Compliance', desc: 'Guarantee workforce readiness with mandatory training pathways and automated competency tracking.', color: '#F59E0B' },
];

const trustedByLogos = ['Enterprise Corp', 'TechForward Inc', 'Global Solutions', 'InnovateTech', 'FutureScale'];

const faqs = [
  {
    q: 'What exactly does NexusLearn do?',
    a: 'NexusLearn is an AI-powered enterprise learning platform. HR uploads SOPs, policies, and training documents — our AI then generates four learning artifacts from each: a chat-based Knowledge Assistant (RAG over your docs), spaced-repetition Retention Training cards, Competency Evaluations, and personalized Growth Roadmaps for every employee.',
  },
  {
    q: 'How is the AI grounded in our company’s knowledge?',
    a: 'Uploaded documents are chunked, embedded with HuggingFace sentence-transformers, and stored in a per-document Pinecone namespace. When an employee asks a question, the chatbot retrieves the most relevant chunks and feeds them to Groq’s Llama 4 Scout LLM at temperature 0.2 — answers are based on your content, not on the public internet.',
  },
  {
    q: 'How does Retention Training (spaced repetition) work?',
    a: 'We use the SM-2 algorithm — the same one popularized by Anki and Duolingo. Each flashcard’s next review date is computed from your past quality ratings (0–5), so easy cards space out and difficult cards come back sooner. Mastery is measured per-card, per-employee.',
  },
  {
    q: 'What roles does the platform support?',
    a: 'Three: Super Admin (moderates HR signups), HR Administrator (uploads documents, creates assessments, manages employees), and Team Member (consumes learning materials, takes assessments, sees their Growth Roadmap). Departments scope what each Team Member sees.',
  },
  {
    q: 'Is our data secure?',
    a: 'Authentication uses JWT with bcrypt-hashed passwords; email verification is required for signup; Google OAuth is supported. Documents live in your private MongoDB GridFS, vector embeddings in your private Pinecone index. We follow SOC 2-aligned controls and are GDPR-ready. Production deployments add rate limiting, structured logging, and locked-down CORS.',
  },
  {
    q: 'How long does onboarding a new employee take?',
    a: 'Once HR has uploaded the relevant SOPs and generated their assistants, a new employee can sign up, verify their email, and start chatting / taking competency evaluations the same day. Their Growth Roadmap auto-generates from their first few assessment results.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [authTab, setAuthTab] = useState(0);

  const features = [
    {
      icon: <SmartToy sx={{ fontSize: 32 }} />,
      title: 'Knowledge Assistants',
      desc: 'AI-powered document assistants that enable employees to instantly query corporate knowledge bases using natural language.',
      color: '#3B82F6',
      bgColor: theme.palette.custom.blueTint,
    },
    {
      icon: <Style sx={{ fontSize: 32 }} />,
      title: 'Retention Training',
      desc: 'SM-2 spaced repetition algorithm delivers optimally-timed reviews that maximize long-term knowledge retention.',
      color: '#8B5CF6',
      bgColor: theme.palette.custom.purpleTint,
    },
    {
      icon: <Quiz sx={{ fontSize: 32 }} />,
      title: 'Competency Evaluations',
      desc: 'Multi-format assessments with MCQ and scenario-based questions tailored to each role and proficiency level.',
      color: '#10B981',
      bgColor: theme.palette.custom.greenTint,
    },
    {
      icon: <Route sx={{ fontSize: 32 }} />,
      title: 'Growth Roadmaps',
      desc: 'AI-generated personalized development paths that dynamically adapt to individual progress and skill gaps.',
      color: '#F59E0B',
      bgColor: theme.palette.custom.amberTint,
    },
  ];

  if (user) {
    return <Navigate to={homeForRole(user.role)} />;
  }

  return (
    <Box sx={{ overflowX: 'hidden', position: 'relative', minHeight: '100vh' }}>
      {/* Page-wide aurora background — fixed behind everything */}
      <Box
        aria-hidden
        sx={{
          ...auroraBackground(theme),
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
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

      {/* All page content — sits above the fixed aurora layer */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>

      {/* Hero Section */}
      <Box sx={{
        position: 'relative',
        minHeight: '100vh', pt: 14,
        display: 'flex', alignItems: 'center',
        px: { xs: 3, md: 8 }, pb: { xs: 10, md: 12 },
        flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 4, md: 6 },
      }}>
        {/* Left Side */}
        <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 55%' }, textAlign: { xs: 'center', md: 'left' } }}>
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
          <Typography variant="h2" sx={{
            fontSize: { xs: '2.2rem', md: '3.2rem' },
            lineHeight: 1.15, mb: 2.5, color: 'text.primary',
          }}>
            Transform Workforce{' '}
            <Box component="span" sx={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Development
            </Box>{' '}
            with Intelligent AI
          </Typography>
          <Typography variant="body1" sx={{
            color: 'text.secondary', mb: 4, fontSize: '1.1rem', maxWidth: 520, lineHeight: 1.7,
            mx: { xs: 'auto', md: 0 },
          }}>
            NexusLearn combines adaptive assessments, spaced repetition, and personalized growth roadmaps to deliver measurable upskilling at enterprise scale.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' }, mb: 4 }}>
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
              Start Free Trial
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
              Explore Features
            </Button>
          </Box>
          {/* Trust indicators */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: 'wrap' }}>
            {[
              'SOC 2 Compliant',
              'Enterprise-Grade Security',
              'GDPR Ready',
            ].map((text) => (
              <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
                <Typography variant="body2" color="text.secondary" fontSize="0.8rem">{text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right Side — Auth Card */}
        <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 40%' }, width: '100%', maxWidth: 440 }}>
          <Box sx={{
            ...glassCard(theme),
            borderRadius: '24px',
            p: { xs: 2.5, md: 3 },
          }}>
            <Tabs
              value={authTab} onChange={(_, v) => setAuthTab(v)} centered
              sx={{
                mb: 2,
                '& .MuiTab-root': {
                  color: 'text.disabled', fontWeight: 600, fontSize: '0.95rem',
                  textTransform: 'none', minHeight: 44,
                },
                '& .Mui-selected': { color: 'text.primary' },
                '& .MuiTabs-indicator': {
                  height: 3, borderRadius: 2,
                  background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                },
              }}
            >
              <Tab label="Sign In" />
              <Tab label="Create Account" />
            </Tabs>
            {authTab === 0 ? <LoginForm embedded /> : <SignupForm embedded />}
          </Box>
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
            bottom: { xs: 20, md: 32 },
            left: '50%',
            transform: 'translateX(-50%)',
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            color: 'text.secondary',
            opacity: 0.7,
            transition: 'opacity 0.2s ease, color 0.2s ease',
            outline: 'none',
            '&:hover, &:focus-visible': {
              opacity: 1,
              color: '#3B82F6',
            },
            '@keyframes nl-scroll-bounce': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(6px)' },
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: 'inherit',
            }}
          >
            Discover More
          </Typography>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid currentColor',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'nl-scroll-bounce 1.8s ease-in-out infinite',
              backdropFilter: 'blur(4px)',
            }}
          >
            <KeyboardArrowDown sx={{ fontSize: 22 }} />
          </Box>
        </Box>
      </Box>

      {/* Stats bar */}
      <Box sx={{
        py: 4, px: { xs: 3, md: 8 },
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      }}>
        <Grid container spacing={3} justifyContent="center">
          {stats.map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Box sx={{ textAlign: 'center', color: '#fff' }}>
                <Typography variant="h3" fontWeight={800} sx={{
                  background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}>
                  {s.value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {s.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{
        py: { xs: 5, md: 7 }, px: { xs: 3, md: 8 },
        ...auroraBackgroundSubtle(theme),
      }}>
        <Box textAlign="center" mb={5}>
          <Chip label="PLATFORM CAPABILITIES" size="small" sx={{
            mb: 2, bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 700,
            letterSpacing: '0.05em', fontSize: '0.7rem', borderRadius: '6px',
          }} />
          <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 2, color: 'text.primary' }}>
            Intelligent Features That Drive Results
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={600} mx="auto" fontSize="1.05rem">
            Four AI-powered pillars designed to transform how your organization approaches learning and professional development.
          </Typography>
        </Box>
        <Grid container spacing={3} justifyContent="center">
          {features.map((f) => (
            <Grid item xs={12} sm={6} md={3} key={f.title}>
              <Card sx={{
                ...glassCard(theme),
                height: '100%', textAlign: 'center', p: 0.5,
                borderRadius: '20px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: `0 20px 50px -15px ${f.color}30`,
                  borderColor: `${f.color}55`,
                },
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{
                    width: 52, height: 52, borderRadius: '14px',
                    bgcolor: f.bgColor, color: f.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mx: 'auto', mb: 2.5,
                  }}>
                    {f.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} mb={1.5} fontSize="1rem" color="text.primary">
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                    {f.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Capabilities Section — sits on the page-level aurora (transparent) */}
      <Box sx={{ py: { xs: 5, md: 7 }, px: { xs: 3, md: 8 } }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={5}>
            <Chip label="WHY NEXUSLEARN" size="small" sx={{
              mb: 2, bgcolor: theme.palette.custom.greenTint, color: '#059669', fontWeight: 700,
              letterSpacing: '0.05em', fontSize: '0.7rem', borderRadius: '6px',
            }} />
            <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' }, mb: 2, color: 'text.primary' }}>
              Enterprise-Grade Learning Infrastructure
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3} lineHeight={1.7}>
              Built for organizations that demand measurable outcomes from their learning and development investments. NexusLearn delivers quantifiable results across every metric that matters.
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
              Request Demo
            </Button>
          </Grid>
          <Grid item xs={12} md={7}>
            <Grid container spacing={2.5}>
              {capabilities.map((c) => (
                <Grid item xs={12} sm={6} key={c.title}>
                  <Box sx={{
                    ...glassCard(theme),
                    p: 3, borderRadius: '18px', height: '100%',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      borderColor: `${c.color}66`,
                      boxShadow: `0 12px 32px -8px ${c.color}30`,
                    },
                  }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '12px',
                      bgcolor: `${c.color}10`, color: c.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mb: 2,
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
      </Box>

      {/* FAQ Section */}
      <Box id="faq" sx={{
        py: { xs: 5, md: 7 }, px: { xs: 3, md: 8 },
        ...auroraBackgroundSubtle(theme),
      }}>
        <Box textAlign="center" mb={4}>
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
          <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' }, mb: 1.5, color: 'text.primary' }}>
            Frequently Asked Questions
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={600} mx="auto" fontSize="1.02rem">
            Everything teams typically ask before rolling out NexusLearn across their organization.
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 820, mx: 'auto' }}>
          {faqs.map((item, idx) => (
            <Accordion
              key={idx}
              disableGutters
              elevation={0}
              square={false}
              sx={{
                ...glassCard(theme),
                borderRadius: '16px !important',
                mb: 1.5,
                overflow: 'hidden',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
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

      {/* CTA Section */}
      <Box sx={{
        py: { xs: 5, md: 7 }, px: { xs: 3, md: 8 },
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative elements */}
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
            color: '#fff', mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' },
          }}>
            Ready to Transform Your{' '}
            <Box component="span" sx={{
              background: 'linear-gradient(90deg, #60A5FA 0%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Learning Culture
            </Box>
            ?
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', mb: 4, maxWidth: 550, mx: 'auto', fontSize: '1.05rem' }}>
            Join forward-thinking enterprises that use NexusLearn to build high-performing, continuously learning organizations.
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
              Start Building Today
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
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
              Sign In
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
      {/* /content wrapper */}
    </Box>
  );
}
