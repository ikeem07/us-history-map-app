import React, { useEffect } from 'react';
import { Map as LibreMap, Source, Layer, Popup, MapRef } from 'react-map-gl/maplibre';
import { Card, Typography } from 'antd';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { Helmet } from 'react-helmet';

import events from '../data/historical-events.json';
import TimelinePanel from './timeline-panel';
import type { HistoricalEvent } from '../types/historical-event';
import FilterSidebar from './filter-sidebar';


const historicalEvents = events as HistoricalEvent[];

const MapView: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = React.useState<HistoricalEvent | null>(null);
  const [hoverInfo, setHoverInfo] = React.useState<{
    lngLat: [number, number];
    reason: string;
  } | null>(null);
  const [activeYear, setActiveYear] = React.useState<number | null>(null);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = React.useState<string[]>([]);
  const [locationEvents, setLocationEvents] = React.useState<HistoricalEvent[]>([]);
  const [popupPosition, setPopupPosition] = React.useState<[number, number] | null>(null);

  const mapRef = React.useRef<MapRef | null>(null);

  const { Title, Paragraph, Text } = Typography;

  // ————————————————————————————————————————————————————————————————
  //  Filters -> visible events
  // ————————————————————————————————————————————————————————————————
  const visibleEvents = React.useMemo(() => {
    const filtered = historicalEvents.filter((event) => {
      const matchesYear =
        activeYear == null || new Date(event.date).getFullYear() === activeYear;
    
      const matchesTags =
        selectedTags.length === 0 ||
        (event.tags && event.tags.some((tag) => selectedTags.includes(tag)));

      const matchesPeople =
        selectedPeople.length === 0 ||
        (event.people && event.people.some((p) => selectedPeople.includes(p)));

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
  }, [activeYear, selectedTags, selectedPeople, selectedEvent])

  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    historicalEvents.forEach((e) => e.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, []);

  const allPeople = React.useMemo(() => {
    const peopleSet = new Set<string>();
    historicalEvents.forEach((e) => e.people?.forEach((p) => peopleSet.add(p)));
    return Array.from(peopleSet).sort();
  }, []);

  // ————————————————————————————————————————————————————————————————
  //  Connection lines between selected event and its visible related events
  // ————————————————————————————————————————————————————————————————
  const connectionFeatures: Feature<LineString>[] = selectedEvent
    ? selectedEvent.relatedEvents
      .map(({ id: relatedId, reason }): Feature<LineString> | null => {
        const target = visibleEvents.find((e) => e.id === relatedId);
        if (!target) return null;

        const [lng1, lat1] = [
          selectedEvent.location.longitude, 
          selectedEvent.location.latitude
        ];
        const [lng2, lat2] = [
          target.location.longitude, 
          target.location.latitude
        ];

        let label = '';
        if (lng1 < lng2) {
          label = `${selectedEvent.title} <-> ${target.title}`;
        } else if (lng1 > lng2) {
          label = `${target.title} <-> ${selectedEvent.title}`;
        } else if (lat1 < lat2) {
          label = `${selectedEvent.title} <-> ${target.title}`;
        } else {
          label = `${target.title} <-> ${selectedEvent.title}`;
        }

        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [lng1, lat1],
              [lng2, lat2]
            ]
          },
          properties: {
            label,
            reason
          }
        };
      })
      .filter((f): f is Feature<LineString> => f !== null)
    : [];

  const connectionData: FeatureCollection<LineString> = {
    type: 'FeatureCollection',
    features: connectionFeatures
  };

  // ————————————————————————————————————————————————————————————————
  //  Group visible events by exact lat/lng -> one point per location
  //  Each point keeps the list of event ids at that coordinate.
  //  These points are then clustered by MapLibre when zoomed out.
  // ————————————————————————————————————————————————————————————————
  type LocationPointProps = {
    eventIds: string[];
    role: 'primary' | 'related' | 'default';
    lng: number;
    lat: number;
  };

  const locationPoints: FeatureCollection<Point, LocationPointProps> = React.useMemo(() => {
    const grouped = new Map<string, { lat: number; lng: number; eventIds: string[] }>();

    for (const e of visibleEvents) {
      const key = `${e.location.latitude},${e.location.longitude}`;
      if (!grouped.has(key)) {
        grouped.set(key, { 
          lat: e.location.latitude, 
          lng: e.location.longitude, 
          eventIds: [e.id] 
        });
      } else {
        grouped.get(key)!.eventIds.push(e.id);
      }
    }

    const features: Feature<Point, LocationPointProps>[] = [];

    const selectedId = selectedEvent?.id;
    const relatedIds = new Set<string>(selectedEvent?.relatedEvents.map((r) => r.id) ?? []);

    for (const { lat, lng, eventIds} of Array.from(grouped.values())) {
      let role: LocationPointProps['role'] = 'default';
      if (selectedId && eventIds.includes(selectedId)) role = 'primary';
      else if (eventIds.some((id) => relatedIds.has(id))) role = 'related';
    
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { eventIds, role, lng, lat }
      });
    }

    return { type: 'FeatureCollection', features };
  }, [visibleEvents, selectedEvent]);

  // ————————————————————————————————————————————————————————————————
  //  Pointer cursor for interactive layers (clusters, points, hover lines)
  // ————————————————————————————————————————————————————————————————
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    const enter = () => (map.getCanvas().style.cursor = 'pointer');
    const leave = () => (map.getCanvas().style.cursor = '');

    map.on('mouseenter', 'clusters', enter);
    map.on('mouseleave', 'clusters', leave);
    map.on('mouseenter', 'unclustered-point', enter);
    map.on('mouseleave', 'unclustered-point', leave);
    map.on('mouseenter', 'line-hover-target', enter);
    map.on('mouseleave', 'line-hover-target', leave);

    return () => {
      map.off('mouseenter', 'clusters', enter);
      map.off('mouseleave', 'clusters', leave);
      map.off('mouseenter', 'unclustered-point', enter);
      map.off('mouseleave', 'unclustered-point', leave);
      map.off('mouseenter', 'line-hover-target', enter);
      map.off('mouseleave', 'line-hover-target', leave);
    }
  }, []);

  // ————————————————————————————————————————————————————————————————
  //  Map
  // ————————————————————————————————————————————————————————————————
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

      <LibreMap
        ref={mapRef}
        mapLib={import('maplibre-gl')}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        initialViewState={{ latitude: 39.8283, longitude: -98.5795, zoom: 3.5 }}
        style={{ width: '100%', height: '100vh' }}
        interactiveLayerIds={[
          'clusters',
          'cluster-count', 
          'unclustered-point',
          'line-hover-target'
        ]}
        onMouseMove={(e) => {
          const features = e.features ?? [];
          const hovered = features.find((f) => f.layer.id === 'line-hover-target');
          if (hovered?.properties?.reason) {
            setHoverInfo({
              lngLat: e.lngLat.toArray() as [number, number],
              reason: (hovered as any).properties.reason as string
            });
          } else {
            setHoverInfo(null);
          }
        }}
        onClick={(e) => {
          const map = mapRef.current?.getMap();
          if (!map) return;

          const feature = (e.features ?? [])[0] as any;
          if (!feature) return;

          // 1) Clicked a CLUSTER -> zoom in to expansion zoom
          if (feature.layer?.id === 'clusters') {
            const clusterId = feature.properties.cluster_id as number;
            const source = map.getSource('events') as any; // GeoJSONSource
            if (source && typeof source.getClusterExpansionZoom === 'function') {
              const expansionZoom = source.getClusterExpansionZoom(clusterId) as number;
              map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom: expansionZoom });
            }
            return;
          }

          // 2) Clicked an UNCLUSTERED POINT -> show single-event popup or list
          if (feature.layer?.id === 'unclustered-point') {
            const ids: string[] = feature.properties.eventIds || [];
            const [lng, lat] = feature.geometry.coordinates as [number, number];

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
          clusterRadius={60}
          clusterMaxZoom={12}
        >
          {/* Clusters (bubbles) */}
          <Layer
            id='clusters'
            type='circle'
            filter={['has', 'point_count'] as any}
            paint={{
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#9ecae1', // small
                10,
                '#6baed6', // medium
                25,
                '#3182bd', // large
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                16,
                10,
                20,
                25,
                26
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff'
            }}
          />

          {/* Cluster count labels */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count'] as any}
            layout={{
              'text-field': ['get', 'point_count'] as any,
              'text-size': 12,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            }}
            paint={{ 'text-color': '#08306b' }}
          />

          {/* Unclustered points (each is one coordinate; may represent multiple events) */}
          <Layer
            id='unclustered-point'
            type='circle'
            filter={['!', ['has', 'point_count']] as any}
            paint={{
              'circle-color': [
                'match',
                ['get', 'role'],
                'primary', '#f5222d',
                'related', '#1677ff',
                /* default */ '#666666'
              ],
              'circle-radius': 6,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff'
            }}
          />
        </Source>

        {/* Connection lines between events */}
        <Source id="connections" type='geojson' data={connectionData}>
            {/* Invisible hover layer */}
            <Layer
              id="line-hover-target"
              type="line"
              paint={{ 'line-color': '#000', 'line-opacity': 0, 'line-width': 2 }} 
            />
            {/* Actual visible line layer */}
            <Layer id="lines" type="line" paint={{ 'line-color': '#333', 'line-width': 2 }} />
            {/* Label layer */}
            <Layer
              id="line-labels"
              type="symbol"
              layout={{
                'symbol-placement': 'line-center',
                'text-field': ['get', 'label'] as any,
                'text-size': 13,
                'text-anchor': 'top'
              }}
              paint={{ 'text-color': 'rgba(12, 107, 3, 1)' }}
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
              <Card size="small" style={{ boxShadow: 'none', margin: 0 }} className='custom-ant-card'>
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

        {/* Popup for same location events (i.e. when an unclustered point groups multiple)*/}
        {popupPosition && locationEvents.length > 1 && (
          <Popup
            longitude={popupPosition[0]}
            latitude={popupPosition[1]}
            closeOnClick={false}
            onClose={() => {
              setPopupPosition(null);
              setLocationEvents([]);
            }}
            anchor='top'
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
                    style={{
                      cursor: 'pointer',
                      marginBottom: 6,
                      textDecoration: 'underline',
                      color: '#1677ff'
                    }}
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
