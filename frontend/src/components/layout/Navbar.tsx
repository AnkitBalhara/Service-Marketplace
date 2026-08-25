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
            endIcon={<ChevronDown className="w-3.5 h-3.5" />}
            startIcon={<Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
            sx={{
              borderColor: '#cbd5e1',
              color: '#334155',
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '10px',
              px: 1.5,
              py: 0.6,
              bgcolor: '#f8fafc',
              '&:hover': { borderColor: '#818cf8', backgroundColor: '#f1f5f9' },
            }}
          >
            <span className="hidden sm:inline">Switch</span> Persona
          </Button>

          {/* Persona Menu with clean categorized sections */}
          <Menu
            anchorEl={personaAnchor}
            open={Boolean(personaAnchor)}
            onClose={() => setPersonaAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                width: 380,
                maxWidth: '94vw',
                borderRadius: '16px',
                mt: 1.5,
                p: 1.5,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
              },
            }}
          >
            <div className="px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl mb-2 border border-indigo-100">
              <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                1-Click Persona Switcher
              </p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Pick a role to test specific assessment features
              </p>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {/* Group 1: Customers */}
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50/70 rounded-md mb-1">
                  <User className="w-3 h-3" />
                  Customers (For Booking Services)
                </div>
                <div className="space-y-1">
                  {SEEDED_PERSONAS.filter(p => p.key.startsWith('customer')).map(p => (
                    <div
                      key={p.key}
                      onClick={() => handlePersonaSelect(p.email)}
                      className={`p-2 rounded-xl cursor-pointer transition-all border ${
                        user?.email === p.email
                          ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                          : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{p.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {p.key === 'customer1' ? 'Active Bookings' : 'New Customer'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group 2: Vendors */}
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50/70 rounded-md mb-1">
                  <Building className="w-3 h-3" />
                  Vendors (For Managing Services & Slots)
                </div>
                <div className="space-y-1">
                  {SEEDED_PERSONAS.filter(p => p.key.startsWith('vendor')).map(p => (
                    <div
                      key={p.key}
                      onClick={() => handlePersonaSelect(p.email)}
                      className={`p-2 rounded-xl cursor-pointer transition-all border ${
                        user?.email === p.email
                          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                          : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{p.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          p.key.includes('app')
                            ? 'bg-emerald-100 text-emerald-700'
                            : p.key.includes('pend')
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {p.key.includes('app') ? 'Approved' : p.key.includes('pend') ? 'Pending' : 'Rejected'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group 3: Admins */}
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50/70 rounded-md mb-1">
                  <Shield className="w-3 h-3" />
                  Admins (Governance & RBAC)
                </div>
                <div className="space-y-1">
                  {SEEDED_PERSONAS.filter(p => p.key === 'superadmin' || p.key === 'moderator').map(p => (
                    <div
                      key={p.key}
                      onClick={() => handlePersonaSelect(p.email)}
                      className={`p-2 rounded-xl cursor-pointer transition-all border ${
                        user?.email === p.email
                          ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-300'
                          : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{p.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          p.key === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {p.key === 'superadmin' ? 'Super Admin' : 'Sub-Admin (Moderator)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Menu>

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

              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={() => setUserMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { width: 230, borderRadius: '14px', mt: 1.5, p: 1 } }}
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <Chip
                    label={user.role}
                    size="small"
                    sx={{ mt: 0.8, height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    color="primary"
                  />
                </div>

                <MenuItem
                  onClick={handleLogout}
                  sx={{ color: '#e11d48', fontSize: '0.8rem', fontWeight: 600, py: 1, borderRadius: '8px' }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </MenuItem>
              </Menu>
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
