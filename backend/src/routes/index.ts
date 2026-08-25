import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { catalogueRoutes } from './catalogue.routes';
import { slotRoutes } from './slot.routes';
import { bookingRoutes } from './booking.routes';
import { paymentRoutes } from './payment.routes';
import { vendorRoutes } from './vendor.routes';
import { adminRoutes } from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/catalogue', catalogueRoutes);
router.use('/availability', slotRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export const apiRoutes = router;
