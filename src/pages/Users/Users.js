import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Chip, MenuItem, Typography, Tooltip, Grid, useTheme
} from '@mui/material';
import { Add, Edit, Delete, Refresh, AdminPanelSettings, Security } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { db, auth } from '../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

// Email du super admin (ne peut pas être supprimé)
const SUPER_ADMIN_EMAIL = 'admin@avibiotech.com';

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

export default function Users() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { settings } = useSettings();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', nom: '', role: 'technicien' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const isUserSuperAdmin = (userEmail) => userEmail === SUPER_ADMIN_EMAIL;

  const loadUsers = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!formData.email || !formData.nom) {
      setError(t('Email and name required'));
      return;
    }

    try {
      if (editing) {
        if (isUserSuperAdmin(editing.email) && !isSuperAdmin) {
          setError(t('Super Admin restriction'));
          return;
        }
        
        await setDoc(doc(db, 'users', editing.id), {
          email: formData.email,
          nom: formData.nom,
          role: formData.role,
          updatedAt: new Date()
        }, { merge: true });
        setSuccess(t('User updated'));
      } else {
        if (!formData.password) {
          setError(t('Password required new user'));
          return;
        }
        
        const existingUser = users.find(u => u.email === formData.email);
        if (existingUser) {
          setError(t('Email already used'));
          return;
        }
        
        const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: formData.email,
          nom: formData.nom,
          role: formData.role,
          createdAt: new Date()
        });
        setSuccess(t('User created'));
      }
      
      setOpen(false);
      setEditing(null);
      setFormData({ email: '', password: '', nom: '', role: 'technicien' });
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (userToDelete) => {
    if (isUserSuperAdmin(userToDelete.email)) {
      setError(t('Super Admin restriction'));
      return;
    }
    
    if (userToDelete.email === user?.email) {
      setError(t('Cannot delete self'));
      return;
    }
    
    if (window.confirm(t('Delete user confirmation', { name: userToDelete.nom }))) {
      try {
        await deleteDoc(doc(db, 'users', userToDelete.id));
        setSuccess(t('User deleted'));
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'error';
      case 'responsable': return 'warning';
      case 'technicien': return 'info';
      case 'veterinaire': return 'success';
      default: return 'default';
    }
  };

  const getRoleName = (role) => {
    return t(role.charAt(0).toUpperCase() + role.slice(1));
  };

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const responsableCount = users.filter(u => u.role === 'responsable').length;
  const veterinaireCount = users.filter(u => u.role === 'veterinaire').length;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800 }}>
            {t('User Management')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('User Subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title={t('Refresh')}>
            <IconButton
              onClick={loadUsers}
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
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ px: 3, py: 1.2, borderRadius: '12px' }}
          >
            {t('New User')}
          </Button>
        </Box>
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

      {/* ── Stat cards ── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard value={totalUsers} label={t('Total users')} icon="👥" active={true} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard value={adminCount} label={t('Administrators')} icon="👑" active={false} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard value={responsableCount} label={t('Responsibles')} icon="🏗️" active={false} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard value={veterinaireCount} label={t('Veterinarians')} icon="🏥" active={false} />
        </Grid>
      </Grid>

      {/* ── Table ── */}
      <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: '24px', overflow: 'hidden' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{t('Email')}</TableCell>
              <TableCell>{t('Full Name')}</TableCell>
              <TableCell>{t('Role')}</TableCell>
              <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>{t('ACTIONS')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 8 }}>
                    <AdminPanelSettings sx={{ fontSize: 48, mb: 2, color: 'text.secondary', opacity: 0.5 }} />
                    <Typography sx={{ color: 'text.secondary' }}>{t('No user recorded')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((userItem, idx) => {
                  const isSuperAdminUser = isUserSuperAdmin(userItem.email);
                  return (
                    <TableRow 
                      key={userItem.id} 
                      component={motion.tr}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      sx={{ 
                        '&:hover': { bgcolor: 'rgba(163, 230, 53, 0.04)' },
                        bgcolor: isSuperAdminUser ? 'rgba(239, 68, 68, 0.03)' : 'transparent'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ position: 'relative' }}>
                            <ChickenSmall size={28} color={isSuperAdminUser ? '#ef4444' : theme.palette.primary.main} />
                            {isSuperAdminUser && (
                              <Security sx={{ 
                                position: 'absolute', top: -5, right: -5, 
                                fontSize: 14, color: '#ef4444', 
                                bgcolor: '#fff', borderRadius: '50%' 
                              }} />
                            )}
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {userItem.email}
                            </Typography>
                            {isSuperAdminUser && (
                              <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 800 }}>
                                {t('Super Administrator')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>{userItem.nom}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getRoleName(userItem.role)} 
                          color={getRoleColor(userItem.role)}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell align={settings.language === 'ar' ? 'left' : 'right'}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: settings.language === 'ar' ? 'flex-start' : 'flex-end' }}>
                          <Tooltip title={isSuperAdminUser && !isSuperAdmin ? t('Modification impossible Super Admin') : t('Edit')}>
                            <span>
                              <IconButton 
                                size="small"
                                onClick={() => { 
                                  if (!isSuperAdminUser || isSuperAdmin) {
                                    setEditing(userItem); 
                                    setFormData({ 
                                      email: userItem.email, 
                                      password: '', 
                                      nom: userItem.nom, 
                                      role: userItem.role 
                                    }); 
                                    setOpen(true);
                                  }
                                }}
                                disabled={isSuperAdminUser && !isSuperAdmin}
                                sx={{ color: theme.palette.primary.main }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          
                          <Tooltip title={isSuperAdminUser ? t('Deletion impossible Super Admin') : (userItem.email === user?.email ? t('Cannot delete self') : t('Delete'))}>
                            <span>
                              <IconButton 
                                size="small"
                                onClick={() => handleDelete(userItem)}
                                disabled={isSuperAdminUser || userItem.email === user?.email}
                                sx={{ color: theme.palette.error.main }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
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
          {editing ? t('Edit User') : t('Create User')}
        </DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth 
            label={t('Email')} 
            type="email" 
            margin="normal"
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={editing && isUserSuperAdmin(formData.email) && !isSuperAdmin}
          />
          
          {!editing && (
            <TextField
              fullWidth 
              label={t('Password')} 
              type="password" 
              margin="normal"
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              helperText={t('Password required new user')}
            />
          )}
          
          <TextField
            fullWidth 
            label={t('Full Name')} 
            margin="normal"
            value={formData.nom} 
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
          
          <TextField
            select 
            fullWidth 
            label={t('Role')} 
            margin="normal"
            value={formData.role} 
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <MenuItem value="admin">{t('Administrateur')}</MenuItem>
            <MenuItem value="responsable">{t('Responsable')}</MenuItem>
            <MenuItem value="technicien">{t('Technicien')}</MenuItem>
            <MenuItem value="veterinaire">{t('Vétérinaire')}</MenuItem>
          </TextField>
          
          {editing && isUserSuperAdmin(formData.email) && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: '12px' }}>
              <Security fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} /> 
              {t('Super Admin info alert')}
            </Alert>
          )}
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
    </Box>
  );
}