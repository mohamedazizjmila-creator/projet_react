import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Container, Paper, TextField, Button, Typography, Box, Alert,
  IconButton, InputAdornment, CircularProgress, useTheme
} from '@mui/material';
import {
  Email, Lock, Login as LoginIcon, Visibility, VisibilityOff
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(t('Email ou mot de passe incorrect'));
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
      background: theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9',
    }}>
      <div className="bg-mesh" />

      {/* ── Background Decoration ── */}
      <Box sx={{
        position: 'absolute', width: '150%', height: '150%',
        background: `radial-gradient(circle at 50% 50%, ${theme.palette.primary.main}08 0%, transparent 40%)`,
        zIndex: 0,
      }} />

      <Container maxWidth="xs" sx={{ zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper className="glass-card" sx={{
            p: 5,
            borderRadius: '32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'dark' ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(0,0,0,0.05)',
          }}>
            {/* ── Logo Section ── */}
            <Box sx={{
              width: 100, height: 100,
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
              mx: 'auto',
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
            }}>
              <img 
                src="/assets/Logo.png" 
                alt="SOTAVI"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: theme.palette.text.primary, letterSpacing: '-0.02em' }}>
              SOTAVI
            </Typography>
            <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, mb: 1, letterSpacing: '0.1em', fontWeight: 800 }}>
              {t('Login Page Title')}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 4, fontWeight: 500, fontStyle: 'italic' }}>
              "{t('Gestion Avicole Intelligente')}"
            </Typography>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="error" sx={{ mb: 3, borderRadius: '16px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                    {error}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t('Email')}
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '16px' }
                }}
              />

              <TextField
                fullWidth
                label={t('Password')}
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 4 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff sx={{ color: theme.palette.text.secondary }} /> : <Visibility sx={{ color: theme.palette.text.secondary }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '16px' }
                }}
              />

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.8,
                  fontSize: '1rem',
                  fontWeight: 800,
                  borderRadius: '16px',
                  boxShadow: '0 8px 25px rgba(163, 230, 53, 0.25)',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 30px rgba(163, 230, 53, 0.35)' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : t('Se connecter')}
              </Button>
            </form>

            <Box sx={{ mt: 5, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, letterSpacing: '0.05em' }}>
                © 2025 SOTAVI · SYSTÈME DE GESTION AVICOLE
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}