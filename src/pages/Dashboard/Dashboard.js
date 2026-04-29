import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Box, Button, Alert, LinearProgress, Divider, Chip,
  useTheme, Avatar
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Thermostat, WaterDrop, Science, Co2, 
  Agriculture, Info, Warning, Error as ErrorIcon, Refresh
} from '@mui/icons-material';
import { getLots } from '../../services/firestore';
import { initDatabase } from '../../initDatabase';

// ── Animated Counter Component ──
function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue.toLocaleString('fr-FR')}</span>;
}

// ── Mini Sparkline for Stat Cards ──
function MiniSparkline({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data}>
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          fill={color} 
          fillOpacity={0.1} 
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Hero Stat Card ──
function HeroStatCard({ title, value, unit, trend, trendValue, icon, color, data }) {
  return (
    <Paper className="glass-card" sx={{
      p: 3,
      flex: 1,
      minWidth: 260,
      borderRadius: '24px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: `0 12px 24px rgba(0,0,0,0.4)`,
        borderColor: color,
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{
          p: 1,
          borderRadius: '12px',
          background: `rgba(${color === '#a3e635' ? '163, 230, 53' : color === '#3b82f6' ? '59, 130, 246' : '251, 191, 36'}, 0.1)`,
          color: color,
        }}>
          {icon}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mt: 0.5 }}>
            <AnimatedNumber value={value} />{unit}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {trend === 'up' ? <TrendingUp sx={{ fontSize: 16, color: '#a3e635' }} /> : <TrendingDown sx={{ fontSize: 16, color: '#f87171' }} />}
        <Typography variant="caption" sx={{ color: trend === 'up' ? '#a3e635' : '#f87171', fontWeight: 700 }}>
          {trendValue}%
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569' }}>
          vs semaine dernière
        </Typography>
      </Box>

      <MiniSparkline data={data} color={color} />
    </Paper>
  );
}

