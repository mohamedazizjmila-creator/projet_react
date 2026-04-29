import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Box, Divider, useTheme, useMediaQuery, IconButton
} from '@mui/material';
import {
  Dashboard, Home, Agriculture, ProductionQuantityLimits,
  MedicalServices, Inventory, People, Logout, AddTask, 
  ChevronLeft, ChevronRight
} from '@mui/icons-material';
import TopNavbar from './TopNavbar';

const drawerWidth = 260;
const collapsedDrawerWidth = 80;

const roleConfig = {
  admin:       { label: 'Administrateur',       color: '#a3e635', dot: 'dot-success' },
  responsable: { label: "Resp. d'élevage",      color: '#3b82f6', dot: 'dot-warning' },
  technicien:  { label: 'Technicien',           color: '#fbbf24', dot: 'dot-warning' },
  veterinaire: { label: 'Vétérinaire',          color: '#8b5cf6', dot: 'dot-warning' },
};

export default function Sidebar({ children }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { text: t('Dashboard'), icon: <Dashboard />, path: '/' },
    ...( (userRole === 'admin' || userRole === 'responsable') ? [
      { text: t('Bâtiments'),  icon: <Home />,      path: '/batiments' },
      { text: t('Lots'),       icon: <Agriculture />, path: '/lots' },
      { text: t('Stocks'),     icon: <Inventory />,  path: '/stocks' }
    ] : []),
    { text: t('Production'),    icon: <ProductionQuantityLimits />, path: '/production' },
    { text: t('Interventions'), icon: <AddTask />,                  path: '/interventions' },
    ...( (userRole === 'admin' || userRole === 'responsable' || userRole === 'veterinaire') ? [
      { text: t('Santé'), icon: <MedicalServices />, path: '/sante' }
    ] : []),
    ...( userRole === 'admin' ? [
      { text: t('Users'), icon: <People />, path: '/users' }
    ] : [])
  ];

  const handleToggleSidebar = () => setCollapsed(!collapsed);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawerContent = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
      backdropFilter: 'blur(20px)',
      borderRight: `1px solid ${theme.palette.divider}`,
    }}>
      {/* ── Brand / Header Section ── */}
      <Box sx={{
        p: collapsed ? 2 : 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 2,
        minHeight: 80,
      }}>
        <Box sx={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${theme.palette.divider}`,
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <img 
            src="/assets/Logo.png" 
            alt="SOTAVI"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </Box>
        
        {!collapsed && (
          <Box>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontSize: '1.1rem', lineHeight: 1.2, fontWeight: 800 }}>
              SOTAVI
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, letterSpacing: '0.05em' }}>
              AGRI-TECH
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.1 }} />

      {/* ── Navigation List ── */}
      <List sx={{ flexGrow: 1, px: 1.5, py: 3 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: '12px',
                  px: collapsed ? 1.5 : 2,
                  py: 1.2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  backgroundColor: isActive ? 'rgba(163, 230, 53, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(163, 230, 53, 0.05)',
                    transform: collapsed ? 'none' : 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: collapsed ? 'auto' : 36,
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  transition: 'color 0.2s',
                }}>
                  {React.cloneElement(item.icon, { fontSize: 'medium' })}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
                    }}
                  />
                )}
                {isActive && !collapsed && (
                  <Box sx={{
                    position: 'absolute', right: 0, top: '20%', bottom: '20%', width: 4,
                    borderRadius: '4px 0 0 4px',
                    background: theme.palette.primary.main,
                    boxShadow: '0 0 10px rgba(163, 230, 53, 0.5)',
                  }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* ── Footer / Logout ── */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2, opacity: 0.1 }} />
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: '12px',
            px: collapsed ? 1.5 : 2,
            py: 1.2,
            color: '#ef4444',
            '&:hover': { background: 'rgba(239, 68, 68, 0.08)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 36, color: 'inherit' }}>
            <Logout />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText primary={t('Déconnexion')} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <div className="bg-mesh" />

      {/* ── Side Drawer ── */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        sx={{
          width: collapsed ? collapsedDrawerWidth : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? collapsedDrawerWidth : drawerWidth,
            boxSizing: 'border-box',
            borderRight: 'none',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        {drawerContent}
        {!isMobile && (
          <IconButton
            onClick={handleToggleSidebar}
            sx={{
              position: 'absolute',
              right: 10,
              bottom: 20,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': { bgcolor: 'rgba(163, 230, 53, 0.1)' },
              color: theme.palette.text.primary,
            }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        )}
      </Drawer>

      {/* ── Main Layout Wrapper ── */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <TopNavbar onMobileMenuClick={handleDrawerToggle} />
        
        <Box component="main" sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          minHeight: 'calc(100vh - 64px)',
          transition: 'all 0.3s ease',
          overflowY: 'auto'
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}