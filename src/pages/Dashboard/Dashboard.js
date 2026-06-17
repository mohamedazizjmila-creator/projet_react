import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Box, Button, Alert, Chip,
  useTheme
} from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, animate } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Thermostat, WaterDrop, Science, Co2, 
  Agriculture, Info, Warning, Error as ErrorIcon, Refresh
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getLots } from '../../services/firestore';
import { initDatabase } from '../../initDatabase';
import { useSettings } from '../../contexts/SettingsContext';

// ── Animated Counter Component ──
function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0);
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings.animations) {
      setDisplayValue(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 2,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
    });
    return () => controls.stop();
  }, [value, settings.animations]);

  return <span>{displayValue.toLocaleString()}</span>;
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
  const { settings } = useSettings();
  const { t } = useTranslation();
  
  return (
    <Paper className="glass-card" sx={{
      p: 3,
      flex: 1,
      minWidth: 260,
      borderRadius: '24px',
      position: 'relative',
      overflow: 'hidden',
      transition: settings.animations ? 'all 0.3s ease' : 'none',
      '&:hover': {
        transform: settings.animations ? 'translateY(-5px)' : 'none',
        boxShadow: `0 12px 24px rgba(0,0,0,0.2)`,
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
        <Box sx={{ textAlign: settings.language === 'ar' ? 'left' : 'right' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
            <AnimatedNumber value={value} />{unit}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {trend === 'up' ? <TrendingUp sx={{ fontSize: 16, color: '#a3e635' }} /> : <TrendingDown sx={{ fontSize: 16, color: '#f87171' }} />}
        <Typography variant="caption" sx={{ color: trend === 'up' ? '#a3e635' : '#f87171', fontWeight: 700 }}>
          {trendValue}%
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7 }}>
          {t('vs last week')}
        </Typography>
      </Box>

      <MiniSparkline data={data} color={color} />
    </Paper>
  );
}

// ── IoT Sensor Card ──
function SensorCard({ icon, label, value, unit, status, color }) {
  const { t } = useTranslation();
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
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', my: 1 }}>
        {value}<span style={{ fontSize: '0.9rem', color: '#64748b', marginLeft: '4px' }}>{unit}</span>
      </Typography>
      <Box sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: '20px',
        background: `${color}10`,
      }}>
        <div className={`dot-glow ${status === 'ok' ? 'dot-success' : status === 'warn' ? 'dot-warning' : 'dot-error'}`} />
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: color }}>
          {status === 'ok' ? t('Normal') : status === 'warn' ? t('Attention') : t('Danger')}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { settings } = useSettings();
  const [stats, setStats] = useState({
    lotsActifs: 0,
    volailles: 0,
    tauxSurvie: 0,
    consommation: 0,
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
      
      // Calcul du nombre total de volailles actives
      const totalVolailles = actifs.reduce((sum, lot) => sum + (Number(lot.nbInitial) || 0), 0);
      
      // Calcul du taux de survie moyen (simulé pour l'exemple)
      // Idéalement, vous devriez calculer cela à partir des données réelles
      const tauxSurvieMoyen = actifs.length > 0 ? 98 : 0;
      
      // Calcul de la consommation totale (simulée)
      const consommationTotale = actifs.length > 0 ? 1240 : 0;
      
      setStats(prev => ({ 
        ...prev, 
        lotsActifs: actifs.length || 0,
        volailles: totalVolailles || 0,
        tauxSurvie: tauxSurvieMoyen,
        consommation: consommationTotale
      }));
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      // En cas d'erreur, garder les valeurs par défaut
      setStats(prev => ({
        ...prev,
        lotsActifs: 0,
        volailles: 0,
        tauxSurvie: 0,
        consommation: 0
      }));
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800 }}>
            {t('Dashboard')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('Real-time monitoring')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboard}
            sx={{ borderColor: theme.palette.divider, color: 'text.secondary' }}
          >
            {t('Refresh')}
          </Button>
          <Button
            variant="contained"
            onClick={handleInitDB}
            sx={{ px: 3 }}
          >
            {t('Initialize DB')}
          </Button>
        </Box>
      </Box>

      {initMessage && <Alert severity="success" sx={{ mb: 4, borderRadius: '16px' }}>{initMessage}</Alert>}

      {/* ── Hero Stats ── */}
      <Grid container spacing={settings.compactMode ? 2 : 3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <HeroStatCard 
            title={t('Active Lots')} 
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
            title={t('Total Poultry')} 
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
            title={t('Survival Rate')} 
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
            title={t('Consumption')} 
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

      <Grid container spacing={settings.compactMode ? 2 : 3}>
        {/* ── Main Chart ── */}
        <Grid item xs={12} lg={8}>
          <Paper className="glass-card" sx={{ p: 4, borderRadius: '24px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
                {t('Production Performance')}
              </Typography>
              <Chip label={t('Last 7 Days')} size="small" sx={{ bgcolor: 'rgba(163, 230, 53, 0.1)', color: '#a3e635', fontWeight: 700 }} />
            </Box>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={productionData}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} orientation={settings.language === 'ar' ? 'right' : 'left'} />
                <Tooltip 
                  contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}
                  itemStyle={{ color: theme.palette.text.primary }}
                />
                <Area type="monotone" dataKey="production" stroke="#a3e635" strokeWidth={3} fillOpacity={1} fill="url(#colorProd)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* ── Sensors & Alerts ── */}
        <Grid item xs={12} lg={4}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', mb: 2, display: 'block' }}>
            {t('IoT Sensors')}
          </Typography>
          <Grid container spacing={settings.compactMode ? 1 : 2} sx={{ mb: 4 }}>
            <Grid item xs={6}>
              <SensorCard icon={<Thermostat />} label={t('Temperature')} value={stats.temperature} unit="°C" status="ok" color="#a3e635" />
            </Grid>
            <Grid item xs={6}>
              <SensorCard icon={<WaterDrop />} label={t('Humidity')} value={stats.humidite} unit="%" status="warn" color="#fbbf24" />
            </Grid>
            <Grid item xs={6}>
              <SensorCard icon={<Science />} label="NH₃" value={stats.nh3} unit="ppm" status="ok" color="#a3e635" />
            </Grid>
            <Grid item xs={6}>
              <SensorCard icon={<Co2 />} label="CO₂" value={stats.co2} unit="ppm" status="ok" color="#a3e635" />
            </Grid>
          </Grid>

          <Paper className="glass-card" sx={{ p: 3, borderRadius: '24px' }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, mb: 3 }}>
              {t('Recent Alerts')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {alerts.map(alert => (
                <Box key={alert.id} sx={{ display: 'flex', gap: 2, p: 2, borderRadius: '16px', background: `${theme.palette.background.default}80` }}>
                  <Box sx={{ 
                    p: 1, height: 'fit-content', borderRadius: '10px', 
                    bgcolor: alert.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                    color: alert.type === 'error' ? '#f87171' : '#fbbf24'
                  }}>
                    {alert.type === 'error' ? <ErrorIcon /> : alert.type === 'warning' ? <Warning /> : <Info />}
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>{alert.message}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Aujourd'hui, {alert.time}</Typography>
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