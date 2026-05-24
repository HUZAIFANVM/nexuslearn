import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import IconRail, { RAIL_WIDTH } from './IconRail';
import TopBar from './TopBar';
import SOPOfTheDayBanner from '../SOPOfTheDayBanner';
import { auroraBackground, fadeInUp } from '../../theme/glass';

/**
 * Floating-glass-island app shell.
 *  - Aurora background fixed behind everything.
 *  - <IconRail/> floats on the left (icon-only nav, hover for label).
 *  - <TopBar/> floats at the top (role chip, theme toggle, notifs, avatar).
 *  - <main> is a transparent canvas — pages render their own glass surfaces.
 */
export default function AppLayout() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* Page-wide aurora layer (fixed behind everything) */}
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

      <IconRail />
      <TopBar />

      {/* Main canvas — transparent, padded so content doesn't sit under the islands */}
      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: 1,
          ml: { xs: 0, md: `${RAIL_WIDTH + 32}px` },
          pt: { xs: 11, md: 12 },
          pb: { xs: 4, md: 6 },
          pr: { xs: 2, md: 3 },
          pl: { xs: 2, md: 3 },
          minHeight: '100vh',
          ...fadeInUp(120),
        }}
      >
        <SOPOfTheDayBanner />
        <Outlet />
      </Box>
    </Box>
  );
}
