import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Typography, Chip, Tooltip, MenuItem,
  useTheme, Grid
} from '@mui/material';
import { Add, Edit, Delete, CheckCircle, Cancel, PictureAsPdf } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from 'notistack';
import { getLots, addLot, updateLot, deleteLot, getBatiments } from '../../services/firestore';
import { getInterventions, getSanteRecords, getProduction } from '../../services/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const { userRole } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // ── Permissions ──────────────────────────────────────────────────────────
  const isReadOnly = userRole === 'veterinaire' || userRole === 'technicien';
  const canManageReports = userRole === 'admin' || userRole === 'responsable';

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
  const [generatingReport, setGeneratingReport] = useState(false);

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
  if (isReadOnly) return;
  if (!formData.batimentId || !formData.nbInitial) {
    setError(t('Batch requirements'));
    return;
  }

  // Vérification : un seul lot actif par bâtiment
  if (!editing) {
    const lotActifExistant = lots.find(
      l => l.batimentId === formData.batimentId && l.statut === 'actif'
    );
    if (lotActifExistant) {
      const batiment = batiments.find(b => b.id === formData.batimentId);
      setError(
        `Le bâtiment "${batiment?.nom || formData.batimentId}" contient déjà un lot actif. ` +
        `Veuillez clôturer le lot en cours avant d'en créer un nouveau.`
      );
      return;
    }
  }

  try {
    if (editing) {
      await updateLot(editing.id, formData);
      enqueueSnackbar(t('Batch updated'), { variant: 'success' });
    } else {
      await addLot(formData);
      enqueueSnackbar(t('Batch added'), { variant: 'success' });
    }
    setOpen(false);
    setEditing(null);
    setFormData({ batimentId: '', nbInitial: '', dateArrivee: '', typeVolailles: '', statut: 'actif' });
    loadLots();
  } catch (err) {
    setError(err.message);
  }
};

  const handleDelete = async (id) => {
    if (isReadOnly) return;
    if (window.confirm(t('Delete batch confirmation'))) {
      await deleteLot(id);
      enqueueSnackbar(t('Batch deleted'), { variant: 'success' });
      loadLots();
    }
  };

  const handleChangeStatut = async (lot, nouveauStatut) => {
    if (isReadOnly) return;
    const message = nouveauStatut === 'termine'
      ? t('Close confirmation')
      : t('Reopen confirmation');
    if (window.confirm(message)) {
      try {
        await updateLot(lot.id, { ...lot, statut: nouveauStatut });
        enqueueSnackbar(nouveauStatut === 'termine' ? t('Batch closed') : t('Batch reopened'), { variant: 'success' });
        loadLots();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const generateReport = async (lot) => {
    setGeneratingReport(true);
    try {
      const [interventions, santeRecords, productions] = await Promise.all([
        getInterventions(lot.id),
        getSanteRecords(lot.id),
        getProduction(lot.id)
      ]);

      const batiment = batiments.find(b => b.id === lot.batimentId);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(163, 230, 53, 0.1);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(34, 34, 34);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(t('Batch Report'), pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`${t('Generated on')}: ${new Date().toLocaleDateString()}`, pageWidth / 2, 32, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(t('Batch Information'), 14, 55);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      const lotInfo = [
        [`${t('Building')}:`, batiment?.nom || lot.batimentId],
        [`${t('Arrival Date')}:`, lot.dateArrivee?.toDate?.().toLocaleDateString() || lot.dateArrivee || '-'],
        [`${t('Initial Number')}:`, `${lot.nbInitial} ${t('subjects')}`],
        [`${t('Poultry Type')}:`, lot.typeVolailles || t('Standard')],
        [`${t('Closing Date')}:`, lot.dateFermeture?.toDate?.().toLocaleDateString() || new Date().toLocaleDateString()],
        [`${t('Status')}:`, lot.statut === 'termine' ? t('Finished Status') : t('Active Status')]
      ];

      let yPos = 65;
      lotInfo.forEach(([label, value]) => {
        doc.text(`${label}`, 14, yPos);
        doc.text(`${value}`, 80, yPos);
        yPos += 7;
      });

      const totalMortalite = productions.reduce((sum, p) => sum + (p.mortalite || 0), 0);
      const totalConsommation = productions.reduce((sum, p) => sum + (p.consommationAliment || 0), 0);
      const totalOeufs = productions.reduce((sum, p) => sum + (p.productionOeufs || 0), 0);
      const nbFinal = (lot.nbInitial || 0) - totalMortalite;
      const tauxSurvie = lot.nbInitial > 0 ? ((nbFinal / lot.nbInitial) * 100).toFixed(1) : 0;

      yPos += 10;
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(14, yPos, 55, 30, 3, 3, 'F');
      doc.setFontSize(9); doc.setTextColor(80, 80, 80);
      doc.text(t('Final Count'), 41, yPos + 10, { align: 'center' });
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(34, 197, 94);
      doc.text(`${nbFinal}`, 41, yPos + 23, { align: 'center' });

      doc.setFillColor(240, 248, 255);
      doc.roundedRect(75, yPos, 55, 30, 3, 3, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
      doc.text(t('Survival Rate'), 102, yPos + 10, { align: 'center' });
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(34, 197, 94);
      doc.text(`${tauxSurvie}%`, 102, yPos + 23, { align: 'center' });

      doc.setFillColor(240, 248, 255);
      doc.roundedRect(136, yPos, 55, 30, 3, 3, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
      doc.text(t('Total Mortality'), 163, yPos + 10, { align: 'center' });
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(239, 68, 68);
      doc.text(`${totalMortalite}`, 163, yPos + 23, { align: 'center' });

      yPos += 45;

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, yPos, 85, 25, 3, 3, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
      doc.text(t('Feed Consumed'), 56, yPos + 8, { align: 'center' });
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
      doc.text(`${totalConsommation} kg`, 56, yPos + 19, { align: 'center' });

      const typeVolailles = lot.typeVolailles?.toLowerCase() || '';
      const isPondeuse = typeVolailles.includes('pondeuse') || typeVolailles.includes('œuf') || typeVolailles.includes('oeuf');

      if (isPondeuse) {
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(105, yPos, 85, 25, 3, 3, 'F');
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
        doc.text(t('Eggs Produced'), 147, yPos + 8, { align: 'center' });
        doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
        doc.text(`${totalOeufs}`, 147, yPos + 19, { align: 'center' });
      }

      if (interventions?.length > 0) {
        doc.addPage();
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
        doc.text(t('Interventions'), 14, 20);
        autoTable(doc, {
          startY: 28,
          head: [[t('Date'), t('Type'), t('Description'), t('Responsible'), t('Status')]],
          body: interventions.map(i => [
            i.date?.toDate?.().toLocaleDateString() || i.date || '-',
            t(i.type) || i.type,
            i.description?.substring(0, 40) || '-',
            i.responsable || '-',
            i.estTerminee ? t('Completed') : t('Pending')
          ]),
          theme: 'striped',
          headStyles: { fillColor: [163, 230, 53], textColor: [0, 0, 0], fontStyle: 'bold' },
          margin: { left: 14, right: 14 }
        });
      }

      if (santeRecords?.length > 0) {
        doc.addPage();
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
        doc.text(t('Health Records'), 14, 20);
        autoTable(doc, {
          startY: 28,
          head: [[t('Date'), t('Diagnosis'), t('Treatment'), t('Medicines')]],
          body: santeRecords.map(r => [
            r.date?.toDate?.().toLocaleDateString() || r.date || '-',
            r.diagnostic?.substring(0, 30) || '-',
            r.traitement?.substring(0, 30) || '-',
            r.medicaments || '-'
          ]),
          theme: 'striped',
          headStyles: { fillColor: [163, 230, 53], textColor: [0, 0, 0], fontStyle: 'bold' },
          margin: { left: 14, right: 14 }
        });
      }

      if (productions?.length > 0) {
        doc.addPage();
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
        doc.text(t('Production Records'), 14, 20);
        const productionHeaders = [t('Date'), t('Mortality'), t('Feed Consumed')];
        if (isPondeuse) productionHeaders.push(t('Eggs Produced'));
        autoTable(doc, {
          startY: 28,
          head: [productionHeaders],
          body: productions.map(p => {
            const row = [
              p.date?.toDate?.().toLocaleDateString() || p.date || '-',
              p.mortalite || '0',
              `${p.consommationAliment || 0} kg`
            ];
            if (isPondeuse) row.push(p.productionOeufs || '0');
            return row;
          }),
          theme: 'striped',
          headStyles: { fillColor: [163, 230, 53], textColor: [0, 0, 0], fontStyle: 'bold' },
          margin: { left: 14, right: 14 }
        });
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(150, 150, 150);
        doc.text(
          `${t('Generated by')}: ${userRole} - ${new Date().toLocaleString()}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`lot_${lot.id}_report.pdf`);
      enqueueSnackbar(t('Report generated successfully'), { variant: 'success' });
    } catch (error) {
      console.error('Erreur rapport:', error);
      enqueueSnackbar(t('Error generating report'), { variant: 'error' });
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'actif': return 'success';
      case 'termine': return 'default';
      default: return 'warning';
    }
  };

  const getStatutText = (statut) => {
    switch (statut) {
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

        {/* Bouton Nouveau lot — masqué pour vétérinaire et technicien */}
        {!isReadOnly && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ px: 3, py: 1.2, borderRadius: '12px' }}
          >
            {t('New Batch')}
          </Button>
        )}
      </Box>

      {/* Badge lecture seule */}
      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: '16px' }}>
          {t('Read only mode', { defaultValue: 'Mode lecture seule — vous pouvez consulter les lots mais pas les modifier.' })}
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
              {/* Colonne ACTIONS masquée pour lecture seule */}
              {!isReadOnly && (
                <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>{t('ACTIONS')}</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {lots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isReadOnly ? 5 : 6} sx={{ textAlign: 'center', py: 8 }}>
                    <Typography sx={{ color: 'text.secondary' }}>{t('No batch found')}</Typography>
                  </TableCell>
                </TableRow>
              ) : lots.map((lot) => (
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={getStatutText(lot.statut)}
                        color={getStatutColor(lot.statut)}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                      />
                      {lot.statut === 'termine' && canManageReports && (
                        <Tooltip title={t('Generate Report')}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => generateReport(lot)}
                              disabled={generatingReport}
                              sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                            >
                              <PictureAsPdf fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>

                  {/* Actions — masquées pour vétérinaire et technicien */}
                  {!isReadOnly && (
                    <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: settings.language === 'ar' ? 'flex-start' : 'flex-end' }}>
                        <Tooltip title={t('Edit')}>
                          <span>
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
                          </span>
                        </Tooltip>

                        <Tooltip title={lot.statut === 'actif' ? t('Close confirmation') : t('Reopen confirmation')}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleChangeStatut(lot, lot.statut === 'actif' ? 'termine' : 'actif')}
                              sx={{ color: lot.statut === 'actif' ? '#16a34a' : '#f59e0b' }}
                            >
                              {lot.statut === 'actif' ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title={t('Delete')}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(lot.id)}
                              sx={{ color: '#ef4444' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Dialog — inaccessible pour lecture seule ── */}
      {!isReadOnly && (
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ className: 'glass-card', sx: { borderRadius: '24px', p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>
            {editing ? t('Edit') + ' ' + t('Lots') : t('New Batch')}
          </DialogTitle>
          <DialogContent>
              {error && (
    <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError('')}>
      {error}
    </Alert>
  )}
            <TextField
              select fullWidth label={t('Building')} margin="normal"
              value={formData.batimentId}
              onChange={(e) => setFormData({ ...formData, batimentId: e.target.value })}
            >
              {batiments.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.nom}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth label={t('Initial Number')} type="number" margin="normal"
              value={formData.nbInitial}
              onChange={(e) => setFormData({ ...formData, nbInitial: e.target.value })}
            />
            <TextField
              fullWidth label={t('Arrival Date')} type="date" margin="normal"
              value={formData.dateArrivee}
              onChange={(e) => setFormData({ ...formData, dateArrivee: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth label={t('Poultry Type')} margin="normal"
              value={formData.typeVolailles}
              onChange={(e) => setFormData({ ...formData, typeVolailles: e.target.value })}
              placeholder={t('Poultry type placeholder')}
            />
            {editing && (
              <TextField
                select fullWidth label={t('STATUS')} margin="normal"
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
      )}
    </Box>
  );
}