import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Chip, Typography, Tooltip
} from '@mui/material';
import { Add, Edit, Delete, AddCircle, RemoveCircle, Warning, Inventory } from '@mui/icons-material';
import { getStocks, addStock, updateStock, deleteStock } from '../../services/firestore';

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

export default function Stocks() {
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

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      const data = await getStocks();
      setStocks(data);
    } catch (err) {
      console.error("Erreur chargement stocks:", err);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!formData.nom || !formData.quantite) {
      setError('Nom et quantité sont requis');
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
        setSuccess('Stock modifié');
      } else {
        await addStock({
          nom: formData.nom,
          quantite: parseFloat(formData.quantite),
          seuilAlerte: parseFloat(formData.seuilAlerte) || 0,
          unite: formData.unite
        });
        setSuccess('Stock ajouté');
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
    if (window.confirm(`Supprimer ${stock.nom} ?`)) {
      try {
        await deleteStock(stock.id);
        setSuccess('Stock supprimé');
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
      setError('Quantité invalide');
      return;
    }

    let nouvelleQuantite;
    if (mouvementType === 'entree') {
      nouvelleQuantite = selectedStock.quantite + quantite;
    } else {
      if (selectedStock.quantite < quantite) {
        setError(`Stock insuffisant ! Il reste ${selectedStock.quantite} ${selectedStock.unite}`);
        return;
      }
      nouvelleQuantite = selectedStock.quantite - quantite;
    }

    try {
      await updateStock(selectedStock.id, {
        ...selectedStock,
        quantite: nouvelleQuantite
      });
      
      setSuccess(`${mouvementType === 'entree' ? '➕ Ajout' : '➖ Retrait'} de ${quantite} ${selectedStock.unite} effectué`);
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

  // Calcul des statistiques
  const totalProduits = stocks.length;
  const produitsFaibles = stocks.filter(s => isLowStock(s.quantite, s.seuilAlerte)).length;
  const valeurStockTotal = stocks.reduce((sum, s) => sum + (Number(s.quantite) || 0), 0);

  return (
    <Box sx={{ maxWidth: 1100 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: GREEN_DARK, letterSpacing: '-0.3px' }}>
            Gestion des Stocks
          </Typography>
          <Typography sx={{ fontSize: '0.88rem', color: '#6b7280', mt: 0.3 }}>
            Gérez vos produits d'élevage et suivez les niveaux de stock
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
          Nouveau produit
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
          { label: 'Total produits', value: totalProduits, icon: '📦' },
          { label: 'Produits en alerte', value: produitsFaibles, icon: '⚠️' },
          { label: 'Quantité totale', value: valeurStockTotal.toLocaleString('fr-FR'), icon: '📊' },
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
                {['Produit', 'Quantité', 'Unité', 'Seuil alerte', 'Statut', 'Actions'].map((h) => (
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
              {stocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#9ca3af', fontSize: '0.88rem' }}>
                    📦 Aucun produit dans le stock. Ajoutez votre premier produit.
                  </TableCell>
                </TableRow>
              ) : (
                stocks.map((stock, idx) => {
                  const lowStock = isLowStock(stock.quantite, stock.seuilAlerte);
                  return (
                    <TableRow
                      key={stock.id}
                      sx={{
                        '&:hover': { background: GREEN_GHOST },
                        background: lowStock 
                          ? '#fffbeb' 
                          : idx % 2 === 0 ? '#fff' : '#fafafa',
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
                            <ChickenSmall size={18} color={GREEN_MAIN} />
                          </Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: GREEN_DARK }}>
                            {stock.nom}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ 
                          fontWeight: 700, 
                          fontSize: '0.88rem', 
                          color: lowStock ? '#ef4444' : '#374151' 
                        }}>
                          {stock.quantite.toLocaleString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.88rem', color: '#6b7280' }}>
                          {stock.unite || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.88rem', color: '#6b7280' }}>
                          {stock.seuilAlerte || 0} {stock.unite}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {lowStock ? (
                          <Chip 
                            icon={<Warning sx={{ fontSize: '0.9rem' }} />} 
                            label="Stock faible" 
                            size="small"
                            sx={{
                              background: '#fef3c7',
                              color: '#92400e',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              height: 24,
                              '& .MuiChip-icon': { color: '#f59e0b' }
                            }}
                          />
                        ) : (
                          <Chip 
                            label="OK" 
                            size="small"
                            sx={{
                              background: GREEN_SOFT,
                              color: GREEN_DARK,
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              height: 24,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Ajouter au stock">
                            <IconButton
                              size="small"
                              onClick={() => openMouvementDialog(stock, 'entree')}
                              sx={{
                                borderRadius: '8px',
                                color: '#16a34a',
                                '&:hover': { background: GREEN_SOFT },
                              }}
                            >
                              <AddCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Retirer du stock">
                            <IconButton
                              size="small"
                              onClick={() => openMouvementDialog(stock, 'sortie')}
                              sx={{
                                borderRadius: '8px',
                                color: '#ef4444',
                                '&:hover': { background: '#fef2f2' },
                              }}
                            >
                              <RemoveCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Modifier">
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
                              onClick={() => handleDelete(stock)}
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

      {/* ── Dialogue d'ajout/modification produit ── */}
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
          {editing ? '✏️ Modifier le produit' : '📦 Nouveau produit'}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.84rem' }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth 
            label="Nom du produit" 
            margin="normal"
            value={formData.nom} 
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
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
            label="Quantité" 
            type="number" 
            margin="normal"
            value={formData.quantite} 
            onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
            required
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
            label="Unité" 
            margin="normal"
            value={formData.unite} 
            onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
            placeholder="kg, litres, doses, flacons..."
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
            label="Seuil d'alerte" 
            type="number" 
            margin="normal"
            value={formData.seuilAlerte} 
            onChange={(e) => setFormData({ ...formData, seuilAlerte: e.target.value })}
            helperText="Alerte quand la quantité est inférieure ou égale à ce seuil"
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

      {/* ── Dialogue pour les entrées/sorties ── */}
      <Dialog
        open={openMouvement}
        onClose={() => setOpenMouvement(false)}
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
          color: mouvementType === 'entree' ? '#16a34a' : '#ef4444',
          pb: 0,
          borderBottom: `1px solid ${GREEN_SOFT}`,
          mb: 1,
        }}>
          {mouvementType === 'entree' ? '➕ Ajouter au stock' : '➖ Retirer du stock'}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.84rem' }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ 
            p: 2, 
            mb: 2, 
            borderRadius: '10px', 
            background: GREEN_GHOST,
            border: `1px solid ${GREEN_SOFT}`
          }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Produit:</strong> {selectedStock?.nom}
            </Typography>
            <Typography variant="body2">
              <strong>Stock actuel:</strong> {selectedStock?.quantite} {selectedStock?.unite}
            </Typography>
          </Box>
          
          <TextField
            fullWidth 
            label="Quantité" 
            type="number" 
            margin="normal"
            value={mouvementQuantite}
            onChange={(e) => setMouvementQuantite(e.target.value)}
            required
            autoFocus
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
            label="Raison (optionnel)" 
            margin="normal"
            value={mouvementRaison}
            onChange={(e) => setMouvementRaison(e.target.value)}
            placeholder={mouvementType === 'entree' ? "Livraison, Réapprovisionnement..." : "Consommation, Péremption, Don..."}
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
            onClick={() => setOpenMouvement(false)}
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
            onClick={handleMouvement}
            sx={{
              background: mouvementType === 'entree' 
                ? 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
              borderRadius: '10px', 
              textTransform: 'none', 
              fontWeight: 700,
              '&:hover': {
                background: mouvementType === 'entree' 
                  ? 'linear-gradient(135deg, #14532d 0%, #0d3d1a 100%)'
                  : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
              },
            }}
          >
            {mouvementType === 'entree' ? 'Ajouter' : 'Retirer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}