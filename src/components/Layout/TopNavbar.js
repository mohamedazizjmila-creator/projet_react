import React from 'react';
import {
  AppBar, Toolbar, Typography, Box, Avatar,
  IconButton, useTheme, useMediaQuery
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import SettingsDropdown from './SettingsDropdown';

export default function TopNavbar({ onMobileMenuClick }) {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getInitials = () => {
    const email = user?.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0} 
      sx={{ 
        background: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton color="inherit" onClick={onMobileMenuClick} edge="start">
              <MenuIcon />
            </IconButton>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            padding: '4px 12px',
            borderRadius: '12px',
            background: 'rgba(163, 230, 53, 0.05)',
            border: '1px solid rgba(163, 230, 53, 0.1)',
          }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${theme.palette.divider}`,
              overflow: 'hidden',
            }}>
              <img 
                src="/assets/Logo.png" 
                alt="SOTAVI"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              SOTAVI
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            px: 1.5,
            py: 0.5,
            borderRadius: '20px',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 255, 241, 1)',
            border: `1px solid ${theme.palette.divider}`,
          }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block', lineHeight: 1 }}>
                ONLINE
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', opacity: 0.8 }}>
                {user?.email?.split('@')[0]}
              </Typography>
            </Box>
            <Avatar sx={{ 
              width: 32, height: 32, 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText',
              fontSize: '0.8rem',
              fontWeight: 800,
              boxShadow: '0 4px 10px rgba(163, 230, 53, 0.2)',
            }}>
              {getInitials()}
            </Avatar>
          </Box>

          <SettingsDropdown />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
