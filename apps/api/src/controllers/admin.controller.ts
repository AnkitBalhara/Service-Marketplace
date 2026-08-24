import { Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class AdminController {
  public async getDashboardMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await adminService.getDashboardMetrics();
      return sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  public async listVendors(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.query as any;
      const vendors = await adminService.listVendors(status);
      return sendSuccess(res, vendors);
    } catch (error) {
      next(error);
    }
  }

  public async approveVendor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await adminService.approveVendor(id, req.user!.userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async rejectVendor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await adminService.rejectVendor(id, reason, req.user!.userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async suspendService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await adminService.suspendService(id, reason, req.user!.userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async reactivateService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await adminService.reactivateService(id, req.user!.userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async listAllBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, vendorId, customerId, startDate, endDate, search } = req.query as any;
      const result = await adminService.listAllBookings({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        status,
        vendorId,
        customerId,
        startDate,
        endDate,
        search,
      });
      return sendSuccess(res, result.data, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  public async forceCancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await adminService.forceCancelBooking(id, reason, req.user!.userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async listRolesAndPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listRolesAndPermissions();
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async createRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const role = await adminService.createRole(req.body, req.user!.userId);
      return sendCreated(res, role);
    } catch (error) {
      next(error);
    }
  }

  public async updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = await adminService.updateRole(id, req.body, req.user!.userId);
      return sendSuccess(res, role);
    } catch (error) {
      next(error);
    }
  }

  public async createSubAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.createSubAdmin(req.body, req.user!.userId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await adminService.createCategory(req.body);
      return sendCreated(res, category);
    } catch (error) {
      next(error);
    }
  }

  public async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await adminService.updateCategory(id, req.body);
      return sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  }

  public async listAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const logs = await adminService.listAuditLogs();
      return sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
