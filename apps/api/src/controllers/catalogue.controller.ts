import { Request, Response, NextFunction } from 'express';
import { catalogueService } from '../services/catalogue.service';
import { adminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class CatalogueController {
  public async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await adminService.listCategories();
      return sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }

  public async searchServices(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, query, categoryId, vendorId } = req.query as any;
      const result = await catalogueService.searchServices({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 12,
        query: query ? String(query) : undefined,
        categoryId: categoryId ? String(categoryId) : undefined,
        vendorId: vendorId ? String(vendorId) : undefined,
      });
      return sendSuccess(res, result.data, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  public async getServiceDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await catalogueService.getServiceDetails(id, req.user);
      return sendSuccess(res, service);
    } catch (error) {
      next(error);
    }
  }
}

export const catalogueController = new CatalogueController();
