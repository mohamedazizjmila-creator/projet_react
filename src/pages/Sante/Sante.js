import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Chip, MenuItem, Typography, Tooltip, Grid, useTheme
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Visibility, MedicalServices, Warning } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { getLots, getBatiments, getSanteRecords, addSanteRecord, updateSanteRecord, deleteSanteRecord } from '../../services/firestore';

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

export default function Sante() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { settings } = useSettings();
 const { userRole } = useAuth();
 const isVeterinaire = userRole === 'veterinaire';

  const [lots, setLots] = useState([]);
  const [batiments, setBatiments] = useState([]);
  const [selectedLot, setSelectedLot] = useState('');
  const [selectedLotDetails, setSelectedLotDetails] = useState(null);
  const [santeRecords, setSanteRecords] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    diagnostic: '',
    traitement: '',
    medicaments: '',
    symptomes: '',
    recommandations: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadLots();
    loadBatiments();
  }, []);

  const loadSanteRecords = useCallback(async () => {
    if (!selectedLot) return;
    try {
      const data = await getSanteRecords(selectedLot);
      setSanteRecords(data);
    } catch (err) {
      console.error("Erreur chargement santé:", err);
    }
  }, [selectedLot]);

  useEffect(() => {
    if (selectedLot) {
      loadSanteRecords();
      const lot = lots.find(l => l.id === selectedLot);
      setSelectedLotDetails(lot);
    } else {
      setSelectedLotDetails(null);
    }
  }, [selectedLot, lots, loadSanteRecords]);

  const loadLots = async () => {
    try {
      const data = await getLots();
      setLots(data.filter(l => l.statut === 'actif'));
    } catch (err) {
      console.error("Erreur chargement lots:", err);
    }
  };

  const loadBatiments = async () => {
    try {
      const data = await getBatiments();
      setBatiments(data);
    } catch (err) {
      console.error("Erreur chargement bâtiments:", err);
    }
  };

  const getBatimentNom = (batimentId) => {
    if (!batimentId) return t('Inactive');
    const batiment = batiments.find(b => b.id === batimentId);
    return batiment ? batiment.nom : batimentId;
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!formData.diagnostic) {
      setError(t('Diagnosis required'));
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        symptomes: formData.symptomes ? formData.symptomes.split(',').map(s => s.trim()) : []
      };

      if (editing) {
        await updateSanteRecord(selectedLot, editing.id, dataToSave);
        setSuccess(t('Record updated'));
      } else {
        await addSanteRecord(selectedLot, dataToSave);
        setSuccess(t('Record added'));
      }

      setOpen(false);
      setEditing(null);
      setFormData({
        diagnostic: '',
        traitement: '',
        medicaments: '',
        symptomes: '',
        recommandations: '',
        date: new Date().toISOString().split('T')[0]
      });
      loadSanteRecords();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (record) => {
    if (isVeterinaire) return;
    if (window.confirm(t('Delete record confirmation'))) {
      try {
        await deleteSanteRecord(selectedLot, record.id);
        setSuccess(t('Record deleted'));
        loadSanteRecords();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getSeverityColor = (diagnostic) => {
    const diag = diagnostic.toLowerCase();
    if (diag.includes('infection') || diag.includes('maladie')) return 'error';
    if (diag.includes('prévention') || diag.includes('contrôle')) return 'info';
    if (diag.includes('léger') || diag.includes('mineur')) return 'warning';
    return 'success';
  };

  const getSeverityText = (diagnostic) => {
    const diag = diagnostic.toLowerCase();
    if (diag.includes('infection') || diag.includes('maladie')) return t('Critical');
    if (diag.includes('prévention') || diag.includes('contrôle')) return t('Preventive');
    if (diag.includes('léger') || diag.includes('mineur')) return t('Minor');
    return t('Normal');
  };

  const totalRecords = santeRecords.length;
  const recordsCritiques = santeRecords.filter(r => {
    const diag = r.diagnostic?.toLowerCase() || '';
    return diag.includes('infection') || diag.includes('maladie');
  }).length;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800 }}>
            {t('Health Tracking')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('Health Subtitle')}
          </Typography>
        </Box>
        <Tooltip title={t('Refresh')}>
          <IconButton
            onClick={loadSanteRecords}
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
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '16px' }}>{success}</Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }}>{error}</Alert>
      )}

      {/* ── Sélection du lot ── */}
      <Paper className="glass-card" sx={{ p: 3, mb: 4, borderRadius: '24px' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.1em' }}>
          {t('Select Batch')}
        </Typography>
        <TextField
          select fullWidth
          label={t('Active Batch')}
          value={selectedLot}
          onChange={(e) => setSelectedLot(e.target.value)}
        >
          {lots.length === 0 ? (
            <MenuItem disabled>{t('No active batch available')}</MenuItem>
          ) : (
            lots.map((lot) => (
              <MenuItem key={lot.id} value={lot.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ChickenSmall size={18} color={theme.palette.primary.main} />
                  <span>
                    {t('Batch info', {
                      date: lot.dateArrivee?.toDate?.().toLocaleDateString() || lot.dateArrivee || 'N/A',
                      batiment: getBatimentNom(lot.batimentId),
                      count: lot.nbInitial,
                      type: lot.typeVolailles ? `(${lot.typeVolailles})` : ''
                    })}
                  </span>
                </Box>
              </MenuItem>
            ))
          )}
        </TextField>
      </Paper>

      {selectedLot && selectedLotDetails && (
        <>
          {/* ── Stat cards ── */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <StatCard value={totalRecords} label={t('Total Records')} icon="📋" active={true} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard value={recordsCritiques} label={t('Critical Cases')} icon="⚠️" active={false} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper className="glass-card" sx={{ p: 2.5, height: '100%', borderRadius: '20px', bgcolor: 'rgba(163, 230, 53, 0.03)' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block', letterSpacing: '0.05em' }}>
                  {t('BATCH INFORMATION')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{t('Building')}:</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}>
                      {getBatimentNom(selectedLotDetails.batimentId)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{t('Poultry Type')}:</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}>
                      {selectedLotDetails.typeVolailles || t('Standard')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{t('Initial Nb')}:</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}>
                      {selectedLotDetails.nbInitial} {t('subjects')}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* ── Bouton Ajouter — visible pour tous ── */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpen(true)}
              sx={{ px: 3, py: 1.2, borderRadius: '12px' }}
            >
              {t('New Health Record')}
            </Button>
          </Box>

          {/* ── Tableau ── */}
          <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: '24px', overflow: 'hidden' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('Date')}</TableCell>
                  <TableCell>{t('Diagnosis')}</TableCell>
                  <TableCell>{t('Treatment')}</TableCell>
                  <TableCell>{t('Medicines')}</TableCell>
                  <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>{t('ACTIONS')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {santeRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                        <MedicalServices sx={{ fontSize: 48, mb: 2, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography sx={{ color: 'text.secondary' }}>{t('No health record')}</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    santeRecords.map((record) => {
                      const severityColor = getSeverityColor(record.diagnostic || '');
                      return (
                        <TableRow
                          key={record.id}
                          component={motion.tr}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          sx={{ '&:hover': { bgcolor: 'rgba(163, 230, 53, 0.04)' } }}
                        >
                          <TableCell>
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>
                              {record.date?.toDate?.().toLocaleDateString() || record.date}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={record.diagnostic?.substring(0, 30) + (record.diagnostic?.length > 30 ? '...' : '')}
                                color={severityColor}
                                size="small"
                                sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                              />
                              {severityColor === 'error' && (
                                <Warning sx={{ fontSize: 14, color: theme.palette.error.main }} />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {record.traitement || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{record.medicaments || '-'}</Typography>
                          </TableCell>
                          <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: settings.language === 'ar' ? 'flex-start' : 'flex-end' }}>
                              
                              {/* Voir — toujours visible */}
                              <Tooltip title={t('Intervention Detail')}>
                                <IconButton
                                  size="small"
                                  onClick={() => { setSelectedRecord(record); setViewOpen(true); }}
                                  sx={{ color: '#3b82f6' }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              {/* Edit — masqué pour vétérinaire */}
                              {!isVeterinaire && (
                                <Tooltip title={t('Edit')}>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditing(record);
                                      setFormData({
                                        ...record,
                                        symptomes: record.symptomes?.join(', ') || '',
                                        date: record.date?.toDate?.().toISOString().split('T')[0] || record.date || new Date().toISOString().split('T')[0]
                                      });
                                      setOpen(true);
                                    }}
                                    sx={{ color: theme.palette.primary.main }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {/* Delete — masqué pour vétérinaire */}
                              {!isVeterinaire && (
                                <Tooltip title={t('Delete')}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(record)}
                                    sx={{ color: '#ef4444' }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
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
        </>
      )}

      {!selectedLot && lots.length > 0 && (
        <Paper className="glass-card" sx={{ p: 6, textAlign: 'center', borderRadius: '24px', border: `2px dashed ${theme.palette.divider}` }}>
          <ChickenSmall size={48} color={theme.palette.primary.main} />
          <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary', fontWeight: 700 }}>
            {t('Select batch to see health')}
          </Typography>
        </Paper>
      )}

      {lots.length === 0 && (
        <Paper className="glass-card" sx={{ p: 6, textAlign: 'center', borderRadius: '24px', border: `2px dashed ${theme.palette.error.main}40`, bgcolor: 'rgba(239, 68, 68, 0.05)' }}>
          <Warning sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2, opacity: 0.8 }} />
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 800 }}>
            {t('No active batch available')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 1 }}>
            {t('Create batch first health')}
          </Typography>
        </Paper>
      )}

      {/* ── Dialogue ajout/modification ── */}
      <Dialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'glass-card', sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>
          {editing ? t('Edit') + ' ' + t('Health Tracking') : t('New Health Record')}
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth label={t('Diagnosis')} margin="normal" multiline rows={2}
            value={formData.diagnostic}
            onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
            required placeholder={t('Diagnosis placeholder')}
          />
          <TextField fullWidth label={t('Treatment')} margin="normal" multiline rows={2}
            value={formData.traitement}
            onChange={(e) => setFormData({ ...formData, traitement: e.target.value })}
            placeholder={t('Treatment placeholder')}
          />
          <TextField fullWidth label={t('Medicines')} margin="normal"
            value={formData.medicaments}
            onChange={(e) => setFormData({ ...formData, medicaments: e.target.value })}
            placeholder={t('Medicines placeholder')}
          />
          <TextField fullWidth label={t('Symptoms')} margin="normal"
            value={formData.symptomes}
            onChange={(e) => setFormData({ ...formData, symptomes: e.target.value })}
            placeholder={t('Symptoms placeholder')}
            helperText={t('Symptoms helper')}
          />
          <TextField fullWidth label={t('Recommendations')} margin="normal" multiline rows={2}
            value={formData.recommandations}
            onChange={(e) => setFormData({ ...formData, recommandations: e.target.value })}
            placeholder={t('Recommendations placeholder')}
          />
          <TextField fullWidth label={t('Date')} type="date" margin="normal"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => { setOpen(false); setEditing(null); }} sx={{ color: 'text.secondary' }}>
            {t('Cancel')}
          </Button>
          <Button variant="contained" onClick={handleSave}>
            {t('Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialogue visualisation ── */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'glass-card', sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>
          {t('Health Record Detail')}
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                  {t('Date')}
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  {selectedRecord.date?.toDate?.().toLocaleDateString() || selectedRecord.date}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                  {t('Diagnosis')}
                </Typography>
                <Chip
                  label={getSeverityText(selectedRecord.diagnostic || '')}
                  color={getSeverityColor(selectedRecord.diagnostic || '')}
                  size="small"
                  sx={{ mb: 1, fontWeight: 800 }}
                />
                <Typography sx={{ color: 'text.primary' }}>{selectedRecord.diagnostic}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                  {t('Treatment')}
                </Typography>
                <Typography sx={{ color: 'text.primary' }}>{selectedRecord.traitement || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                  {t('Medicines')}
                </Typography>
                <Typography sx={{ color: 'text.primary', fontWeight: 700 }}>{selectedRecord.medicaments || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                  {t('Symptoms')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedRecord.symptomes?.length > 0 ? (
                    selectedRecord.symptomes.map((symptome, idx) => (
                      <Chip key={idx} label={symptome} size="small" sx={{ bgcolor: 'rgba(163, 230, 53, 0.1)', fontWeight: 600 }} />
                    ))
                  ) : (
                    <Typography sx={{ color: 'text.secondary' }}>-</Typography>
                  )}
                </Box>
              </Box>
              {selectedRecord.recommandations && (
                <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                    {t('Recommendations')}
                  </Typography>
                  <Typography variant="body2">{selectedRecord.recommandations}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="contained" onClick={() => setViewOpen(false)} fullWidth sx={{ borderRadius: '12px' }}>
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}