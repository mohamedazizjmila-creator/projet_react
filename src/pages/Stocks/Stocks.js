import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Chip, Typography, Tooltip, useTheme, Grid
} from '@mui/material';
import { Add, Edit, Delete, AddCircle, RemoveCircle, Inventory, Refresh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { getStocks, addStock, updateStock, deleteStock } from '../../services/firestore';

// ── Small chicken for decoration ─────────────────────────────────────────────
function ChickenSmall({ size = 20, color = '#a3e635' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="40" rx="18" ry="14" fill={color} opacity="0.9"/>
      <circle cx="44" cy="22" r="10" fill={color} opacity="0.9"/>
      <path d="M41 13 Q43 8 45 13 Q47 7 49 13" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M53 23 L58 21 L53 25 Z" fill="#f59e0b"/>
      <circle cx="47" cy="21" r="2" fill="#0f172a"/>
      <ellipse cx="52" cy="26" rx="2.5" ry="3.5" fill="#ef4444" opacity="0.9"/>
    </svg>
  );
}

// ── Stat card component ──────────────────────────────────────────────────────
function StatCard({ value, label, icon, active }) {
  const theme = useTheme();
  return (
    <Box sx={{
      flex: 1, minWidth: 160,
      p: 2.5, borderRadius: '20px',
      background: active
        ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
        : theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: active ? `0 8px 24px ${theme.palette.primary.main}20` : 'none',
    }}>
      <Typography sx={{ fontSize: '1.2rem', mb: 0.5 }}>{icon}</Typography>
      <Typography sx={{
        fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.1,
        color: active ? '#fff' : 'text.primary',
      }}>
        {value}
      </Typography>
      <Typography sx={{
        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: active ? 'rgba(255,255,255,0.7)' : 'text.secondary',
        mt: 0.5,
      }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function Stocks() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { settings } = useSettings();
  const [stocks, setStocks] = useState([]);
  const [open, setOpen] = useState(false);
  const [openMouvement, setOpenMouvement] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [mouvementType, setMouvementType] = useState('entree');
  const [mouvementQuantite, setMouvementQuantite] = useState('');
  const [mouvementRaison, setMouvementRaison] = useState('');
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    quantite: '',
    seuilAlerte: '',
    unite: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStocks = useCallback(async () => {
    try {
      const data = await getStocks();
      setStocks(data);
    } catch (err) {
      console.error("Erreur chargement stocks:", err);
    }
  }, []);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!formData.nom || !formData.quantite) {
      setError(t('Name and quantity required'));
      return;
    }

    try {
      if (editing) {
        await updateStock(editing.id, {
          nom: formData.nom,
          quantite: parseFloat(formData.quantite),
          seuilAlerte: parseFloat(formData.seuilAlerte) || 0,
          unite: formData.unite
        });
        setSuccess(t('Product updated'));
      } else {
        await addStock({
          nom: formData.nom,
          quantite: parseFloat(formData.quantite),
          seuilAlerte: parseFloat(formData.seuilAlerte) || 0,
          unite: formData.unite
        });
        setSuccess(t('Product added'));
      }
      
      setOpen(false);
      setEditing(null);
      setFormData({ nom: '', quantite: '', seuilAlerte: '', unite: '' });
      loadStocks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (stock) => {
    if (window.confirm(t('Delete product confirmation', { name: stock.nom }))) {
      try {
        await deleteStock(stock.id);
        setSuccess(t('Product deleted'));
        loadStocks();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleMouvement = async () => {
    setError('');
    
    const quantite = parseFloat(mouvementQuantite);
    if (isNaN(quantite) || quantite <= 0) {
      setError(t('Invalid quantity'));
      return;
    }

    let nouvelleQuantite;
    if (mouvementType === 'entree') {
      nouvelleQuantite = selectedStock.quantite + quantite;
    } else {
      if (selectedStock.quantite < quantite) {
        setError(t('Insufficient stock', { count: selectedStock.quantite, unit: selectedStock.unite }));
        return;
      }
      nouvelleQuantite = selectedStock.quantite - quantite;
    }

    try {
      await updateStock(selectedStock.id, {
        ...selectedStock,
        quantite: nouvelleQuantite
      });
      
      setSuccess(t('Mouvement success', { 
        type: mouvementType === 'entree' ? t('In') : t('Out'),
        count: quantite,
        unit: selectedStock.unite
      }));
      setOpenMouvement(false);
      setMouvementQuantite('');
      setMouvementRaison('');
      loadStocks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const isLowStock = (quantite, seuil) => {
    return quantite <= seuil;
  };

  const openMouvementDialog = (stock, type) => {
    setSelectedStock(stock);
    setMouvementType(type);
    setMouvementQuantite('');
    setMouvementRaison('');
    setOpenMouvement(true);
  };

  const totalProduits = stocks.length;
  const produitsFaibles = stocks.filter(s => isLowStock(s.quantite, s.seuilAlerte)).length;
  const valeurStockTotal = stocks.reduce((sum, s) => sum + (Number(s.quantite) || 0), 0);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800 }}>
            {t('Stock Management')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('Stock Subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title={t('Refresh')}>
            <IconButton
              onClick={loadStocks}
              sx={{
                background: 'rgba(163, 230, 53, 0.1)',
                borderRadius: '12px',
                color: theme.palette.primary.main,
                '&:hover': { background: 'rgba(163, 230, 53, 0.2)' },
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ px: 3, py: 1.2, borderRadius: '12px' }}
          >
            {t('New Product')}
          </Button>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '16px' }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }}>
          {error}
        </Alert>
      )}

      {/* ── Summary cards ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard value={totalProduits} label={t('Total products')} icon="📦" active={true} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard value={produitsFaibles} label={t('Alert products')} icon="⚠️" active={false} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard value={valeurStockTotal.toLocaleString()} label={t('Total quantity')} icon="📊" active={false} />
        </Grid>
      </Grid>

      {/* ── Table ── */}
      <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: '24px', overflow: 'hidden' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{t('Product')}</TableCell>
              <TableCell>{t('Quantity')}</TableCell>
              <TableCell>{t('Unit')}</TableCell>
              <TableCell>{t('Alert threshold')}</TableCell>
              <TableCell>{t('Status')}</TableCell>
              <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>{t('ACTIONS')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {stocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                    <Inventory sx={{ fontSize: 48, mb: 2, color: 'text.secondary', opacity: 0.5 }} />
                    <Typography sx={{ color: 'text.secondary' }}>{t('No product in stock')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                stocks.map((stock, idx) => {
                  const lowStock = isLowStock(stock.quantite, stock.seuilAlerte);
                  return (
                    <TableRow
                      key={stock.id}
                      component={motion.tr}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      sx={{ 
                        '&:hover': { bgcolor: 'rgba(163, 230, 53, 0.04)' },
                        bgcolor: lowStock ? 'rgba(239, 68, 68, 0.03)' : 'transparent'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <ChickenSmall size={24} color={theme.palette.primary.main} />
                          <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {stock.nom}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, color: lowStock ? theme.palette.error.main : 'text.primary' }}>
                          {stock.quantite.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>{stock.unite || '-'}</TableCell>
                      <TableCell>{stock.seuilAlerte || 0} {stock.unite}</TableCell>
                      <TableCell>
                        <Chip 
                          label={lowStock ? t('Low Stock') : t('OK')} 
                          color={lowStock ? 'error' : 'success'}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: settings.language === 'ar' ? 'flex-start' : 'flex-end' }}>
                          <Tooltip title={t('Add to stock')}>
                            <IconButton
                              size="small"
                              onClick={() => openMouvementDialog(stock, 'entree')}
                              sx={{ color: theme.palette.success.main }}
                            >
                              <AddCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={t('Remove from stock')}>
                            <IconButton
                              size="small"
                              onClick={() => openMouvementDialog(stock, 'sortie')}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <RemoveCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={t('Edit')}>
                            <IconButton
                              size="small"
                              onClick={() => { 
                                setEditing(stock); 
                                setFormData({
                                  nom: stock.nom,
                                  quantite: stock.quantite,
                                  seuilAlerte: stock.seuilAlerte,
                                  unite: stock.unite || ''
                                }); 
                                setOpen(true);
                              }}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={t('Delete')}>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(stock)}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Dialogue d'ajout/modification ── */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'glass-card',
          sx: { borderRadius: '24px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>
          {editing ? t('Edit Product') : t('New Product')}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth 
            label={t('Product Name')} 
            margin="normal"
            value={formData.nom} 
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
          <TextField
            fullWidth 
            label={t('Quantity')} 
            type="number" 
            margin="normal"
            value={formData.quantite} 
            onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
            required
          />
          <TextField
            fullWidth 
            label={t('Unit')} 
            margin="normal"
            value={formData.unite} 
            onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
            placeholder="kg, l, doses..."
          />
          <TextField
            fullWidth 
            label={t('Alert threshold')} 
            type="number" 
            margin="normal"
            value={formData.seuilAlerte} 
            onChange={(e) => setFormData({ ...formData, seuilAlerte: e.target.value })}
            helperText={t('Alert threshold helper')}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
            {t('Cancel')}
          </Button>
          <Button variant="contained" onClick={handleSave}>
            {t('Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialogue pour les mouvements ── */}
      <Dialog
        open={openMouvement}
        onClose={() => setOpenMouvement(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          className: 'glass-card',
          sx: { borderRadius: '24px', p: 1 }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 800, 
          color: mouvementType === 'entree' ? theme.palette.success.main : theme.palette.error.main 
        }}>
          {mouvementType === 'entree' ? t('Add to stock') : t('Remove from stock')}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ p: 2, mb: 2, borderRadius: '12px', bgcolor: 'rgba(163, 230, 53, 0.05)', border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {selectedStock?.nom}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('Quantity')}: {selectedStock?.quantite} {selectedStock?.unite}
            </Typography>
          </Box>
          
          <TextField
            fullWidth 
            label={t('Quantity')} 
            type="number" 
            margin="normal"
            value={mouvementQuantite}
            onChange={(e) => setMouvementQuantite(e.target.value)}
            required
            autoFocus
          />
          <TextField
            fullWidth 
            label={t('Reason (optional)')} 
            margin="normal"
            value={mouvementRaison}
            onChange={(e) => setMouvementRaison(e.target.value)}
            placeholder={mouvementType === 'entree' ? t('Reason placeholder in') : t('Reason placeholder out')}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpenMouvement(false)} sx={{ color: 'text.secondary' }}>
            {t('Cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleMouvement}
            color={mouvementType === 'entree' ? 'success' : 'error'}
          >
            {mouvementType === 'entree' ? t('In') : t('Out')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}