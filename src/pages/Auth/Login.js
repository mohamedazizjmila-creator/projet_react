import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container, Paper, TextField, Button, Typography, Box, Alert,
  IconButton, InputAdornment, CircularProgress, useTheme
} from '@mui/material';
import {
  Email, Lock, Login, Visibility, VisibilityOff, Agriculture
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const theme = useTheme();
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
      background: '#0f172a',
    }}>
      <div className="bg-mesh" />

      {/* ── Background Decoration ── */}
      <Box sx={{
        position: 'absolute', width: '150%', height: '150%',
        background: 'radial-gradient(circle at 50% 50%, rgba(163, 230, 53, 0.03) 0%, transparent 40%)',
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
            borderRadius: '24px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            {/* ── Logo Section ── */}
            <Box sx={{
              width: 80, height: 80,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #a3e635 0%, #65a30d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 24px rgba(163, 230, 53, 0.2)',
              mx: 'auto',
              mb: 3,
            }}>
              <Agriculture sx={{ fontSize: 40, color: '#0f172a' }} />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
              SOTAVI
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 4, letterSpacing: '0.1em', fontWeight: 600 }}>
              PORTAIL ENTREPRISE
            </Typography>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                    {error}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Adresse email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 3, '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#334155' } } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 4, '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#334155' } } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff sx={{ color: '#64748b' }} /> : <Visibility sx={{ color: '#64748b' }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
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
                  fontWeight: 700,
                  bgcolor: '#a3e635',
                  color: '#0f172a',
                  borderRadius: '12px',
                  boxShadow: '0 8px 16px rgba(163, 230, 53, 0.1)',
                  '&:hover': { bgcolor: '#84cc16' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
              </Button>
            </form>

            <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid rgba(148, 163, 184, 0.05)' }}>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                © 2025 SOTAVI · SYSTÈME DE GESTION AVICOLE
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}