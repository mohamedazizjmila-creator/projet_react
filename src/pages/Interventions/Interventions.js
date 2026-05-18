import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Chip, MenuItem, FormControl,
  InputLabel, Select, Typography, Tooltip, Grid, useTheme
} from '@mui/material';
// ✅ AJOUT DES ICÔNES CheckCircle ET RadioButtonUnchecked
import { Add, Edit, Delete, Refresh, Visibility, MedicalServices, Warning, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { getLots, getBatiments } from '../../services/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { 
  getInterventions, 
  addIntervention, 
  updateIntervention, 
  deleteIntervention,
  toggleInterventionStatus, // ✅ NOUVELLE FONCTION IMPORTÉE
  typesIntervention
} from '../../services/firestore';

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

export default function Interventions() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { settings } = useSettings();
  const { userRole } = useAuth();
  const [lots, setLots] = useState([]);
  const [batiments, setBatiments] = useState([]);
  const [selectedLot, setSelectedLot] = useState('');
  const [selectedLotDetails, setSelectedLotDetails] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    responsable: '',
    produits: '',
    duree: '',
    commentaires: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  const canEdit = userRole === 'admin' || userRole === 'responsable';
  const canDelete = userRole === 'admin' || userRole === 'responsable';
  const canAdd = userRole === 'admin' || userRole === 'responsable' || userRole === 'technicien';

  useEffect(() => {
    loadLots();
    loadBatiments();
  }, []);

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

  const loadInterventions = useCallback(async () => {
    if (!selectedLot) return;
    try {
      const data = await getInterventions(selectedLot);
      setInterventions(data);
    } catch (err) {
      console.error("Erreur chargement interventions:", err);
    }
  }, [selectedLot]);

  useEffect(() => {
    loadInterventions();
  }, [selectedLot, loadInterventions]);

  useEffect(() => {
    if (selectedLot) {
      const lot = lots.find(l => l.id === selectedLot);
      setSelectedLotDetails(lot);
    } else {
      setSelectedLotDetails(null);
    }
  }, [selectedLot, lots]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!formData.type || !formData.date) {
      setError(t('Type and date required'));
      return;
    }

    try {
      if (editing) {
        await updateIntervention(selectedLot, editing.id, formData);
        setSuccess(t('Intervention updated'));
      } else {
        await addIntervention(selectedLot, formData);
        setSuccess(t('Intervention added'));
      }
      
      setOpen(false);
      setEditing(null);
      setFormData({
        type: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        responsable: '',
        produits: '',
        duree: '',
        commentaires: ''
      });
      loadInterventions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (intervention) => {
    if (window.confirm(t('Delete intervention confirmation'))) {
      try {
        await deleteIntervention(selectedLot, intervention.id);
        setSuccess(t('Intervention deleted'));
        loadInterventions();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // ✅ NOUVELLE FONCTION : Gère le clic sur la coche
  const handleToggleStatus = async (intervention) => {
    try {
      const nouveauStatut = !intervention.estTerminee;
      await toggleInterventionStatus(selectedLot, intervention.id, nouveauStatut);
      // Mettre à jour l'affichage localement sans recharger tout
      setInterventions(prev => 
        prev.map(i => i.id === intervention.id ? { ...i, estTerminee: nouveauStatut } : i)
      );
    } catch (err) {
      console.error("Erreur changement statut", err);
      setError(t('Error updating status'));
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'Vaccination': return 'primary';
      case 'Traitement médical': return 'error';
      case 'Nettoyage': return 'success';
      case 'Désinfection': return 'warning';
      case 'Changement de litière': return 'info';
      case 'Contrôle sanitaire': return 'secondary';
      default: return 'default';
    }
  };

  const totalInterventions = interventions.length;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800 }}>
            {t('Interventions')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('Interventions Subtitle')}
          </Typography>
        </Box>
        <Tooltip title={t('Refresh')}>
          <IconButton
            onClick={loadInterventions}
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
        <Alert severity="success" sx={{ mb: 3, borderRadius: '16px' }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }}>
          {error}
        </Alert>
      )}

      {/* ── Selection du lot ── */}
      <Paper className="glass-card" sx={{ p: 3, mb: 4, borderRadius: '24px' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.1em' }}>
          {t('Select Batch')}
        </Typography>
        
        <TextField
          select
          fullWidth
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
          {/* ── Cartes de statistiques ── */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <StatCard 
                value={totalInterventions} 
                label={t('Total Interventions')} 
                icon="📋" 
                active={true}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper className="glass-card" sx={{ p: 3, height: '100%', borderRadius: '24px', bgcolor: 'rgba(163, 230, 53, 0.03)' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, display: 'block', letterSpacing: '0.1em' }}>
                  {t('BATCH INFORMATION')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{t('Building')}</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {getBatimentNom(selectedLotDetails.batimentId)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{t('Initial Nb')}</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {selectedLotDetails.nbInitial} {t('subjects')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{t('TYPE')}</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {selectedLotDetails.typeVolailles || t('Standard')}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          {/* ── Bouton Ajouter ── */}
          {canAdd && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpen(true)}
                sx={{ px: 3, py: 1.2, borderRadius: '12px' }}
              >
                {t('New Intervention')}
              </Button>
            </Box>
          )}

          {/* ── Tableau des interventions ── */}
          <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: '24px', overflow: 'hidden' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('Status')}</TableCell> {/* ✅ NOUVELLE COLONNE STATUT */}
                  <TableCell>{t('Date')}</TableCell>
                  <TableCell>{t('Type')}</TableCell>
                  <TableCell>{t('Description')}</TableCell>
                  <TableCell>{t('Responsible')}</TableCell>
                  <TableCell>{t('Products used')}</TableCell>
                  <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>{t('ACTIONS')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {interventions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                        <MedicalServices sx={{ fontSize: 48, mb: 2, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography sx={{ color: 'text.secondary' }}>{t('No intervention recorded')}</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    interventions.map((intervention) => (
                      <TableRow 
                        key={intervention.id} 
                        component={motion.tr}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        sx={{ 
                          '&:hover': { bgcolor: 'rgba(163, 230, 53, 0.04)' },
                          // ✅ STYLE: Transparence si terminée
                          opacity: intervention.estTerminee ? 0.6 : 1 
                        }}
                      >
                        {/* ✅ NOUVELLE CELLULE CHECKBOX */}
                        <TableCell>
                          <Tooltip title={intervention.estTerminee ? t('Mark as pending') : t('Mark as done')}>
                            <IconButton 
                              onClick={() => handleToggleStatus(intervention)}
                              color={intervention.estTerminee ? "success" : "default"}
                            >
                              {intervention.estTerminee ? <CheckCircle /> : <RadioButtonUnchecked />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ 
                            fontSize: '0.88rem', 
                            fontWeight: 600,
                            textDecoration: intervention.estTerminee ? 'line-through' : 'none' // ✅ STYLE BARRÉ
                          }}>
                            {intervention.date?.toDate?.().toLocaleDateString() || intervention.date}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={t(intervention.type)} 
                            color={getTypeColor(intervention.type)}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ 
                            fontSize: '0.85rem', color: 'text.secondary', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            textDecoration: intervention.estTerminee ? 'line-through' : 'none' // ✅ STYLE BARRÉ
                          }}>
                            {intervention.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{intervention.responsable || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{intervention.produits || '-'}</Typography>
                        </TableCell>
                        <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: settings.language === 'ar' ? 'flex-start' : 'flex-end' }}>
                            <Tooltip title={t('Intervention Detail')}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedIntervention(intervention);
                                  setViewOpen(true);
                                }}
                                sx={{ color: '#3b82f6' }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {canEdit && (
                              <Tooltip title={t('Edit')}>
                                <IconButton
                                  size="small"
                                  onClick={() => { 
                                    setEditing(intervention); 
                                    setFormData({
                                      ...intervention,
                                      date: intervention.date?.toDate?.().toISOString().split('T')[0] || intervention.date || new Date().toISOString().split('T')[0]
                                    }); 
                                    setOpen(true);
                                  }}
                                  sx={{ color: theme.palette.primary.main }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {canDelete && (
                              <Tooltip title={t('Delete')}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(intervention)}
                                  sx={{ color: '#ef4444' }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
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
            {t('Select batch to see interventions')}
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
            {t('Create batch first')}
          </Typography>
        </Paper>
      )}

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
          {editing ? t('Edit') + ' ' + t('Intervention') : t('New Intervention')}
        </DialogTitle>
        
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('Intervention Type')}</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              label={t('Intervention Type')}
            >
              {typesIntervention.map((type) => (
                <MenuItem key={type} value={type}>{t(type)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth 
            label={t('Date')} 
            type="date" 
            margin="normal"
            value={formData.date} 
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            fullWidth 
            label={t('Description')} 
            margin="normal" 
            multiline 
            rows={3}
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('Intervention description placeholder')}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth 
                label={t('Responsible')} 
                margin="normal"
                value={formData.responsable} 
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                placeholder={t('Responsible placeholder')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth 
                label={t('Duration')} 
                margin="normal"
                value={formData.duree} 
                onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                placeholder={t('Duration placeholder')}
              />
            </Grid>
          </Grid>
          
          <TextField
            fullWidth 
            label={t('Products used')} 
            margin="normal"
            value={formData.produits} 
            onChange={(e) => setFormData({ ...formData, produits: e.target.value })}
            placeholder={t('Products placeholder')}
          />
          
          <TextField
            fullWidth 
            label={t('Comments')} 
            margin="normal" 
            multiline 
            rows={2}
            value={formData.commentaires} 
            onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
            placeholder={t('Comments placeholder')}
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

      {/* ── Dialogue de visualisation ── */}
      <Dialog 
        open={viewOpen} 
        onClose={() => setViewOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          className: 'glass-card',
          sx: { borderRadius: '24px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>
          {t('Intervention Detail')}
        </DialogTitle>
        
        <DialogContent>
          {selectedIntervention && (
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* ✅ AFFICHER LE STATUT DANS LA POPUP */}
              <Box>
                 <Chip 
                    icon={selectedIntervention.estTerminee ? <CheckCircle /> : <RadioButtonUnchecked />} 
                    label={selectedIntervention.estTerminee ? t('Completed') : t('Pending')} 
                    color={selectedIntervention.estTerminee ? "success" : "default"} 
                    sx={{ fontWeight: 800, mb: 2 }} 
                  />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                  {t('Type')}
                </Typography>
                <Chip label={t(selectedIntervention.type)} color={getTypeColor(selectedIntervention.type)} size="small" sx={{ fontWeight: 800 }} />
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                    {t('Date')}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>{selectedIntervention.date?.toDate?.().toLocaleDateString() || selectedIntervention.date}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                    {t('Responsible')}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>{selectedIntervention.responsable || '-'}</Typography>
                </Grid>
              </Grid>
              
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                  {t('Description')}
                </Typography>
                <Typography sx={{ color: 'text.primary' }}>{selectedIntervention.description || '-'}</Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                    {t('Products used')}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>{selectedIntervention.produits || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                    {t('Duration')}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>{selectedIntervention.duree || '-'}</Typography>
                </Grid>
              </Grid>
              
              {selectedIntervention.commentaires && (
                <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                    {t('Comments')}
                  </Typography>
                  <Typography variant="body2">{selectedIntervention.commentaires}</Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  {t('Created by')}: {selectedIntervention.createdByName || 'Inconnu'}
                </Typography>
              </Box>
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