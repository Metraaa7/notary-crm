'use client';

import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { CalendarEvent } from '@/app/(dashboard)/calendar/page';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { uk },
});

const MESSAGES = {
  today: 'Сьогодні',
  previous: '‹',
  next: '›',
  month: 'Місяць',
  week: 'Тиждень',
  day: 'День',
  agenda: 'Список',
  date: 'Дата',
  time: 'Час',
  event: 'Подія',
  noEventsInRange: 'Немає запланованих подій',
  showMore: (count: number) => `+${count} більше`,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#10b981',
  CANCELLED: '#9ca3af',
};

interface BigCalendarWrapperProps {
  events: CalendarEvent[];
  currentDate: Date;
  onNavigate: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export default function BigCalendarWrapper({
  events,
  currentDate,
  onNavigate,
  onSelectEvent,
}: BigCalendarWrapperProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" style={{ height: 620 }}>
      <Calendar
        localizer={localizer}
        events={events}
        date={currentDate}
        onNavigate={onNavigate}
        onSelectEvent={onSelectEvent}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        defaultView={Views.MONTH}
        messages={MESSAGES}
        culture="uk"
        style={{ height: '100%' }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: STATUS_COLORS[event.resource.status] ?? '#6b7280',
            borderRadius: '4px',
            border: 'none',
            color: '#fff',
            fontSize: '0.75rem',
            padding: '1px 4px',
            cursor: 'pointer',
          },
        })}
      />
    </div>
  );
}