// ── IoT Sensor Card ──
function SensorCard({ icon, label, value, unit, status, color }) {
  return (
    <Paper className="glass-card" sx={{
      p: 2.5,
      borderRadius: '20px',
      textAlign: 'center',
      border: '1px solid rgba(148, 163, 184, 0.05)',
    }}>
      <Box sx={{ mb: 1, color: color }}>
        {icon}
      </Box>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', my: 1 }}>
        {value}<span style={{ fontSize: '0.9rem', color: '#64748b', marginLeft: '4px' }}>{unit}</span>
      </Typography>
      <Box sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: '20px',
        background: `rgba(${color === '#a3e635' ? '163, 230, 53' : '#ef4444' === color ? '239, 68, 68' : '251, 191, 36'}, 0.05)`,
      }}>
        <div className={`dot-glow ${status === 'ok' ? 'dot-success' : status === 'warn' ? 'dot-warning' : 'dot-error'}`} />
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: color }}>
          {status === 'ok' ? 'NORMAL' : status === 'warn' ? 'ATTENTION' : 'DANGER'}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function Dashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState({
    lotsActifs: 12,
    volailles: 8450,
    tauxSurvie: 98,
    consommation: 1240,
    temperature: 24.5,
    humidite: 55,
    nh3: 12,
    co2: 850,
  });
  const [initMessage, setInitMessage] = useState('');

  // Mock data for sparklines
  const sparklineData = Array.from({ length: 10 }, (_, i) => ({ value: Math.floor(Math.random() * 50) + 50 }));

  const productionData = [
    { jour: 'Lun', production: 4000, consommation: 2400 },
    { jour: 'Mar', production: 3000, consommation: 1398 },
    { jour: 'Mer', production: 2000, consommation: 9800 },
    { jour: 'Jeu', production: 2780, consommation: 3908 },
    { jour: 'Ven', production: 1890, consommation: 4800 },
    { jour: 'Sam', production: 2390, consommation: 3800 },
    { jour: 'Dim', production: 3490, consommation: 4300 },
  ];

  const alerts = [
    { id: 1, type: 'error', message: 'Température critique Bâtiment A: 32°C', time: '14:20' },
    { id: 2, type: 'warning', message: 'Stock aliment faible: 150kg', time: '12:05' },
    { id: 3, type: 'info', message: 'Vaccination programmée demain', time: '09:00' },
  ];

  useEffect(() => {
    loadDashboard();
  }, []);

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
    setInitMessage(success ? '✅ Base de données initialisée !' : "❌ Erreur");
    setTimeout(() => setInitMessage(''), 3000);
    if (success) loadDashboard();
  };

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800 }}>
            Tableau de bord
          </Typography>
          <Typography sx={{ color: '#64748b', mt: 0.5 }}>
            Surveillance en temps réel de votre exploitation SOTAVI
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboard}
            sx={{ borderColor: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' }}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            onClick={handleInitDB}
            sx={{ px: 3 }}
          >
            Initialiser la base
          </Button>
        </Box>
      </Box>

      {initMessage && <Alert severity="success" sx={{ mb: 4, borderRadius: '16px' }}>{initMessage}</Alert>}

      {/* ── Hero Stats ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <HeroStatCard 
            title="LOTS ACTIFS" 
            value={stats.lotsActifs} 
            unit="" 
            trend="up" 
            trendValue={12} 
            icon={<Agriculture />} 
            color="#a3e635" 
            data={sparklineData}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <HeroStatCard 
            title="VOLAILLES TOTALES" 
            value={stats.volailles} 
            unit="" 
            trend="up" 
            trendValue={5.2} 
            icon={<TrendingUp />} 
            color="#3b82f6" 
            data={sparklineData}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <HeroStatCard 
            title="TAUX DE SURVIE" 
            value={stats.tauxSurvie} 
            unit="%" 
            trend="up" 
            trendValue={0.4} 
            icon={<TrendingUp />} 
            color="#fbbf24" 
            data={sparklineData}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <HeroStatCard 
            title="CONSOMMATION (KG)" 
            value={stats.consommation} 
            unit="" 
            trend="down" 
            trendValue={2.1} 
            icon={<Science />} 
            color="#ef4444" 
            data={sparklineData}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ── Main Chart ── */}
        <Grid item xs={12} lg={8}>
          <Paper className="glass-card" sx={{ p: 4, borderRadius: '24px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                Performance de Production
              </Typography>
              <Chip label="7 DERNIERS JOURS" size="small" sx={{ bgcolor: 'rgba(163, 230, 53, 0.1)', color: '#a3e635', fontWeight: 700 }} />
            </Box>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={productionData}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.05)" vertical={false} />
                <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="production" stroke="#a3e635" strokeWidth={3} fillOpacity={1} fill="url(#colorProd)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* ── Sensors & Alerts ── */}
        <Grid item xs={12} lg={4}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', mb: 2, display: 'block' }}>
            CAPTEURS IOT (BÂTIMENT A)
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6}>
              <SensorCard icon={<Thermostat />} label="TEMP." value={stats.temperature} unit="°C" status="ok" color="#a3e635" />
            </Grid>
            <Grid item xs={6}>
              <SensorCard icon={<WaterDrop />} label="HUMIDITÉ" value={stats.humidite} unit="%" status="warn" color="#fbbf24" />
            </Grid>
            <Grid item xs={6}>
              <SensorCard icon={<Science />} label="NH₃" value={stats.nh3} unit="ppm" status="ok" color="#a3e635" />
            </Grid>
            <Grid item xs={6}>
              <SensorCard icon={<Co2 />} label="CO₂" value={stats.co2} unit="ppm" status="ok" color="#a3e635" />
            </Grid>
          </Grid>

          <Paper className="glass-card" sx={{ p: 3, borderRadius: '24px' }}>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>
              Alertes Récentes
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {alerts.map(alert => (
                <Box key={alert.id} sx={{ display: 'flex', gap: 2, p: 2, borderRadius: '16px', background: 'rgba(30, 41, 59, 0.4)' }}>
                  <Box sx={{ 
                    p: 1, height: 'fit-content', borderRadius: '10px', 
                    bgcolor: alert.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                    color: alert.type === 'error' ? '#f87171' : '#fbbf24'
                  }}>
                    {alert.type === 'error' ? <ErrorIcon /> : alert.type === 'warning' ? <Warning /> : <Info />}
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 600 }}>{alert.message}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Aujourd'hui, {alert.time}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}