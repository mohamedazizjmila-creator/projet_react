import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container, Paper, TextField, Button, Typography, Box, Alert,
  IconButton, InputAdornment, CircularProgress
} from '@mui/material';
import {
  Email, Lock, Login, Visibility, VisibilityOff, Agriculture, EggAlt
} from '@mui/icons-material';

// ── palette ───────────────────────────────────────────────────────────────────
const GREEN_DARK  = '#0a3d2a';
const GREEN_MID   = '#1a5c3e';
const GREEN_MAIN  = '#2e7d5e';
const GREEN_LIGHT = '#4caf7f';
const ACCENT      = '#ffd54f';
const EGG_YELLOW  = '#fef3c7';
const CHICKEN_BROWN = '#d4a574';

// ── Logo SOTAVI Component (identique à la sidebar) ────────────────────────────
function SotaviLogo({ size = 90 }) {
  const logoSrc = "/assets/Logo.png";
  
  return (
    <Box sx={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 32px rgba(10,61,42,0.2)',
      margin: '0 auto',
      mb: 3,
      overflow: 'hidden',
      p: 1.5
    }}>
      <img 
        src={logoSrc}
        alt="SOTAVI"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.2))'
        }}
      />
    </Box>
  );
}

// ── Animated Egg Component ────────────────────────────────────────────────────
function AnimatedEgg({ size = 30, delay = 0, left = '0%', top = '0%' }) {
  return (
    <Box sx={{
      position: 'absolute',
      left: left,
      top: top,
      animation: `float ${3 + delay}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      opacity: 0.6,
    }}>
      <EggAlt sx={{ 
        fontSize: size, 
        color: EGG_YELLOW,
        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
      }} />
    </Box>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      
      {/* ── Background principal avec motif d'œufs ── */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 30%, ${GREEN_MAIN} 60%, ${GREEN_LIGHT} 100%)`,
        zIndex: -2,
      }} />
      
      {/* Pattern d'œufs en arrière-plan */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(circle at 20% 40%, rgba(255,213,79,0.15) 2%, transparent 2.5%),
                          radial-gradient(circle at 80% 60%, rgba(255,213,79,0.12) 1.5%, transparent 2%),
                          radial-gradient(circle at 40% 80%, rgba(255,213,79,0.1) 1.8%, transparent 2.3%)`,
        backgroundSize: '60px 60px, 80px 80px, 50px 50px',
        zIndex: -1,
      }} />
      
      {/* Motif de plumes */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 80px)`,
        zIndex: -1,
      }} />

      {/* ── Animations: Œufs flottants ── */}
      <AnimatedEgg size={25} delay={0} left="5%" top="15%" />
      <AnimatedEgg size={35} delay={1} left="85%" top="20%" />
      <AnimatedEgg size={20} delay={2} left="10%" top="70%" />
      <AnimatedEgg size={30} delay={1.5} left="75%" top="75%" />
      <AnimatedEgg size={18} delay={0.5} left="50%" top="10%" />
      <AnimatedEgg size={28} delay={2.5} left="20%" top="50%" />
      <AnimatedEgg size={22} delay={3} left="90%" top="45%" />

      {/* ── Cercles décoratifs ── */}
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, rgba(255,213,79,0.08) 0%, transparent 70%)`,
        zIndex: -1,
        animation: 'pulse 8s ease-in-out infinite',
      }} />

      <Container maxWidth="sm">
        <Paper sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: '32px',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.5)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: `linear-gradient(90deg, ${CHICKEN_BROWN}, ${EGG_YELLOW}, ${GREEN_LIGHT}, ${EGG_YELLOW}, ${CHICKEN_BROWN})`,
          }
        }}>
          {/* Logo SOTAVI - identique à la sidebar */}
          <SotaviLogo size={90} />
          
          {/* Titre */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Typography sx={{
              fontSize: '2rem',
              fontWeight: 800,
              background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MAIN} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.5px',
            }}>
              SOTAVI
            </Typography>
            
            <Typography sx={{
              fontSize: '0.75rem',
              color: '#6b7280',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 600,
              mt: 0.5,
            }}>
              Société Tunisienne d'Aviculture
            </Typography>
          </Box>

          {/* Sous-titre avec icône d'œuf */}
          <Typography sx={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.85rem',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}>
            <EggAlt sx={{ fontSize: 16, color: EGG_YELLOW }} />
            Connectez-vous à votre espace de travail
            <EggAlt sx={{ fontSize: 16, color: EGG_YELLOW }} />
          </Typography>

          {/* Error alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: '16px',
                '& .MuiAlert-icon': { alignItems: 'center' }
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ 
                      color: focusedField === 'email' ? GREEN_MAIN : '#9ca3af',
                      transition: 'color 0.2s'
                    }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  transition: 'all 0.2s',
                  '&:hover fieldset': {
                    borderColor: GREEN_MAIN,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: GREEN_MAIN,
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: GREEN_MAIN,
                },
              }}
            />

            <TextField
              fullWidth
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ 
                      color: focusedField === 'password' ? GREEN_MAIN : '#9ca3af',
                      transition: 'color 0.2s'
                    }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  transition: 'all 0.2s',
                  '&:hover fieldset': {
                    borderColor: GREEN_MAIN,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: GREEN_MAIN,
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: GREEN_MAIN,
                },
              }}
            />

            <Button
              fullWidth
              type="submit"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${GREEN_MID} 0%, ${GREEN_DARK} 100%)`,
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(10,61,42,0.4)',
                transition: 'all 0.3s',
                '&:hover': {
                  background: `linear-gradient(135deg, ${GREEN_DARK} 0%, #051f15 100%)`,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(10,61,42,0.5)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&.Mui-disabled': {
                  background: '#9ca3af',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: '#fff' }} />
              ) : (
                <>
                  <Login sx={{ mr: 1 }} /> Se connecter
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <Box sx={{
            mt: 4,
            pt: 2,
            borderTop: '1px solid rgba(0,0,0,0.08)',
            textAlign: 'center',
          }}>
            <Typography sx={{
              fontSize: '0.7rem',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}>
              <Agriculture sx={{ fontSize: 12 }} />
              Système de gestion avicole professionnel
              <Agriculture sx={{ fontSize: 12 }} />
            </Typography>
            <Typography sx={{
              fontSize: '0.65rem',
              color: '#d1d5db',
              mt: 1,
            }}>
              © 2025 SOTAVI - Société Tunisienne d'Aviculture
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* CSS animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(10deg);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.08;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.1);
              opacity: 0.12;
            }
          }
        `}
      </style>
    </Box>
  );
}