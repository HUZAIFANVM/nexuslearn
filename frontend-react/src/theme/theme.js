import { createTheme } from '@mui/material/styles';

const lightPalette = {
  mode: 'light',
  primary: {
    main: '#0F172A',
    light: '#1E293B',
    dark: '#020617',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    contrastText: '#ffffff',
  },
  background: {
    default: '#F8FAFC',
    paper: '#FFFFFF',
  },
  success: { main: '#10B981', light: '#D1FAE5', dark: '#059669' },
  warning: { main: '#F59E0B', light: '#FEF3C7', dark: '#D97706' },
  error: { main: '#EF4444', light: '#FEE2E2', dark: '#DC2626' },
  info: { main: '#3B82F6', light: '#DBEAFE', dark: '#2563EB' },
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    disabled: '#94A3B8',
  },
  divider: '#E2E8F0',
  grey: {
    50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1',
    400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155',
    800: '#1E293B', 900: '#0F172A',
  },
  custom: {
    blueTint: '#EFF6FF',
    purpleTint: '#F5F3FF',
    greenTint: '#ECFDF5',
    amberTint: '#FFFBEB',
    redTint: '#FEE2E2',
    subtleBg: '#F1F5F9',
    cardBorder: '#E2E8F0',
    hoverBg: '#F8FAFC',
  },
};

const darkPalette = {
  mode: 'dark',
  primary: {
    main: '#E2E8F0',
    light: '#F1F5F9',
    dark: '#CBD5E1',
    contrastText: '#0F172A',
  },
  secondary: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    contrastText: '#ffffff',
  },
  background: {
    default: '#0B0F1A',
    paper: '#111827',
  },
  success: { main: '#10B981', light: 'rgba(16,185,129,0.15)', dark: '#059669' },
  warning: { main: '#F59E0B', light: 'rgba(245,158,11,0.15)', dark: '#D97706' },
  error: { main: '#EF4444', light: 'rgba(239,68,68,0.15)', dark: '#DC2626' },
  info: { main: '#3B82F6', light: 'rgba(59,130,246,0.15)', dark: '#2563EB' },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    disabled: '#64748B',
  },
  divider: 'rgba(255,255,255,0.08)',
  grey: {
    50: '#1E293B', 100: '#1A2332', 200: 'rgba(255,255,255,0.08)', 300: 'rgba(255,255,255,0.12)',
    400: '#64748B', 500: '#94A3B8', 600: '#CBD5E1', 700: '#E2E8F0',
    800: '#F1F5F9', 900: '#F8FAFC',
  },
  custom: {
    blueTint: 'rgba(59,130,246,0.12)',
    purpleTint: 'rgba(139,92,246,0.12)',
    greenTint: 'rgba(16,185,129,0.12)',
    amberTint: 'rgba(245,158,11,0.12)',
    redTint: 'rgba(239,68,68,0.12)',
    subtleBg: 'rgba(255,255,255,0.04)',
    cardBorder: 'rgba(255,255,255,0.06)',
    hoverBg: 'rgba(255,255,255,0.04)',
  },
};

export function createAppTheme(mode) {
  const palette = mode === 'dark' ? darkPalette : lightPalette;
  const isDark = mode === 'dark';

  return createTheme({
    palette,
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 600 },
      h6: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 600 },
      subtitle1: { fontWeight: 500, color: palette.text.secondary },
      subtitle2: { fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.75rem', color: palette.text.disabled },
      body1: { lineHeight: 1.7 },
      body2: { lineHeight: 1.6 },
      button: { fontWeight: 600, letterSpacing: '0.01em' },
    },
    shape: { borderRadius: 12 },
    shadows: [
      'none',
      isDark ? '0 1px 2px 0 rgba(0,0,0,0.3)' : '0 1px 2px 0 rgba(0,0,0,0.05)',
      isDark ? '0 1px 3px 0 rgba(0,0,0,0.4)' : '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
      isDark ? '0 4px 6px -1px rgba(0,0,0,0.4)' : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
      isDark ? '0 10px 15px -3px rgba(0,0,0,0.4)' : '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
      isDark ? '0 20px 25px -5px rgba(0,0,0,0.5)' : '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
      isDark ? '0 25px 50px -12px rgba(0,0,0,0.6)' : '0 25px 50px -12px rgba(0,0,0,0.25)',
      ...Array(18).fill(isDark ? '0 25px 50px -12px rgba(0,0,0,0.6)' : '0 25px 50px -12px rgba(0,0,0,0.25)'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.25s ease, color 0.25s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 10,
            padding: '8px 20px',
          },
          contained: {
            boxShadow: isDark
              ? '0 1px 3px 0 rgba(0,0,0,0.3)'
              : '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: isDark
                ? '0 4px 6px -1px rgba(0,0,0,0.4)'
                : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
            },
          },
          containedSecondary: {
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            color: '#ffffff',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            },
          },
          outlined: isDark ? {
            borderColor: 'rgba(255,255,255,0.12)',
            '&:hover': {
              borderColor: 'rgba(255,255,255,0.24)',
              backgroundColor: 'rgba(255,255,255,0.04)',
            },
          } : {},
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
            backgroundColor: isDark ? 'rgba(17,24,39,0.55)' : 'rgba(255,255,255,0.62)',
            backgroundImage: 'none',
            backdropFilter: 'blur(22px) saturate(160%)',
            WebkitBackdropFilter: 'blur(22px) saturate(160%)',
            boxShadow: isDark
              ? '0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)'
              : '0 12px 40px -10px rgba(31,38,135,0.18), inset 0 1px 0 rgba(255,255,255,0.7)',
            transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
            '&:hover': {
              boxShadow: isDark
                ? '0 16px 50px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.05)'
                : '0 16px 50px -10px rgba(99,102,241,0.20), inset 0 1px 0 rgba(255,255,255,0.8)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: 8,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 22,
            padding: 12,
            backgroundColor: isDark ? 'rgba(17,24,39,0.78)' : 'rgba(255,255,255,0.78)',
            backgroundImage: 'none',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.6)',
            boxShadow: isDark
              ? '0 24px 80px rgba(0,0,0,0.55)'
              : '0 24px 80px -10px rgba(31,38,135,0.25)',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            height: 6,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
          },
          bar: {
            borderRadius: 10,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              '& fieldset': {
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : undefined,
              },
              '&:hover fieldset': {
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : undefined,
              },
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600,
              color: palette.text.secondary,
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
              borderBottom: `2px solid ${palette.divider}`,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: palette.divider,
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: '16px !important',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
            backgroundColor: isDark ? 'rgba(17,24,39,0.55)' : 'rgba(255,255,255,0.62)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            boxShadow: 'none',
            backgroundImage: 'none',
            '&:before': { display: 'none' },
            '&.Mui-expanded': {
              margin: '0 0 10px 0',
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: isDark ? 'rgba(17,24,39,0.82)' : 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(22px) saturate(160%)',
            WebkitBackdropFilter: 'blur(22px) saturate(160%)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)',
            boxShadow: isDark
              ? '0 16px 50px rgba(0,0,0,0.5)'
              : '0 16px 50px -10px rgba(31,38,135,0.22)',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: isDark ? 'rgba(17,24,39,0.82)' : 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(22px) saturate(160%)',
            WebkitBackdropFilter: 'blur(22px) saturate(160%)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)',
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : undefined,
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: palette.divider,
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: isDark ? 'rgba(255,255,255,0.3)' : undefined,
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          track: {
            backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : undefined,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: palette.text.secondary,
          },
        },
      },
    },
  });
}

// Keep default export for backwards compatibility during migration
const theme = createAppTheme('light');
export default theme;
