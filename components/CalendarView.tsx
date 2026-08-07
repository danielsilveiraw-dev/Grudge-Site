'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { CalendarEvent } from '@/lib/events';

type CalendarViewProps = {
  events: CalendarEvent[];
};

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDateKey(year: number, month: number, day: number) {
  const monthText = String(month + 1).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');

  return `${year}-${monthText}-${dayText}`;
}

function getInitialDate(events: CalendarEvent[]) {
  const today = new Date();

  if (events.length === 0) {
    return today;
  }

  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const upcomingEvent = events.find((event) => event.date >= todayKey);

  if (!upcomingEvent) {
    return today;
  }

  return new Date(`${upcomingEvent.date}T00:00:00`);
}

export default function CalendarView({ events }: CalendarViewProps) {
  const initialDate = useMemo(() => getInitialDate(events), [events]);

  const [visibleMonth, setVisibleMonth] = useState(
    initialDate.getMonth(),
  );

  const [visibleYear, setVisibleYear] = useState(
    initialDate.getFullYear(),
  );

  const [selectedDate, setSelectedDate] = useState(
    formatDateKey(
      initialDate.getFullYear(),
      initialDate.getMonth(),
      initialDate.getDate(),
    ),
  );

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>(
      (accumulator, event) => {
        if (!accumulator[event.date]) {
          accumulator[event.date] = [];
        }

        accumulator[event.date].push(event);
        return accumulator;
      },
      {},
    );
  }, [events]);

  const selectedEvents = eventsByDate[selectedDate] ?? [];

  const firstDayOfMonth = new Date(
    visibleYear,
    visibleMonth,
    1,
  ).getDay();

  const daysInMonth = new Date(
    visibleYear,
    visibleMonth + 1,
    0,
  ).getDate();

  const previousMonthDays = new Date(
    visibleYear,
    visibleMonth,
    0,
  ).getDate();

  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const calendarDay = index - firstDayOfMonth + 1;

    if (calendarDay < 1) {
      const day = previousMonthDays + calendarDay;
      const date = new Date(visibleYear, visibleMonth - 1, day);

      return {
        day,
        date,
        outsideMonth: true,
      };
    }

    if (calendarDay > daysInMonth) {
      const day = calendarDay - daysInMonth;
      const date = new Date(visibleYear, visibleMonth + 1, day);

      return {
        day,
        date,
        outsideMonth: true,
      };
    }

    return {
      day: calendarDay,
      date: new Date(visibleYear, visibleMonth, calendarDay),
      outsideMonth: false,
    };
  });

  function changeMonth(direction: number) {
    const nextDate = new Date(
      visibleYear,
      visibleMonth + direction,
      1,
    );

    setVisibleMonth(nextDate.getMonth());
    setVisibleYear(nextDate.getFullYear());
  }

  function selectDay(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    setVisibleYear(year);
    setVisibleMonth(month);
    setSelectedDate(formatDateKey(year, month, day));
  }

  const selectedDateLabel = new Date(
    `${selectedDate}T00:00:00`,
  ).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const today = new Date();
  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[20px] border border-line-soft bg-bg-mid/30 p-4 backdrop-blur-sm sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mês anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line-soft text-text-main transition hover:border-accent-hot hover:text-accent-hot"
          >
            ←
          </button>

          <h2 className="text-center font-display text-2xl capitalize text-text-main">
            {new Date(
              visibleYear,
              visibleMonth,
              1,
            ).toLocaleDateString('pt-BR', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Próximo mês"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line-soft text-text-main transition hover:border-accent-hot hover:text-accent-hot"
          >
            →
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEK_DAYS.map((weekDay) => (
            <div
              key={weekDay}
              className="py-2 text-center text-[0.62rem] font-bold uppercase tracking-[0.08em] text-text-dim sm:text-[0.7rem]"
            >
              {weekDay}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map(({ day, date, outsideMonth }) => {
            const dateKey = formatDateKey(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
            );

            const hasEvents = Boolean(eventsByDate[dateKey]?.length);
            const selected = selectedDate === dateKey;
            const isToday = todayKey === dateKey;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => selectDay(date)}
                aria-label={`Selecionar ${date.toLocaleDateString(
                  'pt-BR',
                )}`}
                className={`relative flex aspect-square min-h-10 items-center justify-center rounded-xl border text-[0.78rem] transition sm:text-[0.9rem] ${
                  selected
                    ? 'border-accent-hot bg-accent-hot font-bold text-bg-deep shadow-[0_0_20px_rgba(255,61,129,0.25)]'
                    : hasEvents
                      ? 'border-accent-hot/60 bg-accent-hot/10 text-text-main hover:bg-accent-hot/20'
                      : isToday
                        ? 'border-accent-soft/60 text-accent-soft'
                        : outsideMonth
                          ? 'border-transparent text-text-dim/30 hover:border-line-soft'
                          : 'border-line-soft bg-bg-deep/20 text-text-dim hover:border-accent-hot hover:text-text-main'
                }`}
              >
                {day}

                {hasEvents && !selected && (
                  <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-accent-hot shadow-[0_0_8px_rgba(255,61,129,0.9)]" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="rounded-[20px] border border-line-soft bg-bg-mid/30 p-5 backdrop-blur-sm sm:p-6">
        <p className="text-[0.7rem] uppercase tracking-[0.12em] text-accent-soft">
          data selecionada
        </p>

        <h2 className="mt-1 font-display text-2xl capitalize text-text-main">
          {selectedDateLabel}
        </h2>

        {selectedEvents.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line-soft p-6 text-center">
            <p className="text-[0.85rem] text-text-dim">
              nenhum evento marcado para este dia.
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {selectedEvents.map((event) => (
              <article
                key={event.id}
                className="overflow-hidden rounded-2xl border border-line-soft bg-bg-deep/35"
              >
                {event.image && (
                  <Image
                    src={event.image}
                    alt={event.title}
                    width={700}
                    height={400}
                    className="max-h-[220px] w-full object-cover"
                  />
                )}

                <div className="p-4">
                  <h3 className="font-display text-xl text-text-main">
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="mt-2 whitespace-pre-wrap text-[0.84rem] leading-relaxed text-text-dim">
                      {event.description}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}