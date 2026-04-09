'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { servicesService } from '@/services/services.service';
import type { Service, PopulatedClient } from '@/types/service.types';

// Lazy-load the calendar to avoid SSR issues
const BigCalendarWrapper = dynamic(() => import('@/components/calendar/BigCalendarWrapper'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-xl" />,
});

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Service;
}

function serviceToEvent(svc: Service): CalendarEvent {
  const start = new Date(svc.scheduledAt!);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1h default duration
  const client = svc.client as PopulatedClient;
  const clientName = typeof svc.client === 'string'
    ? ''
    : `${client.firstName} ${client.lastName}`;
  return {
    id: svc._id,
    title: clientName ? `${clientName} — ${svc.description}` : svc.description,
    start,
    end,
    resource: svc,
  };
}

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadEvents = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      // Load services for a range that covers current view (month + surrounding weeks)
      const rangeStart = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
      const rangeEnd = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
      const services = await servicesService.getCalendar(
        rangeStart.toISOString(),
        rangeEnd.toISOString(),
      );
      setEvents(services.map(serviceToEvent));
    } catch {
      // silently ignore — no events shown
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents(currentDate);
  }, [currentDate, loadEvents]);

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    router.push(`/services/${event.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Календар"
        description={format(currentDate, 'LLLL yyyy', { locale: uk })}
      />

      {isLoading ? (
        <Skeleton className="h-[600px] w-full rounded-xl" />
      ) : (
        <BigCalendarWrapper
          events={events}
          currentDate={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
        />
      )}
    </div>
  );
}
