import { Router } from 'express';
import { catalogueController } from '../controllers/catalogue.controller';
import { optionalAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { catalogueQuerySchema } from '../schemas/service.schema';

const router = Router();

router.get('/categories', catalogueController.getCategories);
router.get('/services', validateRequest(catalogueQuerySchema), catalogueController.searchServices);
router.get('/services/:id', optionalAuth as any, catalogueController.getServiceDetails as any);

export const catalogueRoutes = router;
