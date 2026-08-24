/**
 * Time and slot calculation utilities
 */

export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Checks if a slot on a given date and start time is in the past relative to the vendor's timezone.
 */
export const isSlotInPast = (dateStr: string, startTimeStr: string, timezone = 'Asia/Kolkata'): boolean => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = startTimeStr.split(':').map(Number);

    // Construct slot date time in UTC representation of the vendor's local time
    // We get current time in the given timezone
    const now = new Date();
    
    // Format current date and time in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const partMap: Record<string, string> = {};
    for (const part of parts) {
      partMap[part.type] = part.value;
    }

    const currentYear = parseInt(partMap.year, 10);
    const currentMonth = parseInt(partMap.month, 10);
    const currentDay = parseInt(partMap.day, 10);
    const currentHour = parseInt(partMap.hour, 10);
    const currentMinute = parseInt(partMap.minute, 10);

    const currentDateValue = currentYear * 10000 + currentMonth * 100 + currentDay;
    const slotDateValue = year * 10000 + month * 100 + day;

    if (slotDateValue < currentDateValue) {
      return true;
    }

    if (slotDateValue === currentDateValue) {
      const currentMinutes = currentHour * 60 + currentMinute;
      const slotMinutes = hours * 60 + minutes;
      return slotMinutes <= currentMinutes;
    }

    return false;
  } catch (err) {
    return false;
  }
};

/**
 * Generates discrete time slots of duration `durationMinutes` inside `[startTime, endTime]`
 */
export interface GeneratedSlot {
  startTime: string;
  endTime: string;
  capacity: number;
}

export const generateSlotsForWindow = (
  startTime: string,
  endTime: string,
  durationMinutes: number,
  capacity = 1
): GeneratedSlot[] => {
  const slots: GeneratedSlot[] = [];
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  let current = startMin;
  while (current + durationMinutes <= endMin) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + durationMinutes);
    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      capacity,
    });
    current += durationMinutes;
  }

  return slots;
};

/**
 * Validates whether cancellation is within the free window (e.g. 24 hours before slot start)
 */
export const isWithinFreeCancellationWindow = (
  dateStr: string,
  startTimeStr: string,
  freeWindowHours = 24,
  timezone = 'Asia/Kolkata'
): boolean => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = startTimeStr.split(':').map(Number);

  // Approximate slot start time in UTC epoch ms
  const slotDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const now = new Date();
  const diffHours = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  return diffHours >= freeWindowHours;
};
