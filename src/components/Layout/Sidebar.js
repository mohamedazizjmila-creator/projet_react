import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Box, AppBar, Divider, Avatar, Chip, Tooltip, IconButton,
  useTheme, useMediaQuery
} from '@mui/material';
import {
  Dashboard, Home, Agriculture, ProductionQuantityLimits,
  MedicalServices, Inventory, People, Logout, AddTask, 
  ChevronLeft, ChevronRight, Menu as MenuIcon
} from '@mui/icons-material';

const drawerWidth = 280;
const collapsedDrawerWidth = 80;

const roleConfig = {
  admin:       { label: 'Administrateur',       color: '#a3e635', dot: 'dot-success' },
  responsable: { label: "Resp. d'élevage",      color: '#3b82f6', dot: 'dot-warning' },
  technicien:  { label: 'Technicien',           color: '#fbbf24', dot: 'dot-warning' },
  veterinaire: { label: 'Vétérinaire',          color: '#8b5cf6', dot: 'dot-warning' },
};

export default function Sidebar({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, logout } = useAuth();
  const [hovered, setHovered] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = roleConfig[userRole] || { label: 'Utilisateur', color: '#94a3b8', dot: 'dot-info' };

  const getInitials = () => {
    const email = user?.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  const menuItems = [
    { text: 'Tableau de bord', icon: <Dashboard />, path: '/' },
    ...( (userRole === 'admin' || userRole === 'responsable') ? [
      { text: 'Bâtiments',  icon: <Home />,      path: '/batiments' },
      { text: 'Lots',       icon: <Agriculture />, path: '/lots' },
      { text: 'Stocks',     icon: <Inventory />,  path: '/stocks' }
    ] : []),
    { text: 'Production',    icon: <ProductionQuantityLimits />, path: '/production' },
    { text: 'Interventions', icon: <AddTask />,                  path: '/interventions' },
    ...( (userRole === 'admin' || userRole === 'responsable' || userRole === 'veterinaire') ? [
      { text: 'Santé', icon: <MedicalServices />, path: '/sante' }
    ] : []),
    ...( userRole === 'admin' ? [
      { text: 'Utilisateurs', icon: <People />, path: '/users' }
    ] : [])
  ];

  const handleToggleSidebar = () => setCollapsed(!collapsed);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawerContent = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(148, 163, 184, 0.05)',
    }}>
      {/* ── Brand Header ── */}
      <Box sx={{
        p: collapsed ? 2 : 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 2,
        minHeight: 100,
      }}>
        <Box sx={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #a3e635 0%, #65a30d 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(163, 230, 53, 0.2)',
          flexShrink: 0,
        }}>
          <img 
            src="/assets/Logo.png" 
            alt="SOTAVI"
            style={{ width: '80%', height: '80%', objectFit: 'contain' }}
          />
        </Box>
        
        {!collapsed && (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontSize: '1.1rem', lineHeight: 1.2 }}>
              SOTAVI
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600, letterSpacing: '0.05em' }}>
              ENTERPRISE
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── User Profile Section ── */}
      <Box sx={{ px: collapsed ? 1 : 2, mb: 4 }}>
        <Box sx={{
          p: 2,
          borderRadius: '16px',
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <Avatar sx={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #a3e635 0%, #65a30d 100%)',
            color: '#0f172a', fontWeight: 800, fontSize: '0.9rem',
            border: '2px solid rgba(163, 230, 53, 0.3)',
          }}>
            {getInitials()}
          </Avatar>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc', noWrap: true }}>
                {user?.email?.split('@')[0]}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <div className={`dot-glow ${role.dot}`} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: role.color }}>
                  {role.label}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Navigation List ── */}
      <List sx={{ flexGrow: 1, px: 2, py: 0 }}>
        {!collapsed && (
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', ml: 2, mb: 1, display: 'block' }}>
            PRINCIPAL
          </Typography>
        )}
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                onMouseEnter={() => setHovered(item.text)}
                onMouseLeave={() => setHovered(null)}
                sx={{
                  borderRadius: '12px',
                  px: collapsed ? 1.5 : 2,
                  py: 1.5,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  backgroundColor: isActive ? 'rgba(163, 230, 53, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(163, 230, 53, 0.04)',
                    transform: collapsed ? 'none' : 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: collapsed ? 'auto' : 40,
                  color: isActive ? theme.palette.primary.main : '#64748b',
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
                      color: isActive ? '#f8fafc' : '#94a3b8',
                    }}
                  />
                )}
                {isActive && !collapsed && (
                  <Box sx={{
                    position: 'absolute', right: 0, top: '25%', bottom: '25%', width: 3,
                    borderRadius: '4px 0 0 4px',
                    background: theme.palette.primary.main,
                    boxShadow: '0 0 8px rgba(163, 230, 53, 0.5)',
                  }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* ── Footer / Logout ── */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2, opacity: 0.05 }} />
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: '12px',
            px: collapsed ? 1.5 : 2,
            py: 1.5,
            color: '#ef4444',
            '&:hover': { background: 'rgba(239, 68, 68, 0.08)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 40, color: 'inherit' }}>
            <Logout />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText primary="Déconnexion" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
      <div className="bg-mesh" />

      {/* ── AppBar for Mobile ── */}
      {isMobile && (
        <AppBar position="fixed" elevation={0} sx={{
          bgcolor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', height: 64, px: 2 }}>
            <IconButton color="inherit" onClick={handleDrawerToggle} edge="start" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ fontWeight: 800 }}>SOTAVI</Typography>
          </Box>
        </AppBar>
      )}

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
              bgcolor: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              '&:hover': { bgcolor: 'rgba(163, 230, 53, 0.1)' },
              color: '#fff',
            }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        )}
      </Drawer>

      {/* ── Main Content ── */}
      <Box component="main" sx={{
        flexGrow: 1,
        p: { xs: 2, md: 4 },
        mt: isMobile ? '64px' : 0,
        minHeight: '100vh',
        transition: 'all 0.3s ease',
      }}>
        {children}
      </Box>
    </Box>
  );
}