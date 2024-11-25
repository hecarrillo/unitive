// components/ui/opening-hours.tsx
import { Clock } from 'lucide-react';
import { StatusPill } from './status-pill';
import { isCurrentlyOpen } from '@/lib/utils/business-hours';

interface OpeningHoursProps {
  hours: string[] | "N/A";
  className?: string;
}

export function OpeningHours({ hours, className }: OpeningHoursProps) {
  const { status } = isCurrentlyOpen(hours);
  
  if (hours === "N/A") {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="text-xl font-semibold">Opening Hours</h3>
          <StatusPill status={status} />
        </div>
        <p className="text-gray-600">Hours not available</p>
      </div>
    );
  }

  const daysOrder = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
    'Friday', 'Saturday', 'Sunday'
  ];

  const hoursMap = new Map(
    hours.map(schedule => {
      const [day, time] = schedule.split(': ');
      return [day, time];
    })
  );

  // Group consecutive days with the same hours
  const groupedHours: { days: string[], hours: string }[] = [];
  let currentGroup: string[] = [];
  let currentHours = '';

  daysOrder.forEach((day, index) => {
    const dayHours = hoursMap.get(day) || 'Closed';
    
    if (dayHours === currentHours) {
      currentGroup.push(day);
    } else {
      if (currentGroup.length > 0) {
        groupedHours.push({
          days: currentGroup,
          hours: currentHours
        });
      }
      currentGroup = [day];
      currentHours = dayHours;
    }

    // Handle the last group
    if (index === daysOrder.length - 1) {
      groupedHours.push({
        days: currentGroup,
        hours: currentHours
      });
    }
  });

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-gray-500" />
        <h3 className="text-xl font-semibold">Opening Hours</h3>
        <StatusPill status={status} />
      </div>
      <div className="space-y-2">
        {groupedHours.map(({ days, hours }, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-gray-600">
              {days.length === 1
                ? days[0]
                : `${days[0]} - ${days[days.length - 1]}`}
            </span>
            <span className="font-medium">
              {hours}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}