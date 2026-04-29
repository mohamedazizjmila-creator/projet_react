import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Chip, MenuItem, FormControl,
  InputLabel, Select, Typography, Tooltip, Grid
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Visibility, MedicalServices, Warning } from '@mui/icons-material';
import { getLots, getBatiments } from '../../services/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getInterventions, 
  addIntervention, 
  updateIntervention, 
  deleteIntervention,
  typesIntervention
} from '../../services/firestore';

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

export default function Interventions() {
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

  // Définir les permissions selon le rôle
  const canEdit = userRole === 'admin' || userRole === 'responsable';
  const canDelete = userRole === 'admin' || userRole === 'responsable';
  const canAdd = userRole === 'admin' || userRole === 'responsable' || userRole === 'technicien';
  const canView = true;

  // Charger les lots et bâtiments
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

  // Obtenir le nom du bâtiment
  const getBatimentNom = (batimentId) => {
    if (!batimentId) return 'Non assigné';
    const batiment = batiments.find(b => b.id === batimentId);
    return batiment ? batiment.nom : batimentId;
  };

  // Charger les interventions
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

  // Mettre à jour les détails du lot sélectionné
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
      setError('Type et date sont requis');
      return;
    }

    try {
      if (editing) {
        await updateIntervention(selectedLot, editing.id, formData);
        setSuccess('Intervention modifiée');
      } else {
        await addIntervention(selectedLot, formData);
        setSuccess('Intervention ajoutée');
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
    if (window.confirm('Supprimer cette intervention ?')) {
      try {
        await deleteIntervention(selectedLot, intervention.id);
        setSuccess('Intervention supprimée');
        loadInterventions();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message);
      }
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

  // Statistiques
  const totalInterventions = interventions.length;

  return (
    <Box sx={{ maxWidth: 1100 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: GREEN_DARK, letterSpacing: '-0.3px' }}>
            Interventions
          </Typography>
          <Typography sx={{ fontSize: '0.88rem', color: '#6b7280', mt: 0.3 }}>
            Gérez les interventions sanitaires et techniques par lot
          </Typography>
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton
            onClick={loadInterventions}
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
                value={totalInterventions} 
                label="Total interventions" 
                icon="📋" 
                active={true}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper sx={{
                p: 2.5, height: '100%',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                background: GREEN_GHOST,
              }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', mb: 1.5 }}>
                  INFORMATIONS DU LOT
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.75rem' }}>Bâtiment</Typography>
                    <Typography sx={{ fontWeight: 600, color: GREEN_DARK, fontSize: '0.9rem' }}>
                      {getBatimentNom(selectedLotDetails.batimentId)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.75rem' }}>Nombre initial</Typography>
                    <Typography sx={{ fontWeight: 600, color: GREEN_DARK, fontSize: '0.9rem' }}>
                      {selectedLotDetails.nbInitial} sujets
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.75rem' }}>Type de volailles</Typography>
                    <Typography sx={{ fontWeight: 600, color: GREEN_DARK, fontSize: '0.9rem' }}>
                      {selectedLotDetails.typeVolailles || 'Standard'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* ── Bouton Ajouter ── */}
          {canAdd && (
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
                Nouvelle intervention
              </Button>
            </Box>
          )}

          {/* ── Tableau des interventions ── */}
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
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }}>Responsable</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }}>Produits</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interventions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#9ca3af', fontSize: '0.88rem' }}>
                        <MedicalServices sx={{ fontSize: 40, mb: 1, color: '#9ca3af' }} />
                        <Typography>Aucune intervention enregistrée pour ce lot</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    interventions.map((intervention, idx) => (
                      <TableRow 
                        key={intervention.id} 
                        sx={{ 
                          '&:hover': { background: GREEN_GHOST },
                          background: idx % 2 === 0 ? '#fff' : '#fafafa',
                        }}
                      >
                        <TableCell>
                          <Typography sx={{ fontSize: '0.88rem' }}>
                            {intervention.date?.toDate?.().toLocaleDateString('fr-FR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={intervention.type} 
                            color={getTypeColor(intervention.type)}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {intervention.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.85rem' }}>{intervention.responsable || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.85rem' }}>{intervention.produits || '-'}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Voir les détails">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedIntervention(intervention);
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
                            
                            {canEdit && (
                              <Tooltip title="Modifier">
                                <IconButton
                                  size="small"
                                  onClick={() => { 
                                    setEditing(intervention); 
                                    setFormData({
                                      ...intervention,
                                      date: intervention.date?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
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
                            )}
                            
                            {canDelete && (
                              <Tooltip title="Supprimer">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(intervention)}
                                  sx={{
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    '&:hover': { background: '#fef2f2' },
                                  }}
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
            Sélectionnez un lot pour voir les interventions
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
            Veuillez créer un lot dans la section "Lots" avant d'enregistrer des interventions
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
          {editing ? '✏️ Modifier l\'intervention' : '🏥 Nouvelle intervention'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ '&.Mui-focused': { color: GREEN_MAIN } }}>Type d'intervention</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              label="Type d'intervention"
              sx={{
                borderRadius: '10px',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: GREEN_MAIN },
              }}
            >
              {typesIntervention.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth 
            label="Date" 
            type="date" 
            margin="normal"
            value={formData.date} 
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            InputLabelProps={{ shrink: true }}
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
            label="Description" 
            margin="normal" 
            multiline 
            rows={2}
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description détaillée de l'intervention..."
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
            label="Responsable" 
            margin="normal"
            value={formData.responsable} 
            onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
            placeholder="Nom du responsable"
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
            label="Produits utilisés" 
            margin="normal"
            value={formData.produits} 
            onChange={(e) => setFormData({ ...formData, produits: e.target.value })}
            placeholder="Médicaments, vaccins, produits..."
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
            label="Durée" 
            margin="normal"
            value={formData.duree} 
            onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
            placeholder="Ex: 2 heures, 3 jours..."
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
            label="Commentaires" 
            margin="normal" 
            multiline 
            rows={2}
            value={formData.commentaires} 
            onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
            placeholder="Informations complémentaires..."
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
          Détail de l'intervention
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {selectedIntervention && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Type
                </Typography>
                <Chip label={selectedIntervention.type} color={getTypeColor(selectedIntervention.type)} size="small" />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Date
                </Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{selectedIntervention.date?.toDate?.().toLocaleDateString('fr-FR')}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Description
                </Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{selectedIntervention.description || '-'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Responsable
                </Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{selectedIntervention.responsable || '-'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Produits utilisés
                </Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{selectedIntervention.produits || '-'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Durée
                </Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{selectedIntervention.duree || '-'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: GREEN_MAIN, fontWeight: 700, mb: 0.5 }}>
                  Commentaires
                </Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{selectedIntervention.commentaires || '-'}</Typography>
              </Box>
              
              <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${GREEN_SOFT}` }}>
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                  Créé par: {selectedIntervention.createdByName || 'Inconnu'}
                </Typography>
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