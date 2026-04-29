import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Alert, Typography,
  Grid, Chip
} from '@mui/material';
import { Add, Inventory, Warning, Egg } from '@mui/icons-material';
import { getLots, addProduction, getProduction, getStocks, updateStock, getBatiments } from '../../services/firestore';

const GREEN_DARK = '#14532d';
const GREEN_MID = '#166534';
const GREEN_MAIN = '#16a34a';
const GREEN_GHOST = '#f0fdf4';
const GREEN_SOFT = '#dcfce7';

function StatCard({ value, label, icon, active }) {
  return (
    <Box sx={{
      flex: 1, minWidth: 140, p: 2, borderRadius: '14px',
      background: active ? `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 100%)` : '#fff',
      border: active ? 'none' : '1px solid #e5e7eb',
      boxShadow: active ? '0 4px 18px rgba(20,83,45,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <Typography sx={{ fontSize: '1.1rem', mb: 0.5 }}>{icon}</Typography>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: active ? '#fff' : GREEN_DARK }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: active ? '#86efac' : '#9ca3af', mt: 0.3 }}>{label}</Typography>
    </Box>
  );
}

export default function Production() {
  const [lots, setLots] = useState([]);
  const [batiments, setBatiments] = useState([]);
  const [selectedLot, setSelectedLot] = useState('');
  const [selectedLotDetails, setSelectedLotDetails] = useState(null);
  const [productions, setProductions] = useState([]);
  const [stockActuel, setStockActuel] = useState(0);
  const [stockInfo, setStockInfo] = useState(null);
  const [formData, setFormData] = useState({ mortalite: '', consommationAliment: '', productionOeufs: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [totalConsommation, setTotalConsommation] = useState(0);
  const [totalMortalite, setTotalMortalite] = useState(0);
  const [totalOeufs, setTotalOeufs] = useState(0);

  useEffect(() => {
    loadLots();
    loadBatiments();
    loadStock();
  }, []);

  useEffect(() => {
    if (selectedLot) {
      loadProductions();
      const lot = lots.find(l => l.id === selectedLot);
      setSelectedLotDetails(lot);
    }
  }, [selectedLot, lots]);

  useEffect(() => {
    const totalCons = productions.reduce((sum, p) => sum + (p.consommationAliment || 0), 0);
    const totalMort = productions.reduce((sum, p) => sum + (p.mortalite || 0), 0);
    const totalOeuf = productions.reduce((sum, p) => sum + (p.productionOeufs || 0), 0);
    setTotalConsommation(totalCons);
    setTotalMortalite(totalMort);
    setTotalOeufs(totalOeuf);
  }, [productions]);

  const loadLots = async () => {
    const data = await getLots();
    setLots(data.filter(l => l.statut === 'actif'));
  };

  const loadBatiments = async () => {
    const data = await getBatiments();
    setBatiments(data);
  };

  const loadProductions = async () => {
    const data = await getProduction(selectedLot);
    setProductions(data);
  };

  const loadStock = async () => {
    try {
      const stocks = await getStocks();
      const stockAliment = stocks.find(s => s.nom === "Aliment démarrage" || s.nom === "Aliment croissance" || s.nom === "Aliment ponte" || s.nom.includes("Aliment"));
      if (stockAliment) {
        setStockActuel(stockAliment.quantite);
        setStockInfo(stockAliment);
      }
    } catch (err) {
      console.error("Erreur chargement stock:", err);
    }
  };

  const getBatimentNom = (batimentId) => {
    if (!batimentId) return 'Non assigné';
    const batiment = batiments.find(b => b.id === batimentId);
    return batiment ? batiment.nom : batimentId;
  };

  const isPondeuse = () => {
    return selectedLotDetails?.typeVolailles?.toLowerCase().includes('pondeuse') ||
           selectedLotDetails?.typeVolailles?.toLowerCase().includes('œuf') ||
           selectedLotDetails?.typeVolailles?.toLowerCase().includes('oeuf');
  };

  const diminuerStockAliment = async (quantiteConsommee) => {
    try {
      const stocks = await getStocks();
      const stockAliment = stocks.find(s => s.nom === "Aliment démarrage" || s.nom === "Aliment croissance" || s.nom === "Aliment ponte" || s.nom.includes("Aliment"));
      
      if (!stockAliment) {
        setError("❌ Stock d'aliment non trouvé");
        return false;
      }
      
      if (stockAliment.quantite < quantiteConsommee) {
        setError(`❌ Stock insuffisant ! Il reste ${stockAliment.quantite} ${stockAliment.unite || 'kg'}`);
        return false;
      }
      
      const nouvelleQuantite = stockAliment.quantite - quantiteConsommee;
      await updateStock(stockAliment.id, { ...stockAliment, quantite: nouvelleQuantite });
      setStockActuel(nouvelleQuantite);
      return true;
    } catch (err) {
      console.error("Erreur diminution stock:", err);
      setError("Erreur lors de la mise à jour du stock");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedLot) {
      setError('Veuillez sélectionner un lot');
      return;
    }
    
    const quantiteAliment = parseInt(formData.consommationAliment);
    const mortaliteValue = parseInt(formData.mortalite);
    const productionOeufsValue = parseInt(formData.productionOeufs);
    
    if (isNaN(quantiteAliment) || quantiteAliment <= 0) {
      setError('Quantité d\'aliment invalide');
      return;
    }
    
    if (isNaN(mortaliteValue) || mortaliteValue < 0) {
      setError('Mortalité invalide');
      return;
    }
    
    if (isPondeuse() && (isNaN(productionOeufsValue) || productionOeufsValue < 0)) {
      setError('Production d\'œufs invalide');
      return;
    }
    
    const stockOk = await diminuerStockAliment(quantiteAliment);
    if (!stockOk) return;
    
    const productionData = {
      mortalite: mortaliteValue,
      consommationAliment: quantiteAliment,
      date: new Date()
    };
    
    if (isPondeuse()) {
      productionData.productionOeufs = productionOeufsValue;
    }
    
    await addProduction(selectedLot, productionData);
    
    setSuccess(`✅ Données enregistrées - Stock restant: ${stockActuel - quantiteAliment} ${stockInfo?.unite || 'kg'}`);
    setFormData({ mortalite: '', consommationAliment: '', productionOeufs: '' });
    loadProductions();
    
    setTimeout(() => setSuccess(''), 3000);
  };

  const joursElevage = selectedLotDetails?.dateArrivee?.toDate 
    ? Math.floor((new Date() - selectedLotDetails.dateArrivee.toDate()) / (1000 * 60 * 60 * 24))
    : 0;

  const isStockFaible = stockActuel < 200;

  return (
    <Box sx={{ maxWidth: 1100 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: GREEN_DARK }}>Suivi de Production</Typography>
          <Typography sx={{ fontSize: '0.88rem', color: '#6b7280', mt: 0.3 }}>Enregistrez la mortalité, la consommation alimentaire et les œufs</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, borderRadius: '10px', background: isStockFaible ? '#fffbeb' : GREEN_GHOST, border: `1px solid ${isStockFaible ? '#fde68a' : GREEN_SOFT}` }}>
          <Inventory sx={{ color: isStockFaible ? '#f59e0b' : GREEN_MAIN, fontSize: 20 }} />
          <Box>
            <Typography sx={{ fontSize: '0.65rem', color: '#6b7280' }}>Stock aliment</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: isStockFaible ? '#f59e0b' : GREEN_DARK }}>
              {stockActuel} {stockInfo?.unite || 'kg'}
            </Typography>
          </Box>
          {isStockFaible && <Warning sx={{ color: '#f59e0b', fontSize: 18 }} />}
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', mb: 2 }}>Sélection du lot</Typography>
        <TextField select fullWidth label="Lot actif" value={selectedLot} onChange={(e) => setSelectedLot(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '&.Mui-focused fieldset': { borderColor: GREEN_MAIN } } }}>
          {lots.length === 0 ? (<MenuItem disabled>Aucun lot actif</MenuItem>) : (lots.map((l) => (<MenuItem key={l.id} value={l.id}>Lot du {l.dateArrivee?.toDate?.().toLocaleDateString('fr-FR') || 'N/A'} - Bâtiment: {getBatimentNom(l.batimentId)} - {l.nbInitial} sujets {l.typeVolailles && `(${l.typeVolailles})`}</MenuItem>)))}
        </TextField>
      </Paper>

      {selectedLot && selectedLotDetails && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e5e7eb', background: GREEN_GHOST }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', mb: 1.5 }}>INFORMATIONS DU LOT</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ color: '#6b7280', fontSize: '0.85rem' }}>Bâtiment:</Typography><Typography sx={{ fontWeight: 600, color: GREEN_DARK }}>{getBatimentNom(selectedLotDetails.batimentId)}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ color: '#6b7280', fontSize: '0.85rem' }}>Nombre initial:</Typography><Typography sx={{ fontWeight: 600, color: GREEN_DARK }}>{selectedLotDetails.nbInitial} sujets</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ color: '#6b7280', fontSize: '0.85rem' }}>Type de volailles:</Typography><Typography sx={{ fontWeight: 600, color: GREEN_DARK }}>{selectedLotDetails.typeVolailles || 'Standard'}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ color: '#6b7280', fontSize: '0.85rem' }}>Date d'arrivée:</Typography><Typography sx={{ fontWeight: 600, color: GREEN_DARK }}>{selectedLotDetails.dateArrivee?.toDate?.().toLocaleDateString('fr-FR') || 'N/A'}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ color: '#6b7280', fontSize: '0.85rem' }}>Jours d'élevage:</Typography><Chip label={`${joursElevage} jours`} size="small" sx={{ background: GREEN_SOFT, color: GREEN_DARK, fontWeight: 600 }} /></Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
                <StatCard value={totalMortalite} label="Mortalité totale" icon="📉" active={false} />
                <StatCard value={`${totalConsommation} kg`} label="Aliment consommé" icon="🌾" active={false} />
                {isPondeuse() && <StatCard value={totalOeufs} label="🥚 Œufs produits" icon="🥚" active={false} />}
              </Box>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', mb: 2 }}>Enregistrement quotidien</Typography>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={isPondeuse() ? 4 : 6}>
                  <TextField fullWidth label="Mortalité du jour" type="number" value={formData.mortalite} onChange={(e) => setFormData({ ...formData, mortalite: e.target.value })} required InputProps={{ inputProps: { min: 0 } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                </Grid>
                <Grid item xs={12} sm={isPondeuse() ? 4 : 6}>
                  <TextField fullWidth label="Consommation alimentaire (kg)" type="number" value={formData.consommationAliment} onChange={(e) => setFormData({ ...formData, consommationAliment: e.target.value })} required InputProps={{ inputProps: { min: 0 } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                </Grid>
                {isPondeuse() && (
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="🥚 Production d'œufs" type="number" value={formData.productionOeufs} onChange={(e) => setFormData({ ...formData, productionOeufs: e.target.value })} required InputProps={{ inputProps: { min: 0 } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} helperText="Nombre d'œufs pondus aujourd'hui" />
                  </Grid>
                )}
              </Grid>
              <Button type="submit" variant="contained" startIcon={<Add />} sx={{ mt: 3, background: `linear-gradient(135deg, ${GREEN_MID} 0%, ${GREEN_DARK} 100%)`, borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, py: 1 }}>Enregistrer les données</Button>
            </form>
          </Paper>

          {productions.length > 0 && (
            <Paper sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${GREEN_SOFT}` }}><Typography sx={{ fontWeight: 700, color: GREEN_DARK }}>📊 Historique des enregistrements</Typography></Box>
              <TableContainer>
                <Table>
                  <TableHead><TableRow sx={{ background: GREEN_GHOST }}>
                    <TableCell sx={{ fontWeight: 700, color: GREEN_DARK }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: GREEN_DARK }} align="center">Mortalité</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: GREEN_DARK }} align="center">Consommation (kg)</TableCell>
                    {isPondeuse() && <TableCell sx={{ fontWeight: 700, color: GREEN_DARK }} align="center">🥚 Œufs</TableCell>}
                  </TableRow></TableHead>
                  <TableBody>
                    {productions.map((p, idx) => (
                      <TableRow key={p.id} sx={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <TableCell>{p.date?.toDate?.().toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell align="center"><Chip label={p.mortalite} size="small" sx={{ background: p.mortalite > 0 ? '#fef2f2' : GREEN_SOFT, color: p.mortalite > 0 ? '#dc2626' : GREEN_DARK, fontWeight: 600 }} /></TableCell>
                        <TableCell align="center"><Typography sx={{ fontWeight: 600 }}>{p.consommationAliment} kg</Typography></TableCell>
                        {isPondeuse() && <TableCell align="center"><Typography sx={{ fontWeight: 600 }}>{p.productionOeufs || '-'}</Typography></TableCell>}
                      </TableRow>
                    ))}
                    <TableRow sx={{ background: GREEN_GHOST }}>
                      <TableCell sx={{ fontWeight: 700, color: GREEN_DARK }}>TOTAL</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: GREEN_DARK }}>{totalMortalite}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: GREEN_DARK }}>{totalConsommation} kg</TableCell>
                      {isPondeuse() && <TableCell align="center" sx={{ fontWeight: 700, color: GREEN_DARK }}>{totalOeufs}</TableCell>}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}