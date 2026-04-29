import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Typography, Chip, Tooltip, MenuItem
} from '@mui/material';
import { Add, Edit, Delete, CheckCircle, Cancel, Agriculture } from '@mui/icons-material';
import { getLots, addLot, updateLot, deleteLot, getBatiments } from '../../services/firestore';

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

export default function Lots() {
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
      setError('Bâtiment et nombre initial sont requis');
      return;
    }
    try {
      if (editing) {
        await updateLot(editing.id, formData);
        setSuccess('Lot modifié');
      } else {
        await addLot(formData);
        setSuccess('Lot ajouté');
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
    if (window.confirm('Supprimer ce lot ?')) {
      await deleteLot(id);
      loadLots();
    }
  };

  const handleChangeStatut = async (lot, nouveauStatut) => {
    const message = nouveauStatut === 'termine' 
      ? 'Confirmer la clôture de ce lot ?' 
      : 'Confirmer la réouverture de ce lot ?';
    
    if (window.confirm(message)) {
      try {
        await updateLot(lot.id, { ...lot, statut: nouveauStatut });
        setSuccess(`Lot ${nouveauStatut === 'termine' ? 'clôturé' : 'réouvert'} avec succès`);
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
      case 'actif': return '✅ Actif';
      case 'termine': return '📌 Terminé';
      default: return statut;
    }
  };

  // Obtenir le nom du bâtiment à partir de l'ID
  const getBatimentNom = (batimentId) => {
    const batiment = batiments.find(b => b.id === batimentId);
    return batiment ? batiment.nom : batimentId;
  };

  // Calcul des statistiques
  const lotsActifs = lots.filter(l => l.statut === 'actif').length;
  const lotsTermines = lots.filter(l => l.statut === 'termine').length;
  const totalVolailles = lots
    .filter(l => l.statut === 'actif')
    .reduce((sum, l) => sum + (Number(l.nbInitial) || 0), 0);

  return (
    <Box sx={{ maxWidth: 1100 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: GREEN_DARK, letterSpacing: '-0.3px' }}>
            Gestion des Lots
          </Typography>
          <Typography sx={{ fontSize: '0.88rem', color: '#6b7280', mt: 0.3 }}>
            Gérez vos lots d'élevage et suivez leur progression
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
          sx={{
            background: `linear-gradient(135deg, ${GREEN_MID} 0%, ${GREEN_DARK} 100%)`,
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.85rem',
            px: 2.5, py: 1,
            boxShadow: '0 4px 14px rgba(20,83,45,0.3)',
            '&:hover': {
              background: `linear-gradient(135deg, ${GREEN_DARK} 0%, #0d3d1a 100%)`,
              boxShadow: '0 6px 18px rgba(20,83,45,0.4)',
            },
          }}
        >
          Nouveau lot
        </Button>
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

      {/* ── Summary cards ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Lots actifs', value: lotsActifs, icon: '✅' },
          { label: 'Lots terminés', value: lotsTermines, icon: '📌' },
          { label: 'Volailles en élevage', value: totalVolailles.toLocaleString('fr-FR'), icon: '🐔' },
          { label: 'Total lots', value: lots.length, icon: '📊' },
        ].map((c, i) => (
          <Box key={i} sx={{
            flex: 1, minWidth: 160,
            p: 2, borderRadius: '14px',
            background: i === 0
              ? `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 100%)`
              : '#fff',
            border: i === 0 ? 'none' : '1px solid #e5e7eb',
            boxShadow: i === 0
              ? '0 4px 18px rgba(20,83,45,0.25)'
              : '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <Typography sx={{ fontSize: '1.1rem', mb: 0.5 }}>{c.icon}</Typography>
            <Typography sx={{
              fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1,
              color: i === 0 ? '#fff' : GREEN_DARK,
            }}>
              {c.value}
            </Typography>
            <Typography sx={{
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: i === 0 ? '#86efac' : '#9ca3af',
              mt: 0.3,
            }}>
              {c.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── Table ── */}
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
                {['Bâtiment', 'Nb initial', 'Date arrivée', 'Type', 'Statut', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{
                    fontWeight: 700, fontSize: '0.72rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: GREEN_DARK,
                    borderBottom: `2px solid ${GREEN_SOFT}`,
                    py: 1.5,
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {lots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#9ca3af', fontSize: '0.88rem' }}>
                    🐔 Aucun lot enregistré. Ajoutez votre premier lot.
                  </TableCell>
                </TableRow>
              ) : lots.map((lot, idx) => (
                <TableRow
                  key={lot.id}
                  sx={{
                    '&:hover': { background: GREEN_GHOST },
                    background: idx % 2 === 0 ? '#fff' : '#fafafa',
                    transition: 'background 0.15s',
                    opacity: lot.statut === 'termine' ? 0.7 : 1,
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '8px',
                        background: GREEN_SOFT,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <ChickenSmall size={18} color={GREEN_MAIN} />
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: GREEN_DARK }}>
                        {getBatimentNom(lot.batimentId)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#374151' }}>
                      {Number(lot.nbInitial).toLocaleString('fr-FR')}
                      <Typography component="span" sx={{ fontSize: '0.75rem', color: '#9ca3af', ml: 0.5 }}>
                        sujets
                      </Typography>
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.88rem', color: '#374151' }}>
                      {lot.dateArrivee?.toDate?.().toLocaleDateString('fr-FR') || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lot.typeVolailles || 'Standard'}
                      size="small"
                      sx={{
                        background: GREEN_SOFT,
                        color: GREEN_DARK,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        height: 22,
                        borderRadius: '6px',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatutText(lot.statut)} 
                      color={getStatutColor(lot.statut)}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        height: 24,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Modifier">
                        <IconButton 
                          size="small"
                          onClick={() => { 
                            setEditing(lot); 
                            setFormData({ 
                              ...lot, 
                              dateArrivee: lot.dateArrivee?.toDate?.().toISOString().split('T')[0] || '' 
                            }); 
                            setOpen(true);
                          }}
                          disabled={lot.statut === 'termine'}
                          sx={{
                            borderRadius: '8px',
                            color: lot.statut === 'termine' ? '#9ca3af' : GREEN_MAIN,
                            '&:hover': { background: GREEN_SOFT },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={lot.statut === 'actif' ? 'Clôturer le lot' : 'Rouvrir le lot'}>
                        <IconButton 
                          size="small"
                          onClick={() => handleChangeStatut(lot, lot.statut === 'actif' ? 'termine' : 'actif')}
                          sx={{
                            borderRadius: '8px',
                            color: lot.statut === 'actif' ? '#16a34a' : '#f59e0b',
                            '&:hover': { background: lot.statut === 'actif' ? GREEN_SOFT : '#fffbeb' },
                          }}
                        >
                          {lot.statut === 'actif' ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Supprimer">
                        <IconButton 
                          size="small"
                          onClick={() => handleDelete(lot.id)}
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Dialog ── */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
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
          {editing ? '✏️ Modifier le lot' : '🐔 Nouveau lot'}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.84rem' }}>
              {error}
            </Alert>
          )}
          
          <TextField
            select
            fullWidth
            label="Bâtiment"
            margin="normal"
            value={formData.batimentId}
            onChange={(e) => setFormData({ ...formData, batimentId: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
            }}
          >
            {batiments.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.nom}</MenuItem>
            ))}
          </TextField>
          
          <TextField 
            fullWidth 
            label="Nombre initial" 
            type="number" 
            margin="normal"
            value={formData.nbInitial} 
            onChange={(e) => setFormData({ ...formData, nbInitial: e.target.value })}
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
            label="Date d'arrivée" 
            type="date" 
            margin="normal"
            value={formData.dateArrivee} 
            onChange={(e) => setFormData({ ...formData, dateArrivee: e.target.value })}
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
            label="Type de volailles" 
            margin="normal"
            value={formData.typeVolailles} 
            onChange={(e) => setFormData({ ...formData, typeVolailles: e.target.value })}
            placeholder="ex: Poulet de chair, Pondeuse..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
            }}
          />
          
          {editing && (
            <TextField
              select
              fullWidth
              label="Statut"
              margin="normal"
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
              }}
            >
              <MenuItem value="actif">✅ Actif</MenuItem>
              <MenuItem value="termine">📌 Terminé</MenuItem>
            </TextField>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => {
              setOpen(false);
              setEditing(null);
              setError('');
            }}
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
    </Box>
  );
}