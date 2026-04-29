import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Box, AppBar, Divider, Avatar, Chip, Tooltip, IconButton
} from '@mui/material';
import {
  Dashboard, Home, Agriculture, ProductionQuantityLimits,
  MedicalServices, Inventory, People, Logout, AddTask, 
  ChevronLeft, ChevronRight
} from '@mui/icons-material';
 
const drawerWidth = 280;
const collapsedDrawerWidth = 80;
 
// ── palette ──────────────────────────────────────────────────────────────────
const GREEN_DARK   = '#14532d';
const GREEN_MID    = '#166534';
const GREEN_MAIN   = '#16a34a';
const GREEN_LIGHT  = '#22c55e';
const GREEN_GHOST  = '#f0fdf4';
const GREEN_SOFT   = '#dcfce7';
const ACCENT       = '#86efac';
 
const roleConfig = {
  admin:       { label: 'Administrateur',       color: '#b91c1c', bg: '#fef2f2', dot: '#ef4444' },
  responsable: { label: "Resp. d'élevage",      color: '#1d4ed8', bg: '#eff6ff', dot: '#3b82f6' },
  technicien:  { label: 'Technicien',           color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
  veterinaire: { label: 'Vétérinaire',          color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6' },
};
 
export default function Sidebar({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, logout } = useAuth();
  const [hovered, setHovered] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
 
  const role = roleConfig[userRole] || { label: 'Inconnu', color: '#6b7280', bg: '#f9fafb', dot: '#9ca3af' };
 
  const getInitials = () => {
    const email = user?.email || '';
    return email.substring(0, 2).toUpperCase();
  };
 
  const getMenuItems = () => {
    const items = [
      { text: 'Tableau de bord', icon: <Dashboard />, path: '/' }
    ];
    if (userRole === 'admin' || userRole === 'responsable') {
      items.push(
        { text: 'Bâtiments',  icon: <Home />,      path: '/batiments' },
        { text: 'Lots',       icon: <Agriculture />, path: '/lots' },
        { text: 'Stocks',     icon: <Inventory />,  path: '/stocks' }
      );
    }
    items.push(
      { text: 'Production',    icon: <ProductionQuantityLimits />, path: '/production' },
      { text: 'Interventions', icon: <AddTask />,                  path: '/interventions' }
    );
    if (userRole === 'admin' || userRole === 'responsable' || userRole === 'veterinaire') {
      items.push({ text: 'Santé', icon: <MedicalServices />, path: '/sante' });
    }
    if (userRole === 'admin') {
      items.push({ text: 'Utilisateurs', icon: <People />, path: '/users' });
    }
    return items;
  };
 
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
 
  const drawer = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      bgcolor: '#fff',
      transition: 'width 0.3s ease',
      overflowX: 'hidden',
      position: 'relative',
    }}>
 
      {/* ── Bouton flèche (toujours visible) ── */}
      <IconButton
        onClick={toggleSidebar}
        sx={{
          position: 'absolute',
          right: -14,
          top: 80,
          zIndex: 1400,
          backgroundColor: GREEN_MAIN,
          border: `2px solid #fff`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          '&:hover': {
            backgroundColor: GREEN_DARK,
          },
          width: 28,
          height: 28,
          '& .MuiSvgIcon-root': {
            fontSize: 18,
            color: '#fff',
          },
        }}
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </IconButton>
 
      {/* ── Brand header avec logo personnalisé ── */}
      <Box sx={{
        p: collapsed ? 1.5 : 2.5,
        background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 1.5,
        borderBottom: `1px solid ${GREEN_MAIN}`,
        minHeight: 90,
        position: 'relative',
      }}>
        {/* Logo personnalisé */}
        <Box sx={{
          width: collapsed ? 45 : 55,
          height: collapsed ? 45 : 55,
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.2)',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <img 
            src="/assets/Logo.png" 
            alt="SOTAVI"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
        
        {/* Texte (caché en mode collapsed) */}
        {!collapsed && (
          <Box>
            <Typography sx={{
              fontWeight: 800,
              fontSize: '1.1rem',
              color: '#fff',
              letterSpacing: '0.03em',
              lineHeight: 1.2,
            }}>
              SOTAVI
            </Typography>
            <Typography sx={{ 
              fontSize: '0.6rem', 
              color: ACCENT, 
              letterSpacing: '0.05em',
              mt: 0.3,
            }}>
              Société Tunisienne d'Aviculture
            </Typography>
          </Box>
        )}
      </Box>
 
      {/* ── User card ── */}
      {!collapsed ? (
        <Box sx={{
          mx: 1.5, my: 2,
          p: 1.5,
          borderRadius: '12px',
          background: GREEN_GHOST,
          border: `1px solid ${GREEN_SOFT}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <Avatar sx={{
            width: 38, height: 38,
            background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`,
            fontSize: '0.75rem', fontWeight: 700,
          }}>
            {getInitials()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{
              fontSize: '0.7rem', color: '#6b7280',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.email?.split('@')[0]}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.3 }}>
              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: role.dot }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: role.color }}>
                {role.label}
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <Tooltip title={role.label} placement="right">
            <Avatar sx={{
              width: 40, height: 40,
              background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`,
              fontSize: '0.8rem', fontWeight: 700,
            }}>
              {getInitials()}
            </Avatar>
          </Tooltip>
        </Box>
      )}
 
      {!collapsed && (
        <Box sx={{ px: 2, mb: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em' }}>
            MENU PRINCIPAL
          </Typography>
        </Box>
      )}
 
      {/* ── Menu ── */}
      <List sx={{ flexGrow: 1, px: collapsed ? 1 : 1.5, py: 0 }}>
        {getMenuItems().map((item) => {
          const isActive = location.pathname === item.path;
          const isHov = hovered === item.text;
          
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.text : ''} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  onMouseEnter={() => setHovered(item.text)}
                  onMouseLeave={() => setHovered(null)}
                  sx={{
                    borderRadius: '10px',
                    px: collapsed ? 1.5 : 2,
                    py: collapsed ? 1.2 : 0.9,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    background: isActive ? `linear-gradient(90deg, ${GREEN_GHOST} 0%, ${GREEN_SOFT} 100%)` : 'transparent',
                    '&:hover': { background: GREEN_GHOST },
                    '&::before': isActive && !collapsed ? {
                      content: '""',
                      position: 'absolute', left: 0, top: '15%',
                      height: '70%', width: '3px',
                      borderRadius: '0 3px 3px 0',
                      background: `linear-gradient(180deg, ${GREEN_MAIN}, ${GREEN_DARK})`,
                    } : {},
                    transform: isHov && !isActive && !collapsed ? 'translateX(3px)' : 'none',
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: collapsed ? 'auto' : 36,
                    justifyContent: 'center',
                    color: isActive ? GREEN_MAIN : '#9ca3af',
                    transition: 'color 0.2s',
                    mr: collapsed ? 0 : 1,
                  }}>
                    {React.cloneElement(item.icon, { fontSize: 'small' })}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.82rem',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? GREEN_DARK : '#374151',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
 
      {/* ── Logout ── */}
      <Box sx={{ p: collapsed ? 1 : 1.5 }}>
        <Divider sx={{ mb: 1, borderColor: GREEN_SOFT }} />
        <Tooltip title={collapsed ? "Déconnexion" : ""} placement="right">
          <ListItemButton
            onClick={logout}
            sx={{
              borderRadius: '10px',
              px: collapsed ? 1.5 : 2,
              py: collapsed ? 1.2 : 0.9,
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.2s ease',
              '&:hover': { background: '#fef2f2' },
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: collapsed ? 'auto' : 36,
              justifyContent: 'center',
              color: '#ef4444',
              mr: collapsed ? 0 : 1,
            }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Déconnexion"
                primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 500, color: '#ef4444' }}
              />
            )}
          </ListItemButton>
        </Tooltip>
        {!collapsed && (
          <Typography sx={{ textAlign: 'center', fontSize: '0.6rem', color: '#d1d5db', mt: 1 }}>
            v1.0
          </Typography>
        )}
      </Box>
    </Box>
  );
 
  return (
    <Box sx={{ display: 'flex' }}>
 
      {/* ── AppBar avec logo et titre ── */}
      <AppBar position="fixed" elevation={0} sx={{
        zIndex: 1300,
        background: `linear-gradient(90deg, ${GREEN_DARK} 0%, ${GREEN_MID} 100%)`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          height: 64,
        }}>
          {/* Left side - Logo et titre */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img 
                src="/assets/Logo.png" 
                alt="SOTAVI"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
            <Box>
              <Typography sx={{
                fontWeight: 700,
                fontSize: '1rem',
                color: '#fff',
                letterSpacing: '0.03em',
                lineHeight: 1.2,
              }}>
                SOTAVI
              </Typography>
              <Typography sx={{
                fontSize: '0.55rem',
                color: ACCENT,
                letterSpacing: '0.03em',
              }}>
                Société Tunisienne d'Aviculture
              </Typography>
            </Box>
          </Box>
 
          {/* Right side - User info and status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              px: 1.5,
              py: 0.4,
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.08)',
            }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: ACCENT, animation: 'pulse 2s infinite' }}/>
              <Typography sx={{ fontSize: '0.7rem', color: '#e5e7eb', fontWeight: 500 }}>
                Système actif
              </Typography>
            </Box>
            
            <Tooltip title={user?.email}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.08)',
                cursor: 'pointer',
              }}>
                <Avatar sx={{
                  width: 28, height: 28,
                  background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`,
                  fontSize: '0.7rem', fontWeight: 700,
                }}>
                  {getInitials()}
                </Avatar>
                <Typography sx={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500 }}>
                  {user?.email?.split('@')[0]}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </AppBar>
 
      {/* ── Drawer with dynamic width ── */}
      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? collapsedDrawerWidth : drawerWidth,
          transition: 'width 0.3s ease',
          '& .MuiDrawer-paper': {
            width: collapsed ? collapsedDrawerWidth : drawerWidth,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)',
            borderRight: `1px solid ${GREEN_SOFT}`,
            boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
            transition: 'width 0.3s ease',
            overflowX: 'visible',
          },
        }}
      >
        {drawer}
      </Drawer>
 
      {/* ── Main content ── */}
      <Box component="main" sx={{
        flexGrow: 1,
        p: 3,
        mt: '64px',
        minHeight: 'calc(100vh - 64px)',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        transition: 'margin-left 0.3s ease',
      }}>
        {children}
      </Box>
      
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Box>
  );
}