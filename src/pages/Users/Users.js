import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Alert, Chip, MenuItem, Typography, Tooltip, Grid
} from '@mui/material';
import { Add, Edit, Delete, Refresh, AdminPanelSettings, Security, Warning } from '@mui/icons-material';
import { db, auth } from '../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

// ── palette ───────────────────────────────────────────────────────────────────
const GREEN_DARK  = '#14532d';
const GREEN_MID   = '#166534';
const GREEN_MAIN  = '#16a34a';
const GREEN_GHOST = '#f0fdf4';
const GREEN_SOFT  = '#dcfce7';

// Email du super admin (ne peut pas être supprimé)
const SUPER_ADMIN_EMAIL = 'admin@avibiotech.com';

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

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', nom: '', role: 'technicien' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Vérifier si l'utilisateur connecté est le super admin
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  // Vérifier si un utilisateur est le super admin
  const isUserSuperAdmin = (userEmail) => userEmail === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsers(usersData);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!formData.email || !formData.nom) {
      setError('Email et nom sont requis');
      return;
    }

    try {
      if (editing) {
        // Vérifier si on essaie de modifier le super admin
        if (isUserSuperAdmin(editing.email) && !isSuperAdmin) {
          setError('Vous ne pouvez pas modifier le compte super administrateur');
          return;
        }
        
        await setDoc(doc(db, 'users', editing.id), {
          email: formData.email,
          nom: formData.nom,
          role: formData.role,
          updatedAt: new Date()
        }, { merge: true });
        setSuccess('Utilisateur modifié');
      } else {
        if (!formData.password) {
          setError('Mot de passe requis pour un nouvel utilisateur');
          return;
        }
        
        // Vérifier si l'email existe déjà
        const existingUser = users.find(u => u.email === formData.email);
        if (existingUser) {
          setError('Cet email est déjà utilisé');
          return;
        }
        
        const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: formData.email,
          nom: formData.nom,
          role: formData.role,
          createdAt: new Date()
        });
        setSuccess('Utilisateur créé');
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
    // Vérifier si on essaie de supprimer le super admin
    if (isUserSuperAdmin(userToDelete.email)) {
      setError('Impossible de supprimer le compte super administrateur');
      return;
    }
    
    // Vérifier si on essaie de supprimer son propre compte
    if (userToDelete.email === user?.email) {
      setError('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    
    if (window.confirm(`Supprimer ${userToDelete.nom} ?`)) {
      try {
        await deleteDoc(doc(db, 'users', userToDelete.id));
        setSuccess('Utilisateur supprimé');
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
    switch(role) {
      case 'admin': return 'Administrateur';
      case 'responsable': return 'Responsable';
      case 'technicien': return 'Technicien';
      case 'veterinaire': return 'Vétérinaire';
      default: return role;
    }
  };

  // Statistiques
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const responsableCount = users.filter(u => u.role === 'responsable').length;
  const technicienCount = users.filter(u => u.role === 'technicien').length;
  const veterinaireCount = users.filter(u => u.role === 'veterinaire').length;

  return (
    <Box sx={{ maxWidth: 1100 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: GREEN_DARK, letterSpacing: '-0.3px' }}>
            Gestion des Utilisateurs
          </Typography>
          <Typography sx={{ fontSize: '0.88rem', color: '#6b7280', mt: 0.3 }}>
            Gérez les comptes utilisateurs et leurs permissions
          </Typography>
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton
            onClick={loadUsers}
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

      {/* ── Cartes de statistiques ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <StatCard 
            value={totalUsers} 
            label="Total utilisateurs" 
            icon="👥" 
            active={true}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard 
            value={adminCount} 
            label="Administrateurs" 
            icon="👑" 
            active={false}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <StatCard 
            value={responsableCount} 
            label="Responsables" 
            icon="🏗️" 
            active={false}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <StatCard 
            value={technicienCount} 
            label="Techniciens" 
            icon="🔧" 
            active={false}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <StatCard 
            value={veterinaireCount} 
            label="Vétérinaires" 
            icon="🏥" 
            active={false}
          />
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
          Nouvel utilisateur
        </Button>
      </Box>

      {/* ── Tableau des utilisateurs ── */}
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
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }}>Rôle</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: GREEN_DARK }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 6, color: '#9ca3af', fontSize: '0.88rem' }}>
                    <AdminPanelSettings sx={{ fontSize: 40, mb: 1, color: '#9ca3af' }} />
                    <Typography>Aucun utilisateur enregistré</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((userItem, idx) => {
                  const isSuperAdminUser = isUserSuperAdmin(userItem.email);
                  return (
                    <TableRow 
                      key={userItem.id} 
                      sx={{ 
                        '&:hover': { background: GREEN_GHOST },
                        background: idx % 2 === 0 ? '#fff' : '#fafafa',
                        ...(isSuperAdminUser && { background: GREEN_GHOST })
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isSuperAdminUser && (
                            <Tooltip title="Super Administrateur">
                              <Security sx={{ fontSize: 16, color: '#ef4444' }} />
                            </Tooltip>
                          )}
                          <Typography sx={{ 
                            fontSize: '0.88rem',
                            fontWeight: isSuperAdminUser ? 700 : 400,
                            color: isSuperAdminUser ? GREEN_DARK : '#374151'
                          }}>
                            {userItem.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.88rem' }}>{userItem.nom}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getRoleName(userItem.role)} 
                          color={getRoleColor(userItem.role)}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title={isSuperAdminUser && !isSuperAdmin ? "Modification impossible (Super Admin)" : "Modifier"}>
                            <span>
                              <IconButton 
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
                                sx={{
                                  borderRadius: '8px',
                                  color: (isSuperAdminUser && !isSuperAdmin) ? '#9ca3af' : GREEN_MAIN,
                                  '&:hover': { background: (isSuperAdminUser && !isSuperAdmin) ? 'transparent' : GREEN_SOFT },
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          
                          <Tooltip title={isSuperAdminUser ? "Suppression impossible (Super Admin)" : (userItem.email === user?.email ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer")}>
                            <span>
                              <IconButton 
                                onClick={() => handleDelete(userItem)}
                                disabled={isSuperAdminUser || userItem.email === user?.email}
                                sx={{
                                  borderRadius: '8px',
                                  color: (isSuperAdminUser || userItem.email === user?.email) ? '#9ca3af' : '#ef4444',
                                  '&:hover': { background: (isSuperAdminUser || userItem.email === user?.email) ? 'transparent' : '#fef2f2' },
                                }}
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
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Dialogue d'ajout/modification ── */}
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
          {editing ? '✏️ Modifier l\'utilisateur' : '👤 Nouvel utilisateur'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth 
            label="Email" 
            type="email" 
            margin="normal"
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={editing && isUserSuperAdmin(formData.email) && !isSuperAdmin}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
            }}
          />
          
          {!editing && (
            <TextField
              fullWidth 
              label="Mot de passe" 
              type="password" 
              margin="normal"
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              helperText="Requis pour un nouvel utilisateur"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
              }}
            />
          )}
          
          <TextField
            fullWidth 
            label="Nom complet" 
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
            select 
            fullWidth 
            label="Rôle" 
            margin="normal"
            value={formData.role} 
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: GREEN_MAIN },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: GREEN_MAIN },
            }}
          >
            <MenuItem value="admin">Administrateur</MenuItem>
            <MenuItem value="responsable">Responsable d'élevage</MenuItem>
            <MenuItem value="technicien">Technicien</MenuItem>
            <MenuItem value="veterinaire">Vétérinaire</MenuItem>
          </TextField>
          
          {editing && isUserSuperAdmin(formData.email) && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: '10px' }}>
              <Security fontSize="small" /> Ce compte est le super administrateur. Certaines modifications sont limitées.
            </Alert>
          )}
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
    </Box>
  );
}