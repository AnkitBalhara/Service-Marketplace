import { Response, NextFunction } from 'express';
import { vendorService } from '../services/vendor.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class VendorController {
  public async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await vendorService.getProfile(req.user!.userId);
      return sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  public async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await vendorService.updateProfile(req.user!.userId, req.body);
      return sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  public async listServices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const services = await vendorService.listVendorServices(req.user!.vendorId!);
      return sendSuccess(res, services);
    } catch (error) {
      next(error);
    }
  }

  public async createService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const service = await vendorService.createService(req.user!.vendorId!, req.body);
      return sendCreated(res, service);
    } catch (error) {
      next(error);
    }
  }

  public async updateService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await vendorService.updateService(id, req.user!.vendorId!, req.body);
      return sendSuccess(res, service);
    } catch (error) {
      next(error);
    }
  }

  public async createOffering(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { serviceId } = req.params;
      const offering = await vendorService.createOffering(serviceId, req.user!.vendorId!, req.body);
      return sendCreated(res, offering);
    } catch (error) {
      next(error);
    }
  }

  public async updateOffering(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const offering = await vendorService.updateOffering(id, req.user!.vendorId!, req.body);
      return sendSuccess(res, offering);
    } catch (error) {
      next(error);
    }
  }

  public async setAvailabilityRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { serviceId } = req.params;
      const rules = await vendorService.setAvailabilityRules(serviceId, req.user!.vendorId!, req.body.rules);
      return sendSuccess(res, rules);
    } catch (error) {
      next(error);
    }
  }

  public async getAvailabilityRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { serviceId } = req.params;
      const rules = await vendorService.getAvailabilityRules(serviceId);
      return sendSuccess(res, rules);
    } catch (error) {
      next(error);
    }
  }

  public async addDateException(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { serviceId } = req.params;
      const exception = await vendorService.addDateException(serviceId, req.user!.vendorId!, req.body);
      return sendSuccess(res, exception);
    } catch (error) {
      next(error);
    }
  }

  public async removeDateException(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { serviceId, exceptionId } = req.params;
      const result = await vendorService.removeDateException(serviceId, exceptionId, req.user!.vendorId!);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getDateExceptions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { serviceId } = req.params;
      const exceptions = await vendorService.getDateExceptions(serviceId);
      return sendSuccess(res, exceptions);
    } catch (error) {
      next(error);
    }
  }

  public async listBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, date } = req.query as any;
      const result = await vendorService.listVendorBookings(req.user!.vendorId!, {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        status,
        date,
      });
      return sendSuccess(res, result.data, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }
}

export const vendorController = new VendorController();
