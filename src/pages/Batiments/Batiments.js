// Dans Batiments.js, remplacez l'icône Home dans la table par ChickenSmall

import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Typography, Chip, Tooltip
} from '@mui/material';
import { Add, Edit, Delete, Home } from '@mui/icons-material';
import { getBatiments, addBatiment, updateBatiment, deleteBatiment } from '../../services/firestore';

// Ajouter le composant ChickenSmall (à copier depuis Sidebar)
function ChickenSmall({ size = 20, color = '#86efac' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="40" rx="18" ry="14" fill={color} opacity="0.9"/>
      <circle cx="44" cy="22" r="10" fill={color} opacity="0.9"/>
      <path d="M41 13 Q43 8 45 13 Q47 7 49 13" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M53 23 L58 21 L53 25 Z" fill="#f59e0b"/>
      <circle cx="47" cy="21" r="2" fill="#14532d"/>
      <ellipse cx="52" cy="26" rx="2.5" ry="3.5" fill="#ef4444" opacity="0.9"/>
    </svg>
  );
}

// ── palette ───────────────────────────────────────────────────────────────────
const GREEN_DARK  = '#14532d';
const GREEN_MID   = '#166534';
const GREEN_MAIN  = '#16a34a';
const GREEN_GHOST = '#f0fdf4';
const GREEN_SOFT  = '#dcfce7';

export default function Batiments() {
  const [batiments, setBatiments]   = useState([]);
  const [open, setOpen]             = useState(false);
  const [editing, setEditing]       = useState(null);
  const [formData, setFormData]     = useState({ nom: '', capacite: '', surface: '', typeElevage: '' });
  const [error, setError]           = useState('');
 
  useEffect(() => { loadBatiments(); }, []);
 
  const loadBatiments = async () => {
    const data = await getBatiments();
    setBatiments(data);
  };
 
  const handleOpen = (b = null) => {
    setEditing(b);
    setFormData(b ? { nom: b.nom, capacite: b.capacite, surface: b.surface, typeElevage: b.typeElevage || '' }
                  : { nom: '', capacite: '', surface: '', typeElevage: '' });
    setError('');
    setOpen(true);
  };
 
  const handleClose = () => { setOpen(false); setEditing(null); setError(''); };
 
  const handleSave = async () => {
    if (!formData.nom || !formData.capacite) {
      setError('Nom et capacité sont requis');
      return;
    }
    if (editing) {
      await updateBatiment(editing.id, formData);
    } else {
      await addBatiment(formData);
    }
    handleClose();
    loadBatiments();
  };
 
  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce bâtiment ?')) {
      await deleteBatiment(id);
      loadBatiments();
    }
  };
 
  return (
    <Box sx={{ maxWidth: 1100 }}>
 
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: GREEN_DARK, letterSpacing: '-0.3px' }}>
            Bâtiments
          </Typography>
          <Typography sx={{ fontSize: '0.88rem', color: '#6b7280', mt: 0.3 }}>
            Gérez vos bâtiments d'élevage et leurs capacités
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
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
          Nouveau bâtiment
        </Button>
      </Box>
 
      {/* ── Summary cards ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total bâtiments', value: batiments.length, icon: '🏗️' },
          { label: 'Capacité totale', value: `${batiments.reduce((s, b) => s + (Number(b.capacite) || 0), 0).toLocaleString('fr-FR')} sujets`, icon: '🐔' },
          { label: 'Surface totale',  value: `${batiments.reduce((s, b) => s + (Number(b.surface)   || 0), 0).toLocaleString('fr-FR')} m²`,    icon: '📐' },
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
                {['Nom', 'Capacité', 'Surface', "Type d'élevage", 'Actions'].map((h) => (
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
              {batiments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#9ca3af', fontSize: '0.88rem' }}>
                    🏗️ Aucun bâtiment enregistré. Ajoutez votre premier bâtiment.
                  </TableCell>
                </TableRow>
              ) : batiments.map((b, idx) => (
                <TableRow
                  key={b.id}
                  sx={{
                    '&:hover': { background: GREEN_GHOST },
                    background: idx % 2 === 0 ? '#fff' : '#fafafa',
                    transition: 'background 0.15s',
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
                        {/* Remplacement de Home par ChickenSmall */}
                        <ChickenSmall size={18} color={GREEN_MAIN} />
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: GREEN_DARK }}>
                        {b.nom}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#374151' }}>
                      {Number(b.capacite).toLocaleString('fr-FR')}
                      <Typography component="span" sx={{ fontSize: '0.75rem', color: '#9ca3af', ml: 0.5 }}>
                        sujets
                      </Typography>
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.88rem', color: '#374151' }}>
                      {b.surface}
                      <Typography component="span" sx={{ fontSize: '0.75rem', color: '#9ca3af', ml: 0.5 }}>
                        m²
                      </Typography>
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={b.typeElevage || 'Standard'}
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
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(b)}
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
                          onClick={() => handleDelete(b.id)}
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
        onClose={handleClose}
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
          {editing ? '✏️ Modifier le bâtiment' : '🏗️ Nouveau bâtiment'}
        </DialogTitle>
 
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.84rem' }}>
              {error}
            </Alert>
          )}
          {[
            { label: 'Nom du bâtiment', key: 'nom', type: 'text', placeholder: 'ex: Bâtiment A' },
            { label: 'Capacité (nombre de sujets)', key: 'capacite', type: 'number', placeholder: 'ex: 5000' },
            { label: 'Surface (m²)', key: 'surface', type: 'number', placeholder: 'ex: 500' },
            { label: "Type d'élevage", key: 'typeElevage', type: 'text', placeholder: 'ex: Poulet de chair' },
          ].map(f => (
            <TextField
              key={f.key}
              fullWidth
              label={f.label}
              type={f.type}
              placeholder={f.placeholder}
              margin="normal"
              value={formData[f.key]}
              onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
              }}
            />
          ))}
        </DialogContent>
 
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleClose}
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