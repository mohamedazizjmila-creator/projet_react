import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Chip, MenuItem, FormControl,
  InputLabel, Select, Typography, Tooltip, Grid
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Visibility, MedicalServices, Warning } from '@mui/icons-material';
import { getLots, getBatiments, getSanteRecords, addSanteRecord, updateSanteRecord, deleteSanteRecord } from '../../services/firestore';

// ── palette ───────────────────────────────────────────────────────────────────
const GREEN_DARK  = '#14532d';
const GREEN_MID   = '#166534';
const GREEN_MAIN  = '#16a34a';
const GREEN_GHOST = '#f0fdf4';
const GREEN_SOFT  = '#dcfce7';

// ── Small chicken for decoration ─────────────────────────────────────────────
function ChickenSmall({ size = 20, color = '#86efac' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="40" rx="18" ry="14" fill={color} opacity="0.9"/>
      <circle cx="44" cy="22" r="10" fill={color} opacity="0.9"/>
      <path d="M41 13 Q43 8 45 13 Q47 7 49 13" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M53 23 L58 21 L53 25 Z" fill="#f59e0b"/>
      <circle cx="47" cy="21" r="2" fill={GREEN_DARK}/>
      <ellipse cx="52" cy="26" rx="2.5" ry="3.5" fill="#ef4444" opacity="0.9"/>
    </svg>
  );
}

