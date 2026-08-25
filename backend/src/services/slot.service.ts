import { Types } from 'mongoose';
import {
  Service,
  Offering,
  AvailabilityRule,
  DateException,
  SlotCapacity,
  Booking,
  VendorProfile,
} from '../models';
import { NotFoundError, BadRequestError } from '../utils/errors';
import {
  generateSlotsForWindow,
  isSlotInPast,
} from '../utils/time';
import { DerivedDaySlots, TimeSlot } from '../types';

export class SlotService {
  /**
   * Generates bookable slots for a service across a date range [startDate, endDate]
   */
  public async getAvailableSlots(
    serviceId: string,
    offeringId: string,
    startDateStr: string,
    endDateStr?: string
  ): Promise<DerivedDaySlots[]> {
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
    }

    const offering = await Offering.findOne({ _id: offeringId, serviceId: service._id, isActive: true });
    if (!offering) {
      throw new NotFoundError('OFFERING_NOT_FOUND', 'Active service offering not found');
    }

    const vendor = await VendorProfile.findById(service.vendorId);
    const timezone = vendor?.timezone || 'Asia/Kolkata';

    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr);

    // Limit maximum query range to 30 days to avoid performance issues
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      throw new BadRequestError('RANGE_TOO_LARGE', 'Date range cannot exceed 30 days');
    }

    // Load all availability rules for this service
    const rules = await AvailabilityRule.find({ serviceId: service._id });

    // Load date exceptions in range
    const exceptions = await DateException.find({
      serviceId: service._id,
      date: { $gte: startDateStr, $lte: endDateStr || startDateStr },
    });
    const exceptionMap = new Map<string, typeof exceptions[0]>();
    exceptions.forEach((e) => exceptionMap.set(e.date, e));

    // Pre-fetch SlotCapacity records for real-time occupancy
    const slotCapacities = await SlotCapacity.find({
      serviceId: service._id,
      date: { $gte: startDateStr, $lte: endDateStr || startDateStr },
    });
    const capacityMap = new Map<string, number>();
    slotCapacities.forEach((sc) => {
      capacityMap.set(`${sc.date}_${sc.startTime}`, sc.bookedCount);
    });

    // Also double-check active bookings in case SlotCapacity doc isn't yet created
    const activeBookings = await Booking.find({
      serviceId: service._id,
      date: { $gte: startDateStr, $lte: endDateStr || startDateStr },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    });
    const bookingCountMap = new Map<string, number>();
    activeBookings.forEach((b) => {
      const key = `${b.date}_${b.startTime}`;
      bookingCountMap.set(key, (bookingCountMap.get(key) || 0) + 1);
    });

    const result: DerivedDaySlots[] = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ...

      const exception = exceptionMap.get(dateStr);

      if (exception && exception.isClosed) {
        result.push({
          date: dateStr,
          isClosed: true,
          closureReason: exception.reason || 'Closed on this date',
          slots: [],
        });
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      let windowsToProcess: { startTime: string; endTime: string; capacity: number }[] = [];

      if (exception && exception.customWindows && exception.customWindows.length > 0) {
        // Use custom override windows
        windowsToProcess = exception.customWindows;
      } else {
        // Use standard weekly rules for this day of week
        const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);
        windowsToProcess = dayRules.map((r) => ({
          startTime: r.startTime,
          endTime: r.endTime,
          capacity: r.capacity,
        }));
      }

      const daySlots: TimeSlot[] = [];

      for (const window of windowsToProcess) {
        const generated = generateSlotsForWindow(
          window.startTime,
          window.endTime,
          offering.durationMinutes,
          window.capacity
        );

        for (const slot of generated) {
          // Rule: Past slots are never offered (evaluated in vendor timezone)
          if (isSlotInPast(dateStr, slot.startTime, timezone)) {
            continue;
          }

          const slotKey = `${dateStr}_${slot.startTime}`;
          const bookedCountFromCap = capacityMap.get(slotKey);
          const bookedCountFromBookings = bookingCountMap.get(slotKey) || 0;
          const bookedCount = bookedCountFromCap !== undefined ? bookedCountFromCap : bookedCountFromBookings;

          const remainingCapacity = Math.max(0, slot.capacity - bookedCount);

          // We include the slot if capacity remains
          if (remainingCapacity > 0) {
            daySlots.push({
              startTime: slot.startTime,
              endTime: slot.endTime,
              capacity: slot.capacity,
              bookedCount,
              remainingCapacity,
              isAvailable: true,
            });
          }
        }
      }

      result.push({
        date: dateStr,
        isClosed: windowsToProcess.length === 0,
        closureReason: windowsToProcess.length === 0 ? 'No availability configured for this day' : undefined,
        slots: daySlots,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * SHOULD: Returns the soonest available bookable slot for a service
   */
  public async getNextAvailableSlot(serviceId: string, offeringId: string) {
    const today = new Date();
    const startDateStr = today.toISOString().split('T')[0];
    
    // Look ahead up to 14 days
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14);
    const endDateStr = endDate.toISOString().split('T')[0];

    const days = await this.getAvailableSlots(serviceId, offeringId, startDateStr, endDateStr);

    for (const day of days) {
      if (!day.isClosed && day.slots.length > 0) {
        const firstSlot = day.slots[0];
        return {
          date: day.date,
          slot: firstSlot,
        };
      }
    }

    return null;
  }
}

export const slotService = new SlotService();
