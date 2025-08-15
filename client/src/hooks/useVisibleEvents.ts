import * as React from 'react';
import type { HistoricalEvent } from '../types/historical-event';

type UseVisibleEventsArgs = {
  allEvents: HistoricalEvent[];
  activeYear: number | null;
  selectedTags: string[];
  selectedPeople: string[];
  selectedEvent: HistoricalEvent | null;
};

export function useVisibleEvents({
  allEvents,
  activeYear,
  selectedTags,
  selectedPeople,
  selectedEvent,
}: UseVisibleEventsArgs) {
  return React.useMemo(() => {
    const filtered = allEvents.filter((event) => {
      const matchesYear = activeYear == null || new Date(event.date).getFullYear() === activeYear;
      const matchesTags = selectedTags.length === 0 || (event.tags && event.tags.some((t) => selectedTags.includes(t)));
      const matchesPeople =
        selectedPeople.length === 0 || (event.people && event.people.some((p) => selectedPeople.includes(p)));
      return matchesYear && matchesTags && matchesPeople;
    });

    const allVisible = new Map<string, HistoricalEvent>();
    for (const e of filtered) allVisible.set(e.id, e);

    if (selectedEvent) {
      allVisible.set(selectedEvent.id, selectedEvent);
      for (const { id } of selectedEvent.relatedEvents) {
        const related = allEvents.find((e) => e.id === id);
        if (related) allVisible.set(id, related);
      }
    }

    return Array.from(allVisible.values());
  }, [allEvents, activeYear, selectedTags, selectedPeople, selectedEvent]);
}
