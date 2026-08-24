import { Router } from 'express';
import { slotController } from '../controllers/slot.controller';
import { validateRequest } from '../middlewares/validate';
import { getSlotsQuerySchema, getNextAvailableQuerySchema } from '../schemas/availability.schema';

const router = Router();

router.get('/services/:id/slots', validateRequest(getSlotsQuerySchema), slotController.getAvailableSlots);
router.get('/services/:id/next-available', validateRequest(getNextAvailableQuerySchema), slotController.getNextAvailableSlot);

export const slotRoutes = router;
