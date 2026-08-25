import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, SEEDED_PERSONAS } from '../../contexts/AuthContext';
import {
  Menu,
  MenuItem,
  Button,
  Avatar,
  Chip,
  Divider,
  Popover,
  Box,
  Typography,
} from '@mui/material';
import {
  Sparkles,
  User,
  LogOut,
  Calendar,
  Layers,
  Shield,
  Briefcase,
  ChevronDown,
  Menu as MenuIcon,
  X,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Zap,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, quickLogin, isRole, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Dropdown states
  const [personaAnchor, setPersonaAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [vendorMenuAnchor, setVendorMenuAnchor] = useState<null | HTMLElement>(null);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePersonaSelect = async (email: string) => {
    setPersonaAnchor(null);
    setMobileMenuOpen(false);
    await quickLogin(email);
    navigate('/');
  };

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + Desktop Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">MarketPulse</span>
              <span className="text-[10px] block font-semibold uppercase tracking-wider text-indigo-600 -mt-1">
                Services Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/')
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Browse Services
            </Link>

            {/* Customer Bookings */}
            {isAuthenticated && (user?.role === 'CUSTOMER' || user?.role === 'SUPER_ADMIN') && (
              <Link
                to="/customer/bookings"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive('/customer/bookings')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                My Bookings
              </Link>
            )}

            {/* Vendor Portal Dropdown */}
            {isAuthenticated && (isRole('VENDOR') || user?.role === 'SUPER_ADMIN') && (
              <>
                <button
                  type="button"
                  onClick={(e) => setVendorMenuAnchor(e.currentTarget)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                    location.pathname.startsWith('/vendor')
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  Vendor Hub
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                <Menu
                  anchorEl={vendorMenuAnchor}
                  open={Boolean(vendorMenuAnchor)}
                  onClose={() => setVendorMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{ sx: { width: 220, borderRadius: '12px', mt: 1 } }}
                >
                  <MenuItem
                    onClick={() => {
                      setVendorMenuAnchor(null);
                      navigate('/vendor/dashboard');
                    }}
                    sx={{ fontSize: '0.8rem', py: 1 }}
                  >
                    <Building className="w-4 h-4 mr-2 text-indigo-600" />
                    Vendor Dashboard
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setVendorMenuAnchor(null);
                      navigate('/vendor/services');
                    }}
                    sx={{ fontSize: '0.8rem', py: 1 }}
                  >
                    <Layers className="w-4 h-4 mr-2 text-indigo-600" />
                    Services & Offerings
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setVendorMenuAnchor(null);
                      navigate('/vendor/availability');
                    }}
                    sx={{ fontSize: '0.8rem', py: 1 }}
                  >
                    <Clock className="w-4 h-4 mr-2 text-indigo-600" />
                    Availability & Closures
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setVendorMenuAnchor(null);
                      navigate('/vendor/bookings');
                    }}
                    sx={{ fontSize: '0.8rem', py: 1 }}
                  >
                    <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                    Vendor Appointments
                  </MenuItem>
                </Menu>
              </>
            )}

            {/* Admin Console Dropdown */}
            {isAuthenticated && (isRole('ADMIN', 'SUPER_ADMIN', 'CATALOGUE_MODERATOR') || hasPermission('admin.dashboard')) && (
              <>
                <button
                  type="button"
                  onClick={(e) => setAdminMenuAnchor(e.currentTarget)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  Admin Console
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                <Menu
                  anchorEl={adminMenuAnchor}
                  open={Boolean(adminMenuAnchor)}
                  onClose={() => setAdminMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{ sx: { width: 230, borderRadius: '12px', mt: 1 } }}
                >
                  <MenuItem
                    onClick={() => {
                      setAdminMenuAnchor(null);
                      navigate('/admin/dashboard');
                    }}
                    sx={{ fontSize: '0.8rem', py: 1 }}
                  >
                    <Shield className="w-4 h-4 mr-2 text-purple-600" />
                    Platform Dashboard
                  </MenuItem>
                  {hasPermission('vendor.approve') && (
                    <MenuItem
                      onClick={() => {
                        setAdminMenuAnchor(null);
                        navigate('/admin/vendors');
                      }}
                      sx={{ fontSize: '0.8rem', py: 1 }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2 text-amber-600" />
                      Vendor Approvals Queue
                    </MenuItem>
                  )}
                  {hasPermission('booking.view_all') && (
                    <MenuItem
                      onClick={() => {
                        setAdminMenuAnchor(null);
                        navigate('/admin/bookings');
                      }}
                      sx={{ fontSize: '0.8rem', py: 1 }}
                    >
                      <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                      Cross-Vendor Bookings
                    </MenuItem>
                  )}
                  {hasPermission('role.view') && (
                    <MenuItem
                      onClick={() => {
                        setAdminMenuAnchor(null);
                        navigate('/admin/roles');
                      }}
                      sx={{ fontSize: '0.8rem', py: 1 }}
                    >
                      <Shield className="w-4 h-4 mr-2 text-purple-600" />
                      Roles & Permissions (RBAC)
                    </MenuItem>
                  )}
                  {hasPermission('category.manage') && (
                    <MenuItem
                      onClick={() => {
                        setAdminMenuAnchor(null);
                        navigate('/admin/categories');
                      }}
                      sx={{ fontSize: '0.8rem', py: 1 }}
                    >
                      <FolderTree className="w-4 h-4 mr-2 text-teal-600" />
                      Category Hierarchy
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
          </nav>
        </div>

        {/* Right: Persona Switcher & User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Quick Persona Switcher (For Evaluators) */}
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setPersonaAnchor(e.currentTarget)}
            endIcon={<ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            startIcon={<Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
            sx={{
              borderColor: '#cbd5e1',
              color: '#1e293b',
              textTransform: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: '10px',
              px: 1.5,
              py: 0.6,
              bgcolor: '#ffffff',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              '&:hover': { borderColor: '#6366f1', bgcolor: '#f8fafc', boxShadow: '0 2px 4px 0 rgba(99, 102, 241, 0.15)' },
            }}
          >
            Switch Persona
          </Button>

          {/* Persona Popover with explicit Box layout and distinct cards */}
          <Popover
            open={Boolean(personaAnchor)}
            anchorEl={personaAnchor}
            onClose={() => setPersonaAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                width: 390,
                maxWidth: '94vw',
                borderRadius: '16px',
                mt: 1.5,
                p: 2,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
              },
            }}
          >
            {/* Header */}
            <Box sx={{ p: 1.5, mb: 2, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                  1-Click Persona Switcher
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5 }}>
                Switch personas to test different RBAC permissions & flows
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '65vh', overflowY: 'auto', pr: 0.5 }}>
              {/* Group 1: Customers */}
              <Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <User className="w-3.5 h-3.5" /> Customers (For Booking Services)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {SEEDED_PERSONAS.filter(p => p.key.startsWith('customer')).map(p => (
                    <Box
                      key={p.key}
                      onClick={() => handlePersonaSelect(p.email)}
                      sx={{
                        p: 1.5,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: user?.email === p.email ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        bgcolor: user?.email === p.email ? '#eff6ff' : '#ffffff',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', width: '100%' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', flexGrow: 1 }}>
                          {p.name}
                        </Typography>
                        <Chip
                          label={p.key === 'customer1' ? 'Active Bookings' : 'New Customer'}
                          size="small"
                          sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20, bgcolor: '#dbeafe', color: '#1d4ed8' }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.5 }}>
                        {p.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Group 2: Vendors */}
              <Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Building className="w-3.5 h-3.5" /> Vendors (For Managing Services & Slots)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {SEEDED_PERSONAS.filter(p => p.key.startsWith('vendor')).map(p => (
                    <Box
                      key={p.key}
                      onClick={() => handlePersonaSelect(p.email)}
                      sx={{
                        p: 1.5,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: user?.email === p.email ? '2px solid #10b981' : '1px solid #e2e8f0',
                        bgcolor: user?.email === p.email ? '#ecfdf5' : '#ffffff',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', flexGrow: 1 }}>
                          {p.name}
                        </Typography>
                        <Chip
                          label={p.key.includes('app') ? 'Approved' : p.key.includes('pend') ? 'Pending' : 'Rejected'}
                          size="small"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            height: 20,
                            bgcolor: p.key.includes('app') ? '#d1fae5' : p.key.includes('pend') ? '#fef3c7' : '#ffe4e6',
                            color: p.key.includes('app') ? '#047857' : p.key.includes('pend') ? '#b45309' : '#be123c',
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.5 }}>
                        {p.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Group 3: Admins */}
              <Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7c3aed', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Shield className="w-3.5 h-3.5" /> Admins (Platform Governance & RBAC)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {SEEDED_PERSONAS.filter(p => p.key === 'superadmin' || p.key === 'moderator').map(p => (
                    <Box
                      key={p.key}
                      onClick={() => handlePersonaSelect(p.email)}
                      sx={{
                        p: 1.5,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: user?.email === p.email ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                        bgcolor: user?.email === p.email ? '#f5f3ff' : '#ffffff',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', flexGrow: 1 }}>
                          {p.name}
                        </Typography>
                        <Chip
                          label={p.key === 'superadmin' ? 'Super Admin' : 'Sub-Admin (Moderator)'}
                          size="small"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            height: 20,
                            bgcolor: p.key === 'superadmin' ? '#ede9fe' : '#e0e7ff',
                            color: p.key === 'superadmin' ? '#6d28d9' : '#3730a3',
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.5 }}>
                        {p.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Popover>

          {/* User Profile or Sign In */}
          {isAuthenticated && user ? (
            <>
              <button
                type="button"
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
              >
                <Avatar sx={{ width: 34, height: 34, bgcolor: '#4f46e5', fontSize: '0.875rem', fontWeight: 700 }}>
                  {user.name?.charAt(0) || 'U'}
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">{user.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Profile Popover */}
              <Popover
                open={Boolean(userMenuAnchor)}
                anchorEl={userMenuAnchor}
                onClose={() => setUserMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: {
                    width: 260,
                    borderRadius: '16px',
                    mt: 1.5,
                    p: 1.5,
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                  },
                }}
              >
                {/* User Info Header Card */}
                <Box sx={{ p: 1.5, mb: 1.5, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#4f46e5', fontSize: '0.9rem', fontWeight: 800 }}>
                      {user.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography sx={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {user.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 1.2 }}>
                    <Chip
                      label={user.role}
                      size="small"
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        height: 22,
                        borderRadius: '6px',
                        bgcolor: user.role === 'SUPER_ADMIN' ? '#ede9fe' : user.role === 'VENDOR' ? '#d1fae5' : '#dbeafe',
                        color: user.role === 'SUPER_ADMIN' ? '#6d28d9' : user.role === 'VENDOR' ? '#047857' : '#1d4ed8',
                      }}
                    />
                  </Box>
                </Box>

                {/* Quick Navigation Links */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                  {(user.role === 'CUSTOMER' || user.role === 'SUPER_ADMIN') && (
                    <Box
                      onClick={() => {
                        setUserMenuAnchor(null);
                        navigate('/customer/bookings');
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 1.5,
                        py: 1,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#334155',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#f1f5f9', color: '#4f46e5' },
                      }}
                    >
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      My Bookings
                    </Box>
                  )}
                  {(user.role === 'VENDOR' || user.role === 'SUPER_ADMIN') && (
                    <Box
                      onClick={() => {
                        setUserMenuAnchor(null);
                        navigate('/vendor/dashboard');
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 1.5,
                        py: 1,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#334155',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#f1f5f9', color: '#059669' },
                      }}
                    >
                      <Building className="w-4 h-4 text-emerald-600" />
                      Vendor Dashboard
                    </Box>
                  )}
                  {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'CATALOGUE_MODERATOR') && (
                    <Box
                      onClick={() => {
                        setUserMenuAnchor(null);
                        navigate('/admin/dashboard');
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 1.5,
                        py: 1,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#334155',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#f1f5f9', color: '#7c3aed' },
                      }}
                    >
                      <Shield className="w-4 h-4 text-purple-600" />
                      Admin Console
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />

                {/* Sign Out Button */}
                <Box
                  onClick={handleLogout}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#e11d48',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': { bgcolor: '#ffe4e6', color: '#be123c' },
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Box>
              </Popover>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button
                  size="small"
                  variant="text"
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}
                >
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  size="small"
                  variant="contained"
                  sx={{
                    backgroundColor: '#4f46e5',
                    '&:hover': { backgroundColor: '#4338ca' },
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                  }}
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-800 hover:text-indigo-600"
          >
            Browse Services
          </Link>

          {isAuthenticated && (user?.role === 'CUSTOMER' || user?.role === 'SUPER_ADMIN') && (
            <Link
              to="/customer/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800 hover:text-indigo-600"
            >
              My Bookings
            </Link>
          )}

          {isAuthenticated && (isRole('VENDOR') || user?.role === 'SUPER_ADMIN') && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Vendor Hub
              </span>
              <Link
                to="/vendor/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded"
              >
                Dashboard Overview
              </Link>
              <Link
                to="/vendor/services"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded"
              >
                Services & Offerings
              </Link>
              <Link
                to="/vendor/availability"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded"
              >
                Weekly Availability
              </Link>
              <Link
                to="/vendor/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded"
              >
                Vendor Appointments
              </Link>
            </div>
          )}

          {isAuthenticated && (isRole('ADMIN', 'SUPER_ADMIN', 'CATALOGUE_MODERATOR') || hasPermission('admin.dashboard')) && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block px-1">
                Admin Governance
              </span>
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded"
              >
                Platform Dashboard
              </Link>
              <Link
                to="/admin/vendors"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded"
              >
                Vendor Approvals Queue
              </Link>
              <Link
                to="/admin/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded"
              >
                Cross-Vendor Bookings
              </Link>
              <Link
                to="/admin/roles"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded"
              >
                Roles & Permissions (RBAC)
              </Link>
              <Link
                to="/admin/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded"
              >
                Category Hierarchy
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
