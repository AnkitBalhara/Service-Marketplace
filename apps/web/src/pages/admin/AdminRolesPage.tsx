import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import {
  Shield,
  Plus,
  Edit,
  UserPlus,
  CheckCircle2,
  Lock,
  Users,
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';

export const AdminRolesPage: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Role Create/Edit Modal State
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  // Sub-Admin Modal State
  const [subAdminModalOpen, setSubAdminModalOpen] = useState<boolean>(false);
  const [subAdminForm, setSubAdminForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    phone: '',
    roleId: '',
  });

  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchRolesAndPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/admin/roles');
      setRoles(data.data.roles || []);
      setPermissions(data.data.permissions || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, [fetchRolesAndPermissions]);

  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      description: '',
      permissions: [],
    });
    setModalError(null);
    setRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: any) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions || [],
    });
    setModalError(null);
    setRoleModalOpen(true);
  };

  const handleTogglePermission = (slug: string) => {
    setRoleForm((prev) => {
      const exists = prev.permissions.includes(slug);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== slug)
          : [...prev.permissions, slug],
      };
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    try {
      if (editingRole) {
        await apiClient.patch(`/admin/roles/${editingRole._id}`, {
          description: roleForm.description,
          permissions: roleForm.permissions,
        });
        setSuccessMsg(`Role ${editingRole.name} updated. Changes take effect on users' very next request!`);
      } else {
        await apiClient.post('/admin/roles', roleForm);
        setSuccessMsg(`Custom role ${roleForm.name} created successfully.`);
      }
      setRoleModalOpen(false);
      fetchRolesAndPermissions();
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to save role');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleOpenCreateSubAdmin = () => {
    setSubAdminForm({
      name: '',
      email: '',
      password: 'Password123!',
      phone: '',
      roleId: roles.length > 0 ? roles[0]._id : '',
    });
    setModalError(null);
    setSubAdminModalOpen(true);
  };

  const handleSaveSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    try {
      await apiClient.post('/admin/sub-admins', subAdminForm);
      setSuccessMsg(`Sub-Admin account for ${subAdminForm.email} created.`);
      setSubAdminModalOpen(false);
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to create sub-admin');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc: Record<string, any[]>, perm) => {
    const res = perm.resource || 'other';
    if (!acc[res]) acc[res] = [];
    acc[res].push(perm);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Data-Driven Roles & Permissions (M2 RBAC)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Roles are database entities bundling granular resource.action slugs. Dynamic revocation takes effect instantly without server restart.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              onClick={handleOpenCreateSubAdmin}
              startIcon={<UserPlus className="w-4 h-4" />}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
            >
              Create Sub-Admin
            </Button>

            <Button
              variant="contained"
              onClick={handleOpenCreateRole}
              startIcon={<Plus className="w-4 h-4" />}
              sx={{
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              Create Custom Role
            </Button>
          </div>
        </div>

        {successMsg && (
          <Alert severity="success" onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {/* Roles List */}
        {isLoading ? (
          <LoadingScreen message="Loading dynamic roles & permission matrix..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => {
              const isSuper = role.name === 'SUPER_ADMIN';

              return (
                <div
                  key={role._id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-900 text-base">{role.name}</h3>
                      </div>
                      <Chip
                        label={role.isSystem ? 'SYSTEM' : 'CUSTOM'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: role.isSystem ? '#f1f5f9' : '#e0e7ff',
                          color: role.isSystem ? '#475569' : '#4338ca',
                        }}
                      />
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                      {role.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                        {isSuper ? 'Bypasses All Permission Checks' : `Effective Permissions (${role.permissions?.length || 0})`}
                      </span>

                      {isSuper ? (
                        <div className="p-2.5 bg-purple-50 text-purple-900 rounded-lg text-xs font-semibold flex items-center gap-2">
                          <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>SUPER_ADMIN bypasses every server guard check</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                          {role.permissions?.map((slug: string) => (
                            <span
                              key={slug}
                              className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200"
                            >
                              {slug}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isSuper && (
                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenEditRole(role)}
                        startIcon={<Edit className="w-3.5 h-3.5" />}
                        sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: '6px' }}
                      >
                        Edit Permissions
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Create/Edit Dialog with Permission Checkbox Matrix */}
      <Dialog open={roleModalOpen} onClose={() => setRoleModalOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSaveRole}>
          <DialogTitle className="font-bold text-slate-900">
            {editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Role'}
          </DialogTitle>
          <DialogContent className="space-y-4 pt-2">
            {modalError && <Alert severity="error">{modalError}</Alert>}

            {!editingRole && (
              <TextField
                label="Role Identifier (e.g. CATALOGUE_MODERATOR, SUPPORT_AGENT)"
                fullWidth
                size="small"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                required
              />
            )}

            <TextField
              label="Role Description"
              fullWidth
              size="small"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              required
            />

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Select Permission Slugs:
              </span>

              <div className="max-h-96 overflow-y-auto space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                {Object.keys(permissionsByResource).map((resource) => (
                  <div key={resource} className="space-y-2">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide border-b border-indigo-100 block pb-1">
                      {resource}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {permissionsByResource[resource].map((p) => {
                        const isChecked = roleForm.permissions.includes(p.slug);
                        return (
                          <div
                            key={p.slug}
                            onClick={() => handleTogglePermission(p.slug)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start ${
                              isChecked
                                ? 'bg-indigo-50/80 border-indigo-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              size="small"
                              sx={{ p: 0, mr: 1, mt: 0.2, color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }}
                            />
                            <div className="text-left">
                              <span className="font-mono font-bold text-xs text-slate-900 block">{p.slug}</span>
                              <span className="text-[11px] text-slate-500">{p.description}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
          <DialogActions className="p-4 border-t border-slate-100">
            <Button onClick={() => setRoleModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={modalSubmitting}
              sx={{ backgroundColor: '#4f46e5', textTransform: 'none', fontWeight: 600 }}
            >
              {modalSubmitting ? 'Saving...' : 'Save Role & Slugs'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Create Sub-Admin Dialog */}
      <Dialog open={subAdminModalOpen} onClose={() => setSubAdminModalOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSaveSubAdmin}>
          <DialogTitle className="font-bold text-slate-900">Create Sub-Admin User</DialogTitle>
          <DialogContent className="space-y-4 pt-2">
            {modalError && <Alert severity="error">{modalError}</Alert>}

            <TextField
              label="Full Name"
              fullWidth
              size="small"
              value={subAdminForm.name}
              onChange={(e) => setSubAdminForm({ ...subAdminForm, name: e.target.value })}
              required
            />

            <TextField
              label="Email Address"
              type="email"
              fullWidth
              size="small"
              value={subAdminForm.email}
              onChange={(e) => setSubAdminForm({ ...subAdminForm, email: e.target.value })}
              required
            />

            <TextField
              label="Initial Password"
              type="password"
              fullWidth
              size="small"
              value={subAdminForm.password}
              onChange={(e) => setSubAdminForm({ ...subAdminForm, password: e.target.value })}
              required
            />

            <TextField
              select
              label="Assign Role"
              fullWidth
              size="small"
              value={subAdminForm.roleId}
              onChange={(e) => setSubAdminForm({ ...subAdminForm, roleId: e.target.value })}
              required
            >
              {roles.map((r) => (
                <MenuItem key={r._id} value={r._id}>
                  {r.name} {r.isSystem ? '(System)' : '(Custom)'}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions className="p-4 border-t border-slate-100">
            <Button onClick={() => setSubAdminModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={modalSubmitting}
              sx={{ backgroundColor: '#4f46e5', textTransform: 'none', fontWeight: 600 }}
            >
              {modalSubmitting ? 'Creating...' : 'Create Sub-Admin'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};
