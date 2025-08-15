import * as React from 'react';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { HistoricalEvent } from '../types/historical-event';
import { roundCoord } from '../constants/map';

export type LocationPointProps = {
  eventIds: string;                         // all ids at this merged coordinate, comma-delimited
  role: 'primary' | 'related' | 'default';
  lng: number;
  lat: number;
};

export function useLocationPoints(visibleEvents: HistoricalEvent[], selectedEvent: HistoricalEvent | null) {
  return React.useMemo<FeatureCollection<Point, LocationPointProps>>(() => {
    // Group by rounded coord; accumulate sums to later average
    const grouped = new Map<string, { latSum: number; lngSum: number; count: number; ids: string[] }>();
    for (const e of visibleEvents) {
      const rlat = roundCoord(e.location.latitude);
      const rlng = roundCoord(e.location.longitude);
      const key = `${rlat},${rlng}`;
      const g = grouped.get(key);
      if (g) {
        g.ids.push(e.id);
        g.latSum += e.location.latitude;
        g.lngSum += e.location.longitude;
        g.count += 1;
      } else {
        grouped.set(key, { ids: [e.id], latSum: e.location.latitude, lngSum: e.location.longitude, count: 1 });
      }
    }

    const features: Feature<Point, LocationPointProps>[] = [];
    const selectedId = selectedEvent?.id;
    const related = new Set<string>(selectedEvent?.relatedEvents.map((r) => r.id) ?? []);

    for (const { latSum, lngSum, count, ids } of grouped.values()) {
      const lat = latSum / count;
      const lng = lngSum / count;

      let role: LocationPointProps['role'] = 'default';
      if (selectedId && ids.includes(selectedId)) role = 'primary';
      else if (ids.some((id) => related.has(id))) role = 'related';

      // one feature per event → clusters show true totals
      for (let i = 0; i < ids.length; i++) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: { eventIds: ids.join(','), role, lng, lat },
        });
      }
    }

    return { type: 'FeatureCollection', features };
  }, [visibleEvents, selectedEvent]);
}
