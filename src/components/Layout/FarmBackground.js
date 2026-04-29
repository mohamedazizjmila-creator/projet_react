import React from 'react';
import { Box } from '@mui/material';

export default function FarmBackground({ children }) {
  return (
    <Box sx={{ 
      position: 'relative', 
      minHeight: 'calc(100vh - 64px)',
      background: 'linear-gradient(135deg, #fef9e8 0%, #f0fdf4 50%, #e8f5e9 100%)',
      overflowX: 'hidden',
    }}>
      
      {/* ── SVG Pattern de plumes (texture agricole) ── */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%2316a34a' fill-opacity='0.03' d='M50,15 L55,25 L65,28 L58,36 L60,46 L50,41 L40,46 L42,36 L35,28 L45,25 Z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* ── Grande poule décorative (ombre) ── */}
      <Box sx={{
        position: 'absolute',
        bottom: '5%',
        right: '2%',
        width: '180px',
        height: '180px',
        opacity: 0.08,
        zIndex: 0,
        pointerEvents: 'none',
      }}>
        <svg viewBox="0 0 200 200" fill="none">
          {/* Corps de la poule */}
          <ellipse cx="100" cy="120" rx="50" ry="35" fill="#14532d" />
          {/* Tête */}
          <circle cx="60" cy="90" r="18" fill="#14532d" />
          {/* Bec */}
          <path d="M42 90 L30 86 L42 82" fill="#fbbf24" />
          {/* Crête */}
          <path d="M55 72 Q60 60 65 72 Q70 58 75 72" fill="#ef4444" />
          {/* Queue */}
          <path d="M140 110 Q160 90 155 120 Q165 100 150 130" fill="#14532d" />
          {/* Œuf */}
          <ellipse cx="100" cy="150" rx="12" ry="16" fill="#fef3c7" />
        </svg>
      </Box>

      {/* ── Deuxième poule (petite) ── */}
      <Box sx={{
        position: 'absolute',
        top: '15%',
        left: '2%',
        width: '100px',
        height: '100px',
        opacity: 0.06,
        zIndex: 0,
        pointerEvents: 'none',
      }}>
        <svg viewBox="0 0 100 100" fill="none">
          <ellipse cx="50" cy="60" rx="25" ry="18" fill="#166534" />
          <circle cx="30" cy="45" r="9" fill="#166534" />
          <path d="M21 45 L14 42 L21 39" fill="#fbbf24" />
          <path d="M28 35 Q30 28 32 35 Q34 27 36 35" fill="#ef4444" />
          <ellipse cx="50" cy="75" rx="6" ry="8" fill="#fef3c7" />
        </svg>
      </Box>

      {/* ── Troisième poule (moyenne) ── */}
      <Box sx={{
        position: 'absolute',
        bottom: '20%',
        left: '15%',
        width: '130px',
        height: '130px',
        opacity: 0.05,
        zIndex: 0,
        pointerEvents: 'none',
        transform: 'scaleX(-1)',
      }}>
        <svg viewBox="0 0 100 100" fill="none">
          <ellipse cx="50" cy="60" rx="28" ry="20" fill="#2d8f5e" />
          <circle cx="28" cy="42" r="10" fill="#2d8f5e" />
          <path d="M18 42 L10 38 L18 35" fill="#fbbf24" />
          <path d="M25 32 Q28 24 30 32 Q33 23 35 32" fill="#ef4444" />
          <ellipse cx="50" cy="76" rx="7" ry="9" fill="#fef3c7" />
        </svg>
      </Box>

      {/* ── Œufs flottants animés ── */}
      <Box sx={{
        position: 'absolute',
        left: '12%',
        top: '20%',
        animation: 'floatEgg 4s ease-in-out infinite',
        opacity: 0.12,
        zIndex: 0,
      }}>
        <svg width="40" height="50" viewBox="0 0 40 50">
          <ellipse cx="20" cy="25" rx="16" ry="22" fill="#fef3c7" stroke="#c2410c" strokeWidth="1" />
        </svg>
      </Box>

      <Box sx={{
        position: 'absolute',
        left: '85%',
        top: '35%',
        animation: 'floatEgg 5s ease-in-out infinite 1s',
        opacity: 0.1,
        zIndex: 0,
      }}>
        <svg width="35" height="45" viewBox="0 0 35 45">
          <ellipse cx="17" cy="22" rx="14" ry="19" fill="#fde68a" stroke="#c2410c" strokeWidth="1" />
        </svg>
      </Box>

      <Box sx={{
        position: 'absolute',
        left: '20%',
        bottom: '15%',
        animation: 'floatEgg 4.5s ease-in-out infinite 2s',
        opacity: 0.1,
        zIndex: 0,
      }}>
        <svg width="30" height="40" viewBox="0 0 30 40">
          <ellipse cx="15" cy="20" rx="12" ry="16" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
        </svg>
      </Box>

      <Box sx={{
        position: 'absolute',
        right: '15%',
        bottom: '25%',
        animation: 'floatEgg 3.5s ease-in-out infinite 0.5s',
        opacity: 0.12,
        zIndex: 0,
      }}>
        <svg width="50" height="60" viewBox="0 0 50 60">
          <ellipse cx="25" cy="30" rx="20" ry="26" fill="#fde68a" stroke="#dc2626" strokeWidth="1" />
        </svg>
      </Box>

      <Box sx={{
        position: 'absolute',
        left: '45%',
        top: '10%',
        animation: 'floatEgg 6s ease-in-out infinite 1.5s',
        opacity: 0.08,
        zIndex: 0,
      }}>
        <svg width="25" height="35" viewBox="0 0 25 35">
          <ellipse cx="12" cy="17" rx="10" ry="14" fill="#fef3c7" />
        </svg>
      </Box>

      {/* ── Motif de plumes flottantes ── */}
      <Box sx={{
        position: 'absolute',
        right: '10%',
        top: '60%',
        animation: 'floatFeather 7s ease-in-out infinite',
        opacity: 0.08,
        zIndex: 0,
      }}>
        <svg width="60" height="30" viewBox="0 0 60 30">
          <path d="M0,15 Q15,0 30,5 Q45,10 60,15 Q45,20 30,25 Q15,30 0,15 Z" fill="#16a34a" />
        </svg>
      </Box>

      <Box sx={{
        position: 'absolute',
        left: '5%',
        top: '45%',
        animation: 'floatFeather 8s ease-in-out infinite 2s',
        opacity: 0.06,
        zIndex: 0,
        transform: 'rotate(45deg)',
      }}>
        <svg width="50" height="25" viewBox="0 0 50 25">
          <path d="M0,12 Q12,0 25,5 Q38,10 50,12 Q38,17 25,20 Q12,25 0,12 Z" fill="#2d8f5e" />
        </svg>
      </Box>

      {/* ── Cercles décoratifs (inspirés des œufs) ── */}
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(22,101,52,0.03) 0%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        animation: 'pulseGreen 10s ease-in-out infinite',
        zIndex: 0,
      }} />

      <Box sx={{
        position: 'absolute',
        top: '30%',
        left: '20%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,191,36,0.03) 0%, transparent 70%)',
        animation: 'pulseOrange 8s ease-in-out infinite',
        zIndex: 0,
      }} />

      {/* ── Contenu principal ── */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>

      <style>
        {`
          @keyframes floatEgg {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          @keyframes floatFeather {
            0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
            50% { transform: translateX(15px) translateY(-10px) rotate(5deg); }
          }
          @keyframes pulseGreen {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
            50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.3; }
          }
          @keyframes pulseOrange {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.08); opacity: 0.2; }
          }
        `}
      </style>
    </Box>
  );
}