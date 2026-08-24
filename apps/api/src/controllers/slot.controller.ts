import { Request, Response, NextFunction } from 'express';
import { slotService } from '../services/slot.service';
import { sendSuccess } from '../utils/response';

export class SlotController {
  public async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // serviceId
      const { offeringId, startDate, endDate } = req.query as any;

      const result = await slotService.getAvailableSlots(
        id,
        String(offeringId),
        String(startDate),
        endDate ? String(endDate) : undefined
      );

      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getNextAvailableSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { offeringId } = req.query as any;

      const result = await slotService.getNextAvailableSlot(id, String(offeringId));
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const slotController = new SlotController();
