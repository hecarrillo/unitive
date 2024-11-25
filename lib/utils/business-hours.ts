// lib/utils/business-hours.ts
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface TimeRange {
  start: number; // minutes since midnight
  end: number;   // minutes since midnight
}

export function isCurrentlyOpen(openingHours: string[] | "N/A"): { isOpen: boolean; status: 'open' | 'closed' | 'unknown' } {
    // Handle N/A case
    if (openingHours === "N/A") {
      return { isOpen: false, status: 'unknown' };
    }
  
    if (!openingHours || !Array.isArray(openingHours) || openingHours.length === 0) {
      return { isOpen: false, status: 'unknown' };
    }
  
    const now = new Date();
    const currentDay = now.toLocaleString('en-US', { weekday: 'long' }) as DayOfWeek;
    
    // Find today's hours
    const todayHours = openingHours.find(hours => hours.startsWith(currentDay));
    if (!todayHours) return { isOpen: false, status: 'closed' };
    
    if (todayHours.includes('Closed')) return { isOpen: false, status: 'closed' };
    
    // Check for 24 hours
    if (todayHours.includes('Open 24 hours')) {
      return { isOpen: true, status: 'open' };
    }
  
    const timeRange = parseOpeningHours(todayHours.split(': ')[1]);
    if (!timeRange) return { isOpen: false, status: 'unknown' };
  
    // Get current time in minutes since midnight
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    return { 
      isOpen: currentMinutes >= timeRange.start && currentMinutes <= timeRange.end,
      status: currentMinutes >= timeRange.start && currentMinutes <= timeRange.end ? 'open' : 'closed'
    };
}
  
function parseOpeningHours(timeStr: string): TimeRange | null {
    // If it's "Open 24 hours", return full day range
    if (timeStr === 'Open 24 hours') {
        return {
        start: 0,      // 00:00
        end: 24 * 60   // 24:00
        };
    }

    const match = timeStr.match(/(\d{1,2}):(\d{2}) ([AP]M) – (\d{1,2}):(\d{2}) ([AP]M)/);
    if (!match) return null;

    const [_, startHour, startMin, startMeridiem, endHour, endMin, endMeridiem] = match;

    const convertToMinutes = (hour: string, min: string, meridiem: string): number => {
        let h = parseInt(hour);
        if (meridiem === 'PM' && h !== 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
        return h * 60 + parseInt(min);
    };

    return {
        start: convertToMinutes(startHour, startMin, startMeridiem),
        end: convertToMinutes(endHour, endMin, endMeridiem)
    };
}