import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Typography, Chip, Tooltip, MenuItem,
  useTheme, Grid
} from '@mui/material';
import { Add, Edit, Delete, CheckCircle, Cancel } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { getLots, addLot, updateLot, deleteLot, getBatiments } from '../../services/firestore';
import { useSettings } from '../../contexts/SettingsContext';

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

export default function Lots() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { settings } = useSettings();
  const [lots, setLots] = useState([]);
  const [batiments, setBatiments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ 
    batimentId: '', 
    nbInitial: '', 
    dateArrivee: '', 
    typeVolailles: '',
    statut: 'actif'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadLots();
    loadBatiments();
  }, []);

  const loadLots = async () => {
    const data = await getLots();
    setLots(data);
  };

  const loadBatiments = async () => {
    const data = await getBatiments();
    setBatiments(data);
  };

  const handleSave = async () => {
    if (!formData.batimentId || !formData.nbInitial) {
      setError(t('Batch requirements'));
      return;
    }
    try {
      if (editing) {
        await updateLot(editing.id, formData);
        setSuccess(t('Batch updated'));
      } else {
        await addLot(formData);
        setSuccess(t('Batch added'));
      }
      setOpen(false);
      setEditing(null);
      setFormData({ batimentId: '', nbInitial: '', dateArrivee: '', typeVolailles: '', statut: 'actif' });
      loadLots();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('Delete batch confirmation'))) {
      await deleteLot(id);
      setSuccess(t('Batch deleted'));
      loadLots();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleChangeStatut = async (lot, nouveauStatut) => {
    const message = nouveauStatut === 'termine' 
      ? t('Close confirmation') 
      : t('Reopen confirmation');
    
    if (window.confirm(message)) {
      try {
        await updateLot(lot.id, { ...lot, statut: nouveauStatut });
        setSuccess(nouveauStatut === 'termine' ? t('Batch closed') : t('Batch reopened'));
        loadLots();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getStatutColor = (statut) => {
    switch(statut) {
      case 'actif': return 'success';
      case 'termine': return 'default';
      default: return 'warning';
    }
  };

  const getStatutText = (statut) => {
    switch(statut) {
      case 'actif': return t('Active Status');
      case 'termine': return t('Finished Status');
      default: return statut;
    }
  };

  const getBatimentNom = (batimentId) => {
    const batiment = batiments.find(b => b.id === batimentId);
    return batiment ? batiment.nom : batimentId;
  };

  const lotsActifsCount = lots.filter(l => l.statut === 'actif').length;
  const lotsTerminesCount = lots.filter(l => l.statut === 'termine').length;
  const totalVolaillesCount = lots
    .filter(l => l.statut === 'actif')
    .reduce((sum, l) => sum + (Number(l.nbInitial) || 0), 0);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800 }}>
            {t('Batch Management')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('Manage Batches')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
          sx={{ px: 3, py: 1.2, borderRadius: '12px' }}
        >
          {t('New Batch')}
        </Button>
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
      <Grid container spacing={settings.compactMode ? 1.5 : 2} sx={{ mb: 4 }}>
        {[
          { label: t('Active Batches'), value: lotsActifsCount, icon: '✅', color: theme.palette.primary.main },
          { label: t('Finished Batches'), value: lotsTerminesCount, icon: '📌', color: theme.palette.text.secondary },
          { label: t('Poultry in breeding'), value: totalVolaillesCount.toLocaleString(), icon: '🐔', color: '#3b82f6' },
          { label: t('Total Batches'), value: lots.length, icon: '📊', color: '#fbbf24' },
        ].map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper className="glass-card" sx={{
              p: 2.5, borderRadius: '20px',
              border: i === 0 ? `1px solid ${theme.palette.primary.main}40` : '1px solid rgba(148, 163, 184, 0.1)',
              background: i === 0 ? `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, transparent 100%)` : 'transparent',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Typography sx={{ fontSize: '1.2rem' }}>{c.icon}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {c.label}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {c.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Table ── */}
      <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: '24px', overflow: 'hidden' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{t('Building')}</TableCell>
              <TableCell>{t('Initial Nb')}</TableCell>
              <TableCell>{t('Arrival Date')}</TableCell>
              <TableCell>{t('TYPE')}</TableCell>
              <TableCell>{t('STATUS')}</TableCell>
              <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>{t('ACTIONS')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {lots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                    <Typography sx={{ color: 'text.secondary' }}>{t('No batch found')}</Typography>
                  </TableCell>
                </TableRow>
              ) : lots.map((lot, idx) => (
                <TableRow
                  key={lot.id}
                  component={motion.tr}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  sx={{ 
                    '&:hover': { bgcolor: 'rgba(163, 230, 53, 0.04)' },
                    opacity: lot.statut === 'termine' ? 0.6 : 1,
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: '10px',
                        bgcolor: 'rgba(163, 230, 53, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ChickenSmall size={20} color={theme.palette.primary.main} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {getBatimentNom(lot.batimentId)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {Number(lot.nbInitial).toLocaleString()}
                      <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', ml: 0.5 }}>
                        {t('subjects')}
                      </Typography>
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {lot.dateArrivee?.toDate?.().toLocaleDateString() || lot.dateArrivee || '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lot.typeVolailles || t('Standard')}
                      size="small"
                      sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 700, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatutText(lot.statut)} 
                      color={getStatutColor(lot.statut)}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: settings.language === 'ar' ? 'flex-start' : 'flex-end' }}>
                      <Tooltip title={t('Edit')}>
                        <IconButton 
                          size="small"
                          onClick={() => { 
                            setEditing(lot); 
                            setFormData({ 
                              ...lot, 
                              dateArrivee: lot.dateArrivee?.toDate?.().toISOString().split('T')[0] || lot.dateArrivee || '' 
                            }); 
                            setOpen(true);
                          }}
                          disabled={lot.statut === 'termine'}
                          sx={{ color: theme.palette.primary.main }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={lot.statut === 'actif' ? t('Close confirmation') : t('Reopen confirmation')}>
                        <IconButton 
                          size="small"
                          onClick={() => handleChangeStatut(lot, lot.statut === 'actif' ? 'termine' : 'actif')}
                          sx={{ color: lot.statut === 'actif' ? '#16a34a' : '#f59e0b' }}
                        >
                          {lot.statut === 'actif' ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={t('Delete')}>
                        <IconButton 
                          size="small"
                          onClick={() => handleDelete(lot.id)}
                          sx={{ color: '#ef4444' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Dialog ── */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          className: 'glass-card',
          sx: { borderRadius: '24px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>
          {editing ? t('Edit') + ' ' + t('Lots') : t('New Batch')}
        </DialogTitle>

        <DialogContent>
          <TextField
            select
            fullWidth
            label={t('Building')}
            margin="normal"
            value={formData.batimentId}
            onChange={(e) => setFormData({ ...formData, batimentId: e.target.value })}
          >
            {batiments.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.nom}</MenuItem>
            ))}
          </TextField>
          
          <TextField 
            fullWidth 
            label={t('Initial Number')} 
            type="number" 
            margin="normal"
            value={formData.nbInitial} 
            onChange={(e) => setFormData({ ...formData, nbInitial: e.target.value })}
          />
          
          <TextField 
            fullWidth 
            label={t('Arrival Date')} 
            type="date" 
            margin="normal"
            value={formData.dateArrivee} 
            onChange={(e) => setFormData({ ...formData, dateArrivee: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField 
            fullWidth 
            label={t('Poultry Type')} 
            margin="normal"
            value={formData.typeVolailles} 
            onChange={(e) => setFormData({ ...formData, typeVolailles: e.target.value })}
            placeholder={t('Poultry type placeholder')}
          />
          
          {editing && (
            <TextField
              select
              fullWidth
              label={t('STATUS')}
              margin="normal"
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
            >
              <MenuItem value="actif">{t('Active Status')}</MenuItem>
              <MenuItem value="termine">{t('Finished Status')}</MenuItem>
            </TextField>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => { setOpen(false); setEditing(null); setError(''); }} sx={{ color: 'text.secondary' }}>
            {t('Cancel')}
          </Button>
          <Button variant="contained" onClick={handleSave}>
            {t('Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}