// ── Stat card component ──────────────────────────────────────────────────────
function StatCard({ value, label, icon, active }) {
  return (
    <Box sx={{
      flex: 1, minWidth: 160,
      p: 2, borderRadius: '14px',
      background: active
        ? `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 100%)`
        : '#fff',
      border: active ? 'none' : '1px solid #e5e7eb',
      boxShadow: active
        ? '0 4px 18px rgba(20,83,45,0.25)'
        : '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <Typography sx={{ fontSize: '1.1rem', mb: 0.5 }}>{icon}</Typography>
      <Typography sx={{
        fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1,
        color: active ? '#fff' : GREEN_DARK,
      }}>
        {value}
      </Typography>
      <Typography sx={{
        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: active ? '#86efac' : '#9ca3af',
        mt: 0.3,
      }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function Sante() {
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

  useEffect(() => {
    if (selectedLot) {
      loadSanteRecords();
      const lot = lots.find(l => l.id === selectedLot);
      setSelectedLotDetails(lot);
    } else {
      setSelectedLotDetails(null);
    }
  }, [selectedLot, lots]);

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
    if (!batimentId) return 'Non assigné';
    const batiment = batiments.find(b => b.id === batimentId);
    return batiment ? batiment.nom : batimentId;
  };

  const loadSanteRecords = async () => {
    try {
      const data = await getSanteRecords(selectedLot);
      setSanteRecords(data);
    } catch (err) {
      console.error("Erreur chargement santé:", err);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!formData.diagnostic) {
      setError('Le diagnostic est requis');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        symptomes: formData.symptomes ? formData.symptomes.split(',').map(s => s.trim()) : []
      };
      
      if (editing) {
        await updateSanteRecord(selectedLot, editing.id, dataToSave);
        setSuccess('Enregistrement modifié');
      } else {
        await addSanteRecord(selectedLot, dataToSave);
        setSuccess('Enregistrement ajouté');
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
    if (window.confirm('Supprimer cet enregistrement ?')) {
      try {
        await deleteSanteRecord(selectedLot, record.id);
        setSuccess('Enregistrement supprimé');
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
    if (diag.includes('infection') || diag.includes('maladie')) return 'Critique';
    if (diag.includes('prévention') || diag.includes('contrôle')) return 'Préventif';
    if (diag.includes('léger') || diag.includes('mineur')) return 'Mineur';
    return 'Normal';
  };

  // Statistiques
  const totalRecords = santeRecords.length;
  const recordsCritiques = santeRecords.filter(r => {
    const diag = r.diagnostic?.toLowerCase() || '';
    return diag.includes('infection') || diag.includes('maladie');
  }).length;

  return (
    <Box sx={{ maxWidth: 1100 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: GREEN_DARK, letterSpacing: '-0.3px' }}>
            Suivi Sanitaire
          </Typography>
          <Typography sx={{ fontSize: '0.88rem', color: '#6b7280', mt: 0.3 }}>
            Gérez les diagnostics, traitements et suivis vétérinaires par lot
          </Typography>
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton
            onClick={loadSanteRecords}
            sx={{
              background: GREEN_GHOST,
              borderRadius: '10px',
              '&:hover': { background: GREEN_SOFT },
            }}
          >
            <Refresh sx={{ color: GREEN_MAIN }} />
          </IconButton>
        </Tooltip>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
          {error}
        </Alert>
      )}

      {/* ── Selection du lot ── */}
      <Paper sx={{
        p: 3, mb: 3,
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>
        <Typography sx={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
          color: '#9ca3af', textTransform: 'uppercase', mb: 2,
        }}>
          Sélection du lot
        </Typography>
        
        <TextField
          select
          fullWidth
          label="Lot actif"
          value={selectedLot}
          onChange={(e) => setSelectedLot(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
          }}
        >
          {lots.length === 0 ? (
            <MenuItem disabled>Aucun lot actif</MenuItem>
          ) : (
            lots.map((lot) => (
              <MenuItem key={lot.id} value={lot.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ChickenSmall size={16} color={GREEN_MAIN} />
                  <span>
                    Lot du {lot.dateArrivee?.toDate?.().toLocaleDateString('fr-FR') || 'N/A'} 
                    {' - Bâtiment: '}{getBatimentNom(lot.batimentId)}
                    {' - '}{lot.nbInitial} sujets
                    {lot.typeVolailles && ` (${lot.typeVolailles})`}
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
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <StatCard 
                value={totalRecords} 
                label="Total enregistrements" 
                icon="📋" 
                active={true}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard 
                value={recordsCritiques} 
                label="Cas critiques" 
                icon="⚠️" 
                active={false}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{
                p: 2.5, height: '100%',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                background: GREEN_GHOST,
              }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', mb: 1.5 }}>
                  INFORMATIONS DU LOT
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.75rem' }}>Bâtiment:</Typography>
                    <Typography sx={{ fontWeight: 600, color: GREEN_DARK, fontSize: '0.85rem' }}>
                      {getBatimentNom(selectedLotDetails.batimentId)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.75rem' }}>Type de volailles:</Typography>
                    <Typography sx={{ fontWeight: 600, color: GREEN_DARK, fontSize: '0.85rem' }}>
                      {selectedLotDetails.typeVolailles || 'Standard'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.75rem' }}>Nombre initial:</Typography>
                    <Typography sx={{ fontWeight: 600, color: GREEN_DARK, fontSize: '0.85rem' }}>
                      {selectedLotDetails.nbInitial} sujets
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* ── Bouton Ajouter ── */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpen(true)}
              sx={{
                background: `linear-gradient(135deg, ${GREEN_MID} 0%, ${GREEN_DARK} 100%)`,
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5, py: 1,
                '&:hover': {
                  background: `linear-gradient(135deg, ${GREEN_DARK} 0%, #0d3d1a 100%)`,
                },
              }}
            >
              Nouvel enregistrement
            </Button>
          </Box>

          {/* ── Tableau des enregistrements sanitaires ── */}
          <Paper sx={{
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: GREEN_GHOST }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }}>Diagnostic</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }}>Traitement</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }}>Médicaments</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {santeRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#9ca3af', fontSize: '0.88rem' }}>
                        <MedicalServices sx={{ fontSize: 40, mb: 1, color: '#9ca3af' }} />
                        <Typography>Aucun enregistrement sanitaire pour ce lot</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    santeRecords.map((record, idx) => {
                      const severityColor = getSeverityColor(record.diagnostic || '');
                      return (
                        <TableRow 
                          key={record.id} 
                          sx={{ 
                            '&:hover': { background: GREEN_GHOST },
                            background: idx % 2 === 0 ? '#fff' : '#fafafa',
                          }}
                        >
                          <TableCell>
                            <Typography sx={{ fontSize: '0.88rem' }}>
                              {record.date?.toDate?.().toLocaleDateString('fr-FR')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={record.diagnostic?.substring(0, 30) + (record.diagnostic?.length > 30 ? '...' : '')} 
                                color={severityColor}
                                size="small"
                                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                              />
                              {severityColor === 'error' && (
                                <Warning sx={{ fontSize: 14, color: '#ef4444' }} />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {record.traitement || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.85rem' }}>{record.medicaments || '-'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Voir les détails">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setViewOpen(true);
                                  }}
                                  sx={{
                                    borderRadius: '8px',
                                    color: '#3b82f6',
                                    '&:hover': { background: '#eff6ff' },
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Modifier">
                                <IconButton
                                  size="small"
                                  onClick={() => { 
                                    setEditing(record); 
                                    setFormData({
                                      ...record,
                                      symptomes: record.symptomes?.join(', ') || '',
                                      date: record.date?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
                                    }); 
                                    setOpen(true);
                                  }}
                                  sx={{
                                    borderRadius: '8px',
                                    color: GREEN_MAIN,
                                    '&:hover': { background: GREEN_SOFT },
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Supprimer">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(record)}
                                  sx={{
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    '&:hover': { background: '#fef2f2' },
                                  }}
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
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {!selectedLot && lots.length > 0 && (
        <Paper sx={{
          p: 4, textAlign: 'center',
          borderRadius: '16px',
          background: GREEN_GHOST,
          border: `1px dashed ${GREEN_MAIN}`,
        }}>
          <ChickenSmall size={40} color={GREEN_MAIN} />
          <Typography sx={{ mt: 2, color: '#6b7280' }}>
            Sélectionnez un lot pour voir les enregistrements sanitaires
          </Typography>
        </Paper>
      )}

      {lots.length === 0 && (
        <Paper sx={{
          p: 4, textAlign: 'center',
          borderRadius: '16px',
          background: '#fef2f2',
          border: '1px dashed #ef4444',
        }}>
          <Warning sx={{ fontSize: 40, color: '#ef4444', mb: 1 }} />
          <Typography sx={{ color: '#dc2626', fontWeight: 600 }}>
            Aucun lot actif disponible
          </Typography>
          <Typography sx={{ color: '#6b7280', fontSize: '0.88rem', mt: 1 }}>
            Veuillez créer un lot dans la section "Lots" avant d'enregistrer des données sanitaires
          </Typography>
        </Paper>
      )}

      {/* ── Dialogue d'ajout/modification ── */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 800, fontSize: '1.1rem',
          color: GREEN_DARK, pb: 0,
          borderBottom: `1px solid ${GREEN_SOFT}`,
          mb: 1,
        }}>
          {editing ? '✏️ Modifier l\'enregistrement' : '🏥 Nouvel enregistrement sanitaire'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth 
            label="Diagnostic" 
            margin="normal" 
            multiline 
            rows={2}
            value={formData.diagnostic} 
            onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
            required
            placeholder="Description du diagnostic..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
            }}
          />
          
          <TextField
            fullWidth 
            label="Traitement" 
            margin="normal" 
            multiline 
            rows={2}
            value={formData.traitement} 
            onChange={(e) => setFormData({ ...formData, traitement: e.target.value })}
            placeholder="Traitement prescrit..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
            }}
          />
          
          <TextField
            fullWidth 
            label="Médicaments" 
            margin="normal"
            value={formData.medicaments} 
            onChange={(e) => setFormData({ ...formData, medicaments: e.target.value })}
            placeholder="Médicaments utilisés (séparés par des virgules)"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
            }}
          />
          
          <TextField
            fullWidth 
            label="Symptômes" 
            margin="normal"
            value={formData.symptomes} 
            onChange={(e) => setFormData({ ...formData, symptomes: e.target.value })}
            placeholder="Symptômes observés (séparés par des virgules)"
            helperText="Ex: éternuements, perte d'appétit, abattement"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
            }}
          />
          
          <TextField
            fullWidth 
            label="Recommandations" 
            margin="normal" 
            multiline 
            rows={2}
            value={formData.recommandations} 
            onChange={(e) => setFormData({ ...formData, recommandations: e.target.value })}
            placeholder="Recommandations supplémentaires..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
            }}
          />
          
          <TextField
            fullWidth 
            label="Date" 
            type="date" 
            margin="normal"
            value={formData.date} 
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
            }}
          />
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setOpen(false)}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 600,
              color: '#6b7280', border: '1px solid #e5e7eb',
              '&:hover': { background: '#f9fafb' },
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              background: `linear-gradient(135deg, ${GREEN_MID} 0%, ${GREEN_DARK} 100%)`,
              borderRadius: '10px', textTransform: 'none', fontWeight: 700,
              boxShadow: '0 4px 12px rgba(20,83,45,0.3)',
              '&:hover': {
                background: `linear-gradient(135deg, ${GREEN_DARK} 0%, #0d3d1a 100%)`,
              },
            }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialogue de visualisation ── */}
      <Dialog 
        open={viewOpen} 
        onClose={() => setViewOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 800, fontSize: '1.1rem',
          color: GREEN_DARK, pb: 0,
          borderBottom: `1px solid ${GREEN_SOFT}`,
          mb: 1,
        }}>
          Détail de l'enregistrement sanitaire
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {selectedRecord && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Date
                </Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{selectedRecord.date?.toDate?.().toLocaleDateString('fr-FR')}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Diagnostic
                </Typography>
                <Chip 
                  label={getSeverityText(selectedRecord.diagnostic || '')} 
                  color={getSeverityColor(selectedRecord.diagnostic || '')}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography sx={{ fontSize: '0.9rem' }}>{selectedRecord.diagnostic}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Traitement
                </Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{selectedRecord.traitement || '-'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Médicaments
                </Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{selectedRecord.medicaments || '-'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Symptômes
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedRecord.symptomes?.length > 0 ? (
                    selectedRecord.symptomes.map((symptome, idx) => (
                      <Chip key={idx} label={symptome} size="small" sx={{ background: GREEN_SOFT }} />
                    ))
                  ) : (
                    <Typography sx={{ fontSize: '0.9rem' }}>-</Typography>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Recommandations
                </Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{selectedRecord.recommandations || '-'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setViewOpen(false)}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 600,
              background: GREEN_GHOST,
              color: GREEN_DARK,
              '&:hover': { background: GREEN_SOFT },
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}