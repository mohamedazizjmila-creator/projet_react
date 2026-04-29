import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Alert, Typography,
  Grid, Chip, useTheme
} from '@mui/material';
import { Add, Inventory, Warning } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getLots, addProduction, getProduction, getStocks, updateStock, getBatiments } from '../../services/firestore';
import { useSettings } from '../../contexts/SettingsContext';

function StatCard({ value, label, icon, active }) {
  const theme = useTheme();
  return (
    <Box sx={{
      flex: 1, minWidth: 140, p: 2, borderRadius: '16px',
      background: active ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` : theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: active ? `0 8px 20px ${theme.palette.primary.main}20` : 'none',
      backdropFilter: 'blur(8px)',
    }}>
      <Typography sx={{ fontSize: '1.2rem', mb: 0.5 }}>{icon}</Typography>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: active ? '#fff' : 'text.primary' }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: active ? 'rgba(255,255,255,0.7)' : 'text.secondary', mt: 0.3, letterSpacing: '0.05em' }}>{label}</Typography>
    </Box>
  );
}

export default function Production() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { settings } = useSettings();
  const [lots, setLots] = useState([]);
  const [batiments, setBatiments] = useState([]);
  const [selectedLot, setSelectedLot] = useState('');
  const [selectedLotDetails, setSelectedLotDetails] = useState(null);
  const [productions, setProductions] = useState([]);
  const [stockActuel, setStockActuel] = useState(0);
  const [stockInfo, setStockInfo] = useState(null);
  const [formData, setFormData] = useState({ mortalite: '', consommationAliment: '', productionOeufs: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [totalConsommation, setTotalConsommation] = useState(0);
  const [totalMortalite, setTotalMortalite] = useState(0);
  const [totalOeufs, setTotalOeufs] = useState(0);

  useEffect(() => {
    loadLots();
    loadBatiments();
    loadStock();
  }, []);

  useEffect(() => {
    if (selectedLot) {
      loadProductions();
      const lot = lots.find(l => l.id === selectedLot);
      setSelectedLotDetails(lot);
    }
  }, [selectedLot, lots]);

  useEffect(() => {
    const totalCons = productions.reduce((sum, p) => sum + (p.consommationAliment || 0), 0);
    const totalMort = productions.reduce((sum, p) => sum + (p.mortalite || 0), 0);
    const totalOeuf = productions.reduce((sum, p) => sum + (p.productionOeufs || 0), 0);
    setTotalConsommation(totalCons);
    setTotalMortalite(totalMort);
    setTotalOeufs(totalOeuf);
  }, [productions]);

  const loadLots = async () => {
    const data = await getLots();
    setLots(data.filter(l => l.statut === 'actif'));
  };

  const loadBatiments = async () => {
    const data = await getBatiments();
    setBatiments(data);
  };

  const loadProductions = async () => {
    const data = await getProduction(selectedLot);
    setProductions(data);
  };

  const loadStock = async () => {
    try {
      const stocks = await getStocks();
      const stockAliment = stocks.find(s => s.nom?.includes("Aliment"));
      if (stockAliment) {
        setStockActuel(stockAliment.quantite);
        setStockInfo(stockAliment);
      }
    } catch (err) {
      console.error("Erreur chargement stock:", err);
    }
  };

  const getBatimentNom = (batimentId) => {
    if (!batimentId) return t('Inactive');
    const batiment = batiments.find(b => b.id === batimentId);
    return batiment ? batiment.nom : batimentId;
  };

  const isPondeuse = () => {
    const type = selectedLotDetails?.typeVolailles?.toLowerCase() || '';
    return type.includes('pondeuse') || type.includes('œuf') || type.includes('oeuf') || type.includes('layer');
  };

  const diminuerStockAliment = async (quantiteConsommee) => {
    try {
      const stocks = await getStocks();
      const stockAliment = stocks.find(s => s.nom?.includes("Aliment"));
      
      if (!stockAliment) {
        setError(t('Feed stock not found'));
        return false;
      }
      
      if (stockAliment.quantite < quantiteConsommee) {
        setError(t('Insufficient stock', { count: stockAliment.quantite, unit: stockAliment.unite || 'kg' }));
        return false;
      }
      
      const nouvelleQuantite = stockAliment.quantite - quantiteConsommee;
      await updateStock(stockAliment.id, { ...stockAliment, quantite: nouvelleQuantite });
      setStockActuel(nouvelleQuantite);
      return true;
    } catch (err) {
      setError(t('Error saving'));
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedLot) {
      setError(t('Batch required'));
      return;
    }
    
    const quantiteAliment = parseInt(formData.consommationAliment);
    const mortaliteValue = parseInt(formData.mortalite);
    const productionOeufsValue = parseInt(formData.productionOeufs);
    
    if (isNaN(quantiteAliment) || quantiteAliment <= 0) {
      setError(t('Invalid feed quantity'));
      return;
    }
    
    if (isNaN(mortaliteValue) || mortaliteValue < 0) {
      setError(t('Invalid mortality'));
      return;
    }
    
    if (isPondeuse() && (isNaN(productionOeufsValue) || productionOeufsValue < 0)) {
      setError(t('Invalid egg production'));
      return;
    }
    
    const stockOk = await diminuerStockAliment(quantiteAliment);
    if (!stockOk) return;
    
    const productionData = {
      mortalite: mortaliteValue,
      consommationAliment: quantiteAliment,
      date: new Date()
    };
    
    if (isPondeuse()) {
      productionData.productionOeufs = productionOeufsValue;
    }
    
    await addProduction(selectedLot, productionData);
    
    setSuccess(t('Data recorded', { count: stockActuel - quantiteAliment, unit: stockInfo?.unite || 'kg' }));
    setFormData({ mortalite: '', consommationAliment: '', productionOeufs: '' });
    loadProductions();
    
    setTimeout(() => setSuccess(''), 4000);
  };

  const joursElevage = selectedLotDetails?.dateArrivee?.toDate 
    ? Math.floor((new Date() - selectedLotDetails.dateArrivee.toDate()) / (1000 * 60 * 60 * 24))
    : 0;

  const isStockFaible = stockActuel < 200;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800 }}>{t('Production Tracking')}</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>{t('Production Subtitle')}</Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5, 
          borderRadius: '16px', 
          bgcolor: isStockFaible ? 'rgba(251, 191, 36, 0.1)' : 'rgba(163, 230, 53, 0.1)',
          border: `1px solid ${isStockFaible ? '#fbbf24' : '#a3e635'}40`
        }}>
          <Inventory sx={{ color: isStockFaible ? '#fbbf24' : '#a3e635' }} />
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>{t('Feed Stock')}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
              {stockActuel} {stockInfo?.unite || 'kg'}
            </Typography>
          </Box>
          {isStockFaible && <Warning sx={{ color: '#fbbf24' }} />}
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '16px' }}>{success}</Alert>}

      <Paper className="glass-card" sx={{ p: 3, mb: 4, borderRadius: '24px' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.1em' }}>{t('Select Batch')}</Typography>
        <TextField 
          select fullWidth 
          label={t('Active Batch')} 
          value={selectedLot} 
          onChange={(e) => setSelectedLot(e.target.value)}
        >
          {lots.length === 0 ? (
            <MenuItem disabled>{t('No active batch')}</MenuItem>
          ) : (
            lots.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {t('Batch info', { 
                  date: l.dateArrivee?.toDate?.().toLocaleDateString() || l.dateArrivee || 'N/A',
                  batiment: getBatimentNom(l.batimentId),
                  count: l.nbInitial,
                  type: l.typeVolailles ? `(${l.typeVolailles})` : ''
                })}
              </MenuItem>
            ))
          )}
        </TextField>
      </Paper>

      {selectedLot && selectedLotDetails && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={5}>
              <Paper className="glass-card" sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: 'rgba(163, 230, 53, 0.03)' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, display: 'block', letterSpacing: '0.1em' }}>{t('BATCH INFORMATION')}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{t('Building')}:</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{getBatimentNom(selectedLotDetails.batimentId)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{t('Initial Number')}:</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{selectedLotDetails.nbInitial} {t('subjects')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{t('TYPE')}:</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{selectedLotDetails.typeVolailles || t('Standard')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{t('Arrival Date')}:</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{selectedLotDetails.dateArrivee?.toDate?.().toLocaleDateString() || selectedLotDetails.dateArrivee || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{t('Breeding Days')}:</Typography>
                    <Chip label={t('count_days', { count: joursElevage })} size="small" sx={{ bgcolor: 'rgba(163, 230, 53, 0.1)', color: '#a3e635', fontWeight: 800 }} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={7}>
              <Box sx={{ display: 'flex', gap: 2, height: '100%', flexDirection: { xs: 'column', sm: 'row' } }}>
                <StatCard value={totalMortalite} label={t('Total Mortality')} icon="📉" active={false} />
                <StatCard value={`${totalConsommation} kg`} label={t('Feed Consumed')} icon="🌾" active={false} />
                {isPondeuse() && <StatCard value={totalOeufs} label={t('Eggs Produced')} icon="🥚" active={false} />}
              </Box>
            </Grid>
          </Grid>

          <Paper className="glass-card" sx={{ p: 4, mb: 4, borderRadius: '24px' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 3 }}>{t('Daily Recording')}</Typography>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={isPondeuse() ? 4 : 6}>
                  <TextField fullWidth label={t('Mortality of the day')} type="number" value={formData.mortalite} onChange={(e) => setFormData({ ...formData, mortalite: e.target.value })} required />
                </Grid>
                <Grid item xs={12} sm={isPondeuse() ? 4 : 6}>
                  <TextField fullWidth label={t('Feed consumption (kg)')} type="number" value={formData.consommationAliment} onChange={(e) => setFormData({ ...formData, consommationAliment: e.target.value })} required />
                </Grid>
                {isPondeuse() && (
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label={t('Egg production')} type="number" value={formData.productionOeufs} onChange={(e) => setFormData({ ...formData, productionOeufs: e.target.value })} required helperText={t('Egg production helper')} />
                  </Grid>
                )}
              </Grid>
              <Button type="submit" variant="contained" size="large" sx={{ mt: 4, px: 4, py: 1.5, borderRadius: '14px', fontWeight: 800 }}>{t('Save Data')}</Button>
            </form>
          </Paper>

          {productions.length > 0 && (
            <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: '24px', overflow: 'hidden' }}>
              <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>{t('Recording History')}</Typography>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Date')}</TableCell>
                    <TableCell align="center">{t('Total Mortality')}</TableCell>
                    <TableCell align="center">{t('Feed Consumed')}</TableCell>
                    {isPondeuse() && <TableCell align="center">{t('Eggs Produced')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productions.map((p, idx) => (
                    <TableRow key={p.id}>
                      <TableCell sx={{ color: 'text.secondary' }}>{p.date?.toDate?.().toLocaleDateString() || p.date}</TableCell>
                      <TableCell align="center">
                        <Chip label={p.mortalite} size="small" sx={{ 
                          bgcolor: p.mortalite > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(163, 230, 53, 0.1)', 
                          color: p.mortalite > 0 ? '#f87171' : '#a3e635', 
                          fontWeight: 800 
                        }} />
                      </TableCell>
                      <TableCell align="center"><Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{p.consommationAliment} kg</Typography></TableCell>
                      {isPondeuse() && <TableCell align="center"><Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{p.productionOeufs || '-'}</Typography></TableCell>}
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'rgba(163, 230, 53, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>{t('TOTAL')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: 'text.primary' }}>{totalMortalite}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: 'text.primary' }}>{totalConsommation} kg</TableCell>
                    {isPondeuse() && <TableCell align="center" sx={{ fontWeight: 800, color: 'text.primary' }}>{totalOeufs}</TableCell>}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
}