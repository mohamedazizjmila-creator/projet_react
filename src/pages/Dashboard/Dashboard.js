import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Box, Button, Alert, LinearProgress, Divider, Chip
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getLots } from '../../services/firestore';
import { initDatabase } from '../../initDatabase';
 
// ── palette (mirrors Sidebar) ─────────────────────────────────────────────────
const GREEN_DARK  = '#14532d';
const GREEN_MID   = '#166534';
const GREEN_MAIN  = '#16a34a';
const GREEN_GHOST = '#f0fdf4';
const GREEN_SOFT  = '#dcfce7';
const ACCENT      = '#86efac';
 
// ── tiny stat card ────────────────────────────────────────────────────────────
function StatCard({ value, label, active }) {
  return (
    <Box sx={{
      flex: 1,
      p: 2.5,
      borderRadius: '14px',
      background: active
        ? `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 100%)`
        : '#fff',
      border: active ? 'none' : '1px solid #e5e7eb',
      boxShadow: active
        ? '0 4px 18px rgba(20,83,45,0.25)'
        : '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5,
      minWidth: 130,
    }}>
      <Typography sx={{
        fontSize: '2rem',
        fontWeight: 800,
        lineHeight: 1.1,
        color: active ? '#fff' : GREEN_DARK,
        letterSpacing: '-0.5px',
      }}>
        {value}
      </Typography>
      <Typography sx={{
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: active ? ACCENT : '#9ca3af',
        textTransform: 'uppercase',
      }}>
        {label}
      </Typography>
    </Box>
  );
}
 
// ── performance bar row ───────────────────────────────────────────────────────
function PerfBar({ label, value, color }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
        <Typography sx={{ fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography sx={{
          fontSize: '0.9rem',
          fontWeight: 700,
          color: color === 'error' ? '#ef4444' : GREEN_DARK,
        }}>
          {value}%
        </Typography>
      </Box>
      <Box sx={{
        height: 10,
        borderRadius: 10,
        background: '#e5e7eb',
        overflow: 'hidden',
      }}>
        <Box sx={{
          height: '100%',
          width: `${value}%`,
          borderRadius: 10,
          background: color === 'error'
            ? '#ef4444'
            : color === 'blue'
            ? '#3b82f6'
            : `linear-gradient(90deg, ${GREEN_MAIN}, #4ade80)`,
          transition: 'width 0.8s ease',
        }} />
      </Box>
    </Box>
  );
}
 
// ── IoT sensor card ───────────────────────────────────────────────────────────
function SensorCard({ icon, label, value, unit, status, statusLabel }) {
  const statusColor = status === 'ok' ? GREEN_MAIN : status === 'warn' ? '#f59e0b' : '#ef4444';
  return (
    <Paper sx={{
      p: 2, textAlign: 'center',
      borderRadius: '14px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <Typography sx={{ fontSize: '1.4rem', mb: 0.5 }}>{icon}</Typography>
      <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: statusColor, lineHeight: 1 }}>
        {value}<span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{unit}</span>
      </Typography>
      <Box sx={{
        mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5,
        px: 1, py: 0.3, borderRadius: 10,
        background: status === 'ok' ? GREEN_GHOST : status === 'warn' ? '#fffbeb' : '#fef2f2',
      }}>
        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: statusColor }} />
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: statusColor }}>
          {statusLabel}
        </Typography>
      </Box>
    </Paper>
  );
}
 
// ── main component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState({
    lotsActifs: 12,
    volailles: 8000,
    tauxSurvie: 97,
    mortaliteMoyenne: 3.0,
    alertes: 3,
    temperature: 24.5,
    humidite: 55,
    nh3: 12,
    co2: 850,
    joursElevage: 15,
  });
  const [initMessage, setInitMessage] = useState('');
 
  const productionData = [
    { jour: '01/04', mortalite: 5,  consommation: 120, temperature: 24,   humidite: 52 },
    { jour: '02/04', mortalite: 3,  consommation: 125, temperature: 24.5, humidite: 53 },
    { jour: '03/04', mortalite: 2,  consommation: 130, temperature: 25,   humidite: 54 },
    { jour: '04/04', mortalite: 4,  consommation: 128, temperature: 25.5, humidite: 55 },
    { jour: '05/04', mortalite: 2,  consommation: 132, temperature: 26,   humidite: 56 },
    { jour: '06/04', mortalite: 3,  consommation: 135, temperature: 26,   humidite: 57 },
    { jour: '07/04', mortalite: 1,  consommation: 138, temperature: 25.5, humidite: 58 },
    { jour: '08/04', mortalite: 2,  consommation: 140, temperature: 25,   humidite: 55 },
    { jour: '09/04', mortalite: 3,  consommation: 142, temperature: 24.5, humidite: 54 },
    { jour: '10/04', mortalite: 2,  consommation: 145, temperature: 24,   humidite: 53 },
  ];
 
  const gazData = [
    { heure: '00:00', nh3: 10, co2: 800  },
    { heure: '04:00', nh3: 12, co2: 850  },
    { heure: '08:00', nh3: 15, co2: 900  },
    { heure: '12:00', nh3: 18, co2: 950  },
    { heure: '16:00', nh3: 20, co2: 1000 },
    { heure: '20:00', nh3: 16, co2: 880  },
  ];
 
  const alertesData = [
    { id: 1, type: 'warning', message: "Stock d'aliment faible (150 kg restants)",   temps: 'Il y a 2 h' },
    { id: 2, type: 'error',   message: 'Température élevée dans Bâtiment A (32 °C)', temps: 'Il y a 3 h' },
    { id: 3, type: 'info',    message: 'Vaccination programmée demain',               temps: 'Il y a 5 h' },
  ];
 
  const batimentsData = [
    { nom: 'Bâtiment A', temperature: 24, humidite: 52, nh3: 10, statut: 'ok'      },
    { nom: 'Bâtiment B', temperature: 28, humidite: 65, nh3: 25, statut: 'warning' },
  ];
 
  useEffect(() => { loadDashboard(); }, []);
 
  const loadDashboard = async () => {
    try {
      const lots = await getLots();
      const actifs = lots.filter(l => l.statut === 'actif');
      setStats(prev => ({ ...prev, lotsActifs: actifs.length || 12 }));
    } catch (_) {}
  };
 
  const handleInitDB = async () => {
    setInitMessage('Initialisation en cours…');
    const success = await initDatabase();
    setInitMessage(success ? '✅ Base de données initialisée !' : "❌ Erreur lors de l'initialisation");
    setTimeout(() => setInitMessage(''), 5000);
    if (success) loadDashboard();
  };
 
  return (
    <Box sx={{ maxWidth: 1200 }}>
 
      {/* ── Page header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: GREEN_DARK, letterSpacing: '-0.3px' }}>
            Tableau de bord
          </Typography>
          <Typography sx={{ fontSize: '0.88rem', color: '#6b7280', mt: 0.3 }}>
            Bonjour, voici un résumé de votre élevage aujourd'hui
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={handleInitDB}
          sx={{
            borderColor: GREEN_MAIN, color: GREEN_DARK, fontWeight: 600, fontSize: '0.78rem',
            borderRadius: '8px', textTransform: 'none',
            '&:hover': { background: GREEN_GHOST, borderColor: GREEN_DARK },
          }}
        >
          🔧 Initialiser la base
        </Button>
      </Box>
 
      {initMessage && <Alert severity="info" sx={{ mb: 2, borderRadius: '10px' }}>{initMessage}</Alert>}
 
      {/* ── TOP STAT CARDS (image layout: lots actifs highlighted, volailles, taux survie) ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard value={stats.lotsActifs} label="Lots actifs"  active={true} />
        <StatCard value={stats.volailles.toLocaleString('fr-FR')} label="Volailles" active={false} />
        <StatCard value={`${stats.tauxSurvie}%`} label="Taux survie" active={false} />
        <StatCard value={stats.joursElevage}       label="Jours d'élevage" active={false} />
      </Box>
 
      {/* ── PERFORMANCE SEMAINE (the progress bars from the image) ── */}
      <Paper sx={{
        p: 3, mb: 3,
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>
        <Typography sx={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
          color: '#9ca3af', textTransform: 'uppercase', mb: 2.5,
        }}>
          Performance semaine
        </Typography>
        <PerfBar label="Production œufs"   value={78} color="green" />
        <PerfBar label="Consommation aliment" value={65} color="blue" />
        <PerfBar label="Mortalité"          value={3}  color="error" />
      </Paper>
 
      {/* ── IoT SENSORS ── */}
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', mb: 1.5 }}>
        Capteurs environnementaux (IoT)
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { icon: '🌡️', label: 'Température',     value: stats.temperature, unit: '°C',  status: stats.temperature > 28 ? 'error' : 'ok', statusLabel: stats.temperature > 28 ? 'Élevée' : 'Normale' },
          { icon: '💧', label: 'Humidité',        value: stats.humidite,    unit: '%',   status: stats.humidite > 70 ? 'warn' : 'ok',       statusLabel: stats.humidite > 70 ? 'Élevée' : 'Bonne'   },
          { icon: '🧪', label: 'Ammoniac (NH₃)',  value: stats.nh3,         unit: ' ppm', status: stats.nh3 > 25 ? 'error' : 'ok',          statusLabel: stats.nh3 > 25 ? 'Dangereux' : 'Normal'   },
          { icon: '🫧', label: 'CO₂',             value: stats.co2,         unit: ' ppm', status: stats.co2 > 3000 ? 'error' : 'ok',        statusLabel: stats.co2 > 3000 ? 'Élevé' : 'Normal'     },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <SensorCard {...s} />
          </Grid>
        ))}
      </Grid>
 
      {/* ── CHARTS ROW ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: GREEN_DARK, mb: 2 }}>
              📈 Évolution de la production
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left"  type="monotone" dataKey="mortalite"    stroke="#ef4444" strokeWidth={2} dot={false} name="Mortalité" />
                <Line yAxisId="right" type="monotone" dataKey="consommation" stroke={GREEN_MAIN} strokeWidth={2} dot={false} name="Consommation (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
 
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: GREEN_DARK, mb: 2 }}>
              🌡️ Température / Humidité
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} dot={false} name="Température °C" />
                <Line type="monotone" dataKey="humidite"    stroke="#3b82f6" strokeWidth={2} dot={false} name="Humidité %" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
 
      {/* ── GAZ + BÂTIMENTS ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: GREEN_DARK, mb: 2 }}>
              🧪 Évolution des gaz (IoT)
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={gazData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="heure" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="nh3" stroke="#ef4444" strokeWidth={2} dot={false} name="NH₃ (ppm)" />
                <Line type="monotone" dataKey="co2" stroke="#8b5cf6" strokeWidth={2} dot={false} name="CO₂ (ppm)" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
 
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', height: '100%' }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: GREEN_DARK, mb: 2 }}>
              🏗️ État des bâtiments (IoT)
            </Typography>
            {batimentsData.map((b, i) => (
              <Box key={i} sx={{
                mb: 1.5, p: 2,
                borderRadius: '12px',
                background: b.statut === 'warning' ? '#fffbeb' : GREEN_GHOST,
                border: `1px solid ${b.statut === 'warning' ? '#fde68a' : GREEN_SOFT}`,
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: GREEN_DARK }}>
                    {b.nom}
                  </Typography>
                  <Chip
                    label={b.statut === 'warning' ? '⚠️ Attention' : '✅ Normal'}
                    size="small"
                    sx={{
                      fontSize: '0.65rem', height: 22, fontWeight: 700,
                      background: b.statut === 'warning' ? '#fef3c7' : GREEN_SOFT,
                      color: b.statut === 'warning' ? '#92400e' : GREEN_DARK,
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {[
                    { icon: '🌡️', label: 'Temp.', val: `${b.temperature}°C` },
                    { icon: '💧', label: 'Humidité', val: `${b.humidite}%` },
                    { icon: '🧪', label: 'NH₃', val: `${b.nh3} ppm` },
                  ].map((m, j) => (
                    <Box key={j} sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600 }}>{m.icon} {m.label}</Typography>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#374151' }}>{m.val}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
 
      {/* ── ALERTES ── */}
      <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', mb: 3 }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: GREEN_DARK, mb: 2 }}>
          🚨 Alertes récentes
        </Typography>
        {alertesData.map(a => (
          <Box key={a.id} sx={{
            display: 'flex', alignItems: 'center',
            p: 1.5, mb: 1, borderRadius: '10px',
            background: a.type === 'error' ? '#fef2f2' : a.type === 'warning' ? '#fffbeb' : '#eff6ff',
            border: `1px solid ${a.type === 'error' ? '#fecaca' : a.type === 'warning' ? '#fde68a' : '#bfdbfe'}`,
          }}>
            <Typography sx={{ flex: 1, fontSize: '0.84rem', color: '#374151' }}>
              {a.type === 'error' ? '❌' : a.type === 'warning' ? '⚠️' : 'ℹ️'} {a.message}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', whiteSpace: 'nowrap', ml: 2 }}>
              {a.temps}
            </Typography>
          </Box>
        ))}
      </Paper>
 
      <Divider sx={{ mb: 1.5 }} />
      <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', color: '#d1d5db' }}>
        📡 Données IoT en temps réel · 🕐 Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
      </Typography>
    </Box>
  );
}