import * as React from 'react';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { HistoricalEvent } from '../types/historical-event';

export function useConnectionData(selectedEvent: HistoricalEvent | null, visibleEvents: HistoricalEvent[]) {
  const features: Feature<LineString>[] = React.useMemo(() => {
    if (!selectedEvent) return [];
    return selectedEvent.relatedEvents
      .map(({ id: relatedId, reason }): Feature<LineString> | null => {
        const target = visibleEvents.find((e) => e.id === relatedId);
        if (!target) return null;

        const [lng1, lat1] = [selectedEvent.location.longitude, selectedEvent.location.latitude];
        const [lng2, lat2] = [target.location.longitude, target.location.latitude];

        let label = '';
        if (lng1 < lng2) label = `${selectedEvent.title} <-> ${target.title}`;
        else if (lng1 > lng2) label = `${target.title} <-> ${selectedEvent.title}`;
        else if (lat1 < lat2) label = `${selectedEvent.title} <-> ${target.title}`;
        else label = `${target.title} <-> ${selectedEvent.title}`;

        return {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [[lng1, lat1], [lng2, lat2]] },
          properties: { label, reason },
        };
      })
      .filter((f): f is Feature<LineString> => f !== null);
  }, [selectedEvent, visibleEvents]);

  return React.useMemo<FeatureCollection<LineString>>(
    () => ({ type: 'FeatureCollection', features }),
    [features]
  );
}
