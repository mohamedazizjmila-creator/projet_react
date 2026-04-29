import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Grid, Chip, Tooltip, InputAdornment, Avatar, useTheme
} from '@mui/material';
import {
  Add, Edit, Delete, Search, FilterList, 
  Thermostat, Science
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { getBatiments, addBatiment, updateBatiment, deleteBatiment } from '../../services/firestore';
import { useSettings } from '../../contexts/SettingsContext';

// ── Chicken Icon Component ──
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

export default function Batiments() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { settings } = useSettings();
  const { enqueueSnackbar } = useSnackbar();
  const [batiments, setBatiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBatiment, setEditingBatiment] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    type: 'poulet de chair',
    capacite: '',
    statut: 'actif'
  });

  useEffect(() => {
    loadBatiments();
  }, []);

  const loadBatiments = async () => {
    try {
      const data = await getBatiments();
      setBatiments(data);
    } catch (error) {
      enqueueSnackbar(t('Error loading'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (batiment = null) => {
    if (batiment) {
      setEditingBatiment(batiment);
      setFormData({ ...batiment });
    } else {
      setEditingBatiment(null);
      setFormData({ nom: '', type: 'poulet de chair', capacite: '', statut: 'actif' });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      if (editingBatiment) {
        await updateBatiment(editingBatiment.id, formData);
        enqueueSnackbar(t('Building updated'), { variant: 'success' });
      } else {
        await addBatiment(formData);
        enqueueSnackbar(t('Building added'), { variant: 'success' });
      }
      handleClose();
      loadBatiments();
    } catch (error) {
      enqueueSnackbar(t('Error saving'), { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('Delete confirmation'))) {
      try {
        await deleteBatiment(id);
        enqueueSnackbar(t('Building deleted'), { variant: 'success' });
        loadBatiments();
      } catch (error) {
        enqueueSnackbar(t('Error deleting'), { variant: 'error' });
      }
    }
  };

  const filteredBatiments = batiments.filter(b => 
    b.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800 }}>
            {t('Building Management')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('Configure Infrastructure')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          sx={{ px: 3, py: 1.2, borderRadius: '12px' }}
        >
          {t('New Building')}
        </Button>
      </Box>

      {/* ── Filters & Actions ── */}
      <Paper className="glass-card" sx={{ p: 2, mb: 3, borderRadius: '16px', display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder={t('Search Building')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        <IconButton sx={{ bgcolor: 'rgba(148, 163, 184, 0.05)', borderRadius: '10px' }}>
          <FilterList sx={{ color: 'text.secondary' }} />
        </IconButton>
      </Paper>

      {/* ── Data Table ── */}
      <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: '20px', overflow: 'hidden' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{t('Building Name')}</TableCell>
              <TableCell>{t('TYPE')}</TableCell>
              <TableCell>{t('CAPACITY')}</TableCell>
              <TableCell>{t('STATUS')}</TableCell>
              <TableCell>{t('SENSORS')}</TableCell>
              <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>{t('ACTIONS')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {filteredBatiments.map((batiment) => (
                <TableRow 
                  key={batiment.id}
                  component={motion.tr}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  sx={{ '&:hover': { bgcolor: 'rgba(163, 230, 53, 0.04)' } }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(163, 230, 53, 0.1)', color: '#a3e635' }}>
                        <ChickenSmall size={22} />
                      </Avatar>
                      <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{batiment.nom}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={batiment.type === 'poulet de chair' ? t('Chicken') : batiment.type === 'poules pondeuses' ? t('Layers') : t('Turkey')} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 700, fontSize: '0.65rem' }} 
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {batiment.capacite} {t('places')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <div className={`dot-glow ${batiment.statut === 'actif' ? 'dot-success' : 'dot-warning'}`} />
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: batiment.statut === 'actif' ? '#a3e635' : '#fbbf24' }}>
                        {batiment.statut === 'actif' ? t('Active') : batiment.statut === 'inactif' ? t('Inactive') : t('Maintenance')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Température OK">
                        <Thermostat sx={{ fontSize: 18, color: '#a3e635' }} />
                      </Tooltip>
                      <Tooltip title="Ammoniac OK">
                        <Science sx={{ fontSize: 18, color: '#a3e635' }} />
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>
                    <Tooltip title={t('Edit')}>
                      <IconButton onClick={() => handleOpen(batiment)} sx={{ color: '#3b82f6' }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('Delete')}>
                      <IconButton onClick={() => handleDelete(batiment.id)} sx={{ color: '#f87171' }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </AnimatePresence>
            {filteredBatiments.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                  <Typography sx={{ color: 'text.secondary' }}>{t('No building found')}</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Form Dialog ── */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          className: 'glass-card',
          sx: { borderRadius: '24px', width: '100%', maxWidth: 500, p: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>
          {editingBatiment ? t('Edit Building') : t('New Building')}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('Building Name')}
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label={t('TYPE')}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="poulet de chair">{t('Chicken')}</MenuItem>
                  <MenuItem value="poules pondeuses">{t('Layers')}</MenuItem>
                  <MenuItem value="dinde">{t('Turkey')}</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('CAPACITY')}
                  required
                  value={formData.capacite}
                  onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label={t('STATUS')}
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                >
                  <MenuItem value="actif">{t('Active')}</MenuItem>
                  <MenuItem value="inactif">{t('Inactive')}</MenuItem>
                  <MenuItem value="maintenance">{t('Maintenance')}</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>{t('Cancel')}</Button>
            <Button type="submit" variant="contained">
              {t('Save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}