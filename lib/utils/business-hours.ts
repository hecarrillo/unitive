// lib/utils/business-hours.ts
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface TimeRange {
  start: number; // minutes since midnight
  end: number;   // minutes since midnight
}

// lib/utils/business-hours.ts

function parseTimeRange(timeStr: string): TimeRange | null {
  // Try the standard format first (12:00 AM - 6:00 PM)
  let match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)\s*[–-]\s*(\d{1,2}):(\d{2})\s*([AP]M)/);
  
  if (match) {
    const [_, startHour, startMin, startMeridiem, endHour, endMin, endMeridiem] = match;
    return {
      start: convertTo24Hour(startHour, startMin, startMeridiem),
      end: convertTo24Hour(endHour, endMin, endMeridiem)
    };
  }

  // Try the shortened format (12:00 - 8:00 PM)
  match = timeStr.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})\s*([AP]M)/);
  if (match) {
    const [_, startHour, startMin, endHour, endMin, meridiem] = match;
    // Both times share the same AM/PM
    return {
      start: convertTo24Hour(startHour, startMin, meridiem),
      end: convertTo24Hour(endHour, endMin, meridiem)
    };
  }

  // Try even shorter format (12:00 - 8:00)
  match = timeStr.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const [_, startHour, startMin, endHour, endMin] = match;
    // Assume PM for these times
    return {
      start: convertTo24Hour(startHour, startMin, 'PM'),
      end: convertTo24Hour(endHour, endMin, 'PM')
    };
  }

  return null;
}

function convertTo24Hour(hour: string, min: string, meridiem: string): number {
  let h = parseInt(hour);
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return h * 60 + parseInt(min);
}

export function isCurrentlyOpen(openingHours: string[] | "N/A"): { isOpen: boolean; status: 'open' | 'closed' | 'unknown' } {
  if (openingHours === "N/A") {
    return { isOpen: false, status: 'unknown' };
  }

  if (!openingHours || !Array.isArray(openingHours) || openingHours.length === 0) {
    return { isOpen: false, status: 'unknown' };
  }

  const now = new Date();
  const centralTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const currentDay = centralTime.toLocaleString('en-US', { weekday: 'long' }) as DayOfWeek;

  const todayHours = openingHours.find(hours => hours.startsWith(currentDay));
  if (!todayHours) return { isOpen: false, status: 'closed' };

  const timePart = todayHours.split(': ')[1]?.trim();
  if (!timePart) return { isOpen: false, status: 'unknown' };
  
  if (timePart === 'Closed') {
    return { isOpen: false, status: 'closed' };
  }

  if (timePart === 'Open 24 hours') {
    return { isOpen: true, status: 'open' };
  }

  const timeRange = parseTimeRange(timePart);
  if (!timeRange) return { isOpen: false, status: 'closed' };

  const currentMinutes = centralTime.getHours() * 60 + centralTime.getMinutes();
  const isOpen = currentMinutes >= timeRange.start && currentMinutes <= timeRange.end;

  return { 
    isOpen,
    status: isOpen ? 'open' : 'closed'
  };
}