import CalendarView from '@/components/CalendarView';
import { getEvents } from '@/lib/events';

export default async function CalendarioPage() {
  const events = await getEvents();

  return (
    <main className="relative z-[1] mx-auto max-w-[1100px] px-4 pb-20 pt-[120px] sm:px-6">
      <header className="mb-12 text-center">
        <h1 className="font-display text-[clamp(2.5rem,7vw,4rem)] font-semibold uppercase tracking-[0.08em] text-text-main [text-shadow:0_0_40px_rgba(255,61,129,0.35)]">
          calendário
        </h1>

        <p className="mt-3.5 font-display text-[0.95rem] italic text-text-dim">
          selecione um dia para visualizar os eventos
        </p>
      </header>

      <CalendarView events={events} />
    </main>
  );
}