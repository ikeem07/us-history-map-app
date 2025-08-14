import React, { useEffect } from 'react';
import { Map as LibreMap, Source, Layer, Popup, MapRef } from 'react-map-gl/maplibre';
import { Card, Typography } from 'antd';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { Helmet } from 'react-helmet';

import events from '../data/historical-events.json';
import TimelinePanel from './timeline-panel';
import type { HistoricalEvent } from '../types/historical-event';
import FilterSidebar from './filter-sidebar';
import MapLegend from './map-legend';
import { 
  COLOR_EVENT_PRIMARY,
  COLOR_EVENT_RELATED,
  COLOR_EVENT_DEFAULT,
  COLOR_LINE,
  COLOR_LINE_HOVER_TARGET,
  COLOR_LABEL,
  COLOR_CLUSTER_LOW,
  COLOR_CLUSTER_MID,
  COLOR_CLUSTER_HIGH,
  CLUSTER_STEP_1,
  CLUSTER_STEP_2,
  RADIUS_SMALL,
  RADIUS_MED,
  RADIUS_LARGE,
  CLUSTER_RADIUS,
  CLUSTER_MAX_ZOOM,
} from './map-constants';

const historicalEvents = events as HistoricalEvent[];

// Merge “nearly same” coordinates when building buckets.
// 5 decimal places ≈ ~1.1 meters at the equator.
const GROUP_PRECISION = 5;
const round = (n: number, p = GROUP_PRECISION) => {
  const k = Math.pow(10, p);
  return Math.round(n * k) / k;
};

const MapView: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = React.useState<HistoricalEvent | null>(null);
  const [hoverInfo, setHoverInfo] = React.useState<{ lngLat: [number, number]; reason: string } | null>(null);
  const [activeYear, setActiveYear] = React.useState<number | null>(null);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = React.useState<string[]>([]);
  const [locationEvents, setLocationEvents] = React.useState<HistoricalEvent[]>([]);
  const [popupPosition, setPopupPosition] = React.useState<[number, number] | null>(null);
  const [legendCollapsed, setLegendCollapsed] = React.useState<boolean>(false);

  const mapRef = React.useRef<MapRef | null>(null);
  const { Title, Paragraph, Text } = Typography;

  // ———————————————————————————————————————————
  // Filters -> visible events
  // ———————————————————————————————————————————
  const visibleEvents = React.useMemo(() => {
    const filtered = historicalEvents.filter((event) => {
      const matchesYear = activeYear == null || new Date(event.date).getFullYear() === activeYear;
      const matchesTags = selectedTags.length === 0 || (event.tags && event.tags.some((t) => selectedTags.includes(t)));
      const matchesPeople = selectedPeople.length === 0 || (event.people && event.people.some((p) => selectedPeople.includes(p)));
      return matchesYear && matchesTags && matchesPeople;
    });

    const allVisible = new Map<string, HistoricalEvent>();
    for (const e of filtered) allVisible.set(e.id, e);

    if (selectedEvent) {
      allVisible.set(selectedEvent.id, selectedEvent);
      for (const { id } of selectedEvent.relatedEvents) {
        const related = historicalEvents.find((e) => e.id === id);
        if (related) allVisible.set(id, related);
      }
    }
    return Array.from(allVisible.values());
  }, [activeYear, selectedTags, selectedPeople, selectedEvent]);

  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    historicalEvents.forEach((e) => e.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, []);

  const allPeople = React.useMemo(() => {
    const peopleSet = new Set<string>();
    historicalEvents.forEach((e) => e.people?.forEach((p) => peopleSet.add(p)));
    return Array.from(peopleSet).sort();
  }, []);

  // ———————————————————————————————————————————
  // Connection lines for selected + related
  // ———————————————————————————————————————————
  const connectionFeatures: Feature<LineString>[] = selectedEvent
    ? selectedEvent.relatedEvents
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
        .filter((f): f is Feature<LineString> => f !== null)
    : [];

  const connectionData: FeatureCollection<LineString> = { type: 'FeatureCollection', features: connectionFeatures };

  // ———————————————————————————————————————————
  // Build clustered points
  // Strategy: one feature PER EVENT (so point_count == true event total),
  // but each feature carries the full eventIds list for that (merged/averaged) coordinate.
  // Also merges “near-duplicate” coords using GROUP_PRECISION and averages lat/lng.
  // ———————————————————————————————————————————
  type LocationPointProps = {
    eventIds: string;       // all ids at this merged coordinate, comma-delimited
    role: 'primary' | 'related' | 'default';
    lng: number;
    lat: number;
  };

  const locationPoints: FeatureCollection<Point, LocationPointProps> = React.useMemo(() => {
    // 1) Group by rounded coordinate, keeping sums to compute a centroid for near-duplicates
    const grouped = new Map<
      string,
      { latSum: number; lngSum: number; count: number; ids: string[] }
    >();

    for (const e of visibleEvents) {
      const rlat = round(e.location.latitude);
      const rlng = round(e.location.longitude);
      const key = `${rlat},${rlng}`;

      const g = grouped.get(key);
      if (g) {
        g.ids.push(e.id);
        g.latSum += e.location.latitude;
        g.lngSum += e.location.longitude;
        g.count += 1;
      } else {
        grouped.set(key, {
          ids: [e.id],
          latSum: e.location.latitude,
          lngSum: e.location.longitude,
          count: 1,
        });
      }
    }

    // 2) Emit features: one *per event* at the averaged coordinate
    const features: Feature<Point, LocationPointProps>[] = [];
    const selectedId = selectedEvent?.id;
    const related = new Set<string>(selectedEvent?.relatedEvents.map((r) => r.id) ?? []);

    for (const { latSum, lngSum, count, ids } of grouped.values()) {
      const lat = latSum / count;
      const lng = lngSum / count;

      let role: LocationPointProps['role'] = 'default';
      if (selectedId && ids.includes(selectedId)) role = 'primary';
      else if (ids.some((id) => related.has(id))) role = 'related';

      for (let i = 0; i < ids.length; i++) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            eventIds: ids.join(','), // full list for the click popup
            role,
            lng,
            lat,
          },
        });
      }
    }

    return { type: 'FeatureCollection', features };
  }, [visibleEvents, selectedEvent]);

  // ———————————————————————————————————————————
  // Map
  // ———————————————————————————————————————————
  return (
    <>
      <Helmet>
        <title>History Map</title>
        <meta name="description" content="Explore historical events on an interactive map." />
      </Helmet>

      <FilterSidebar
        selectedTags={selectedTags}
        selectedPeople={selectedPeople}
        allTags={allTags}
        allPeople={allPeople}
        onChangeTags={setSelectedTags}
        onChangePeople={setSelectedPeople}
        onClear={() => {
          setSelectedTags([]);
          setSelectedPeople([]);
        }}
      />

      {/* Map Legend overlay (bottom right) */}
      <MapLegend 
        collapsed={legendCollapsed} 
        onToggle={() => setLegendCollapsed((c) => !c)}
        colors={{
          clusterLow: COLOR_CLUSTER_LOW,
          clusterMid: COLOR_CLUSTER_MID,
          clusterHigh: COLOR_CLUSTER_HIGH,
          eventDefault: COLOR_EVENT_DEFAULT,
          eventPrimary: COLOR_EVENT_PRIMARY,
          eventRelated: COLOR_EVENT_RELATED,
          lineColor: COLOR_LINE,
          labelColor: COLOR_LABEL
        }}
      />

      <LibreMap
        ref={mapRef}
        mapLib={import('maplibre-gl')}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        initialViewState={{ latitude: 39.8283, longitude: -98.5795, zoom: 3.5 }}
        style={{ width: '100%', height: '100vh' }}
        interactiveLayerIds={[
          'clusters',
          'cluster-count',
          'unclustered-point-hit',
          'line-hover-target',
        ]}
        onMouseMove={(e) => {
          const features = e.features ?? [];
          const hovered = features.find((f) => f.layer.id === 'line-hover-target');
          if (hovered && (hovered as any).properties?.reason) {
            setHoverInfo({ lngLat: e.lngLat.toArray() as [number, number], reason: (hovered as any).properties.reason as string });
          } else {
            setHoverInfo(null);
          }

          // Pointer cursor for interactive layers
          const map = mapRef.current?.getMap();
          if (map) {
            const isInteractive = map.queryRenderedFeatures(e.point, {
              layers: ['clusters', 'cluster-count', 'unclustered-point-hit', 'line-hover-target']
            }).length > 0;
            map.getCanvas().style.cursor = isInteractive ? 'pointer' : '';
          }
        }}
        onClick={async (e) => {
          const map = mapRef.current?.getMap();
          if (!map) return;

          // Widen the hit area a bit
          const pad = 10;
          type Pt = [number, number];
          const tl: Pt = [e.point.x - pad, e.point.y - pad];
          const br: Pt = [e.point.x + pad, e.point.y + pad];
          const bbox: [Pt, Pt] = [tl, br];

          // 1) Cluster click -> expand
          const clusterHits = map.queryRenderedFeatures(bbox as any, { layers: ['clusters'] }) as any[];
          if (clusterHits.length) {
            const f = clusterHits[0];
            const clusterId = f.properties.cluster_id as number;
            const src: any = map.getSource('events');
            if (src && typeof src.getClusterExpansionZoom === 'function') {
              if (src.getClusterExpansionZoom.length === 2) {
                src.getClusterExpansionZoom(clusterId, (_err: any, zoom: number) => {
                  map.easeTo({ center: f.geometry.coordinates as [number, number], zoom });
                });
              } else {
                const res = src.getClusterExpansionZoom(clusterId);
                const zoom = typeof res === 'number' ? res : await res;
                map.easeTo({ center: f.geometry.coordinates as [number, number], zoom });
              }
            }
            return;
          }

          // 2) Unclustered point -> open single or multi list
          const pointHits = map.queryRenderedFeatures(bbox as any, { layers: ['unclustered-point-hit'] }) as any[];
          if (pointHits.length) {
            const f = pointHits[0];
            const ids = ((f.properties?.eventIds as string) || '').split(',').filter(Boolean);
            const [lng, lat] = f.geometry.coordinates as [number, number];

            if (ids.length <= 1) {
              const ev = historicalEvents.find((x) => x.id === ids[0]);
              if (ev) {
                setSelectedEvent(ev);
                setPopupPosition(null);
                setLocationEvents([]);
              }
            } else {
              const list = ids
                .map((id) => historicalEvents.find((x) => x.id === id))
                .filter((x): x is HistoricalEvent => !!x);
              setLocationEvents(list);
              setPopupPosition([lng, lat]);
            }
            return;
          }
        }}
      >
        {/* ——— Clustered Source for visible event locations ——— */}
        <Source
          id="events"
          type="geojson"
          data={locationPoints as unknown as FeatureCollection}
          cluster={true}
          clusterRadius={CLUSTER_RADIUS}
          clusterMaxZoom={CLUSTER_MAX_ZOOM}
          generateId={true}
        >
          {/* Cluster bubbles */}
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"] as any}
            paint={{
              'circle-color': [
                'step',
                ['get', 'point_count'],
                COLOR_CLUSTER_LOW, CLUSTER_STEP_1, COLOR_CLUSTER_MID, CLUSTER_STEP_2, COLOR_CLUSTER_HIGH,
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                RADIUS_SMALL, CLUSTER_STEP_1, RADIUS_MED, CLUSTER_STEP_2, RADIUS_LARGE,
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            }}
          />

          {/* Cluster count labels */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"] as any}
            layout={{
              'text-field': ['to-string', ['get', 'point_count']] as any,
              'text-size': 12,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
            }}
            paint={{ 'text-color': '#08306b' }}
          />

          {/* Unclustered points (may represent multiple events at same coord, but one feature per event) */}
          <Layer
            id="unclustered-point"
            type="circle"
            filter={["!", ["has", "point_count"]] as any}
            paint={{
              'circle-color': [
                'match',
                ['get', 'role'],
                'primary', COLOR_EVENT_PRIMARY,
                'related', COLOR_EVENT_RELATED,
                /* default */ COLOR_EVENT_DEFAULT,
              ],
              'circle-radius': 6,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            }}
          />

          {/* Invisible, bigger hit area for easy clicking */}
          <Layer
            id="unclustered-point-hit"
            type="circle"
            filter={["!", ["has", "point_count"]] as any}
            paint={{ 'circle-color': '#000000', 'circle-opacity': 0.01, 'circle-radius': 14 }}
          />
        </Source>

        {/* Connection lines between events */}
        <Source id="connections" type="geojson" data={connectionData}>
          <Layer id="line-hover-target" type="line" paint={{ 'line-color': COLOR_LINE_HOVER_TARGET, 'line-opacity': 0, 'line-width': 10 }} />
          <Layer id="lines" type="line" paint={{ 'line-color': COLOR_LINE, 'line-width': 2 }} />
          <Layer
            id="line-labels"
            type="symbol"
            layout={{ 'symbol-placement': 'line-center', 'text-field': ['get', 'label'] as any, 'text-size': 13, 'text-anchor': 'top' }}
            paint={{ 'text-color': COLOR_LABEL }}
          />
        </Source>

        {/* Popup for selected event */}
        {selectedEvent && (
          <Popup
            latitude={selectedEvent.location.latitude}
            longitude={selectedEvent.location.longitude}
            onClose={() => setSelectedEvent(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="top"
            style={{ minWidth: 350 }}
          >
            <div style={{ minWidth: '100%' }}>
              <Card size="small" style={{ boxShadow: 'none', margin: 0 }} className="custom-ant-card">
                <Title level={5} style={{ marginBottom: 8 }}>
                  {selectedEvent.title}
                  <br />({selectedEvent.date})
                </Title>
                <Paragraph style={{ marginBottom: 8 }}>{selectedEvent.description}</Paragraph>
                {selectedEvent.people?.length ? (
                  <Paragraph style={{ marginTop: 8 }}>
                    <Text strong>People:</Text> {selectedEvent.people.join(', ')}
                  </Paragraph>
                ) : null}
              </Card>
            </div>
          </Popup>
        )}

        {/* Hover relationship reason popup */}
        {hoverInfo && (
          <Popup
            longitude={hoverInfo.lngLat[0]}
            latitude={hoverInfo.lngLat[1]}
            closeButton={false}
            closeOnClick={false}
            offset={10}
            anchor="top"
            style={{ minWidth: 200 }}
          >
            <Text>{hoverInfo.reason}</Text>
          </Popup>
        )}

        {/* Popup for same-location events (multi) */}
        {popupPosition && locationEvents.length > 1 && (
          <Popup
            longitude={popupPosition[0]}
            latitude={popupPosition[1]}
            closeOnClick={false}
            onClose={() => {
              setPopupPosition(null);
              setLocationEvents([]);
            }}
            anchor="top"
          >
            <div style={{ maxWidth: 260 }}>
              <strong>Events at this location:</strong>
              <ul style={{ paddingLeft: 16, marginTop: 8 }}>
                {locationEvents.map((e) => (
                  <li
                    key={e.id}
                    onClick={() => {
                      setSelectedEvent(e);
                      setPopupPosition(null);
                      setLocationEvents([]);
                    }}
                    style={{ cursor: 'pointer', marginBottom: 6, textDecoration: 'underline', color: '#1677ff' }}
                  >
                    {e.title} <br />
                    <small>{e.date}</small>
                  </li>
                ))}
              </ul>
            </div>
          </Popup>
        )}
      </LibreMap>

      <TimelinePanel year={activeYear} onChange={setActiveYear} min={1700} max={2000} />
    </>
  );
};

export default MapView;
