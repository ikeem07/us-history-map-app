import React from 'react';
import { Map as LibreMap, MapRef } from 'react-map-gl/maplibre';
import { Helmet } from 'react-helmet';
import { Button } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

import events from '../data/historical-events.json';
import type { HistoricalEvent } from '../types/historical-event';

import FilterSidebar from './filter-sidebar';
import TimelinePanel from './timeline-panel';
import MapLegend from './map-legend';

import { useVisibleEvents } from '../hooks/useVisibleEvents';
import { useLocationPoints } from '../hooks/useLocationPoints';
import { useConnectionData } from '../hooks/useConnectionData';
import { useIsMobile } from '../hooks/useIsMobile';

import EventsSource from './map/EventsSource';
import ConnectionsSource from './map/ConnectionsSource';
import { HoverReasonPopup, MultiEventPopup, SelectedEventPopup } from './map/MapPopups';

import {
  COLOR_EVENT_PRIMARY, COLOR_EVENT_RELATED, COLOR_EVENT_DEFAULT,
  COLOR_LINE, COLOR_LABEL,
  COLOR_CLUSTER_LOW, COLOR_CLUSTER_MID, COLOR_CLUSTER_HIGH,
  INTERACTIVE_LAYERS
} from '../constants/map';

const historicalEvents = events as HistoricalEvent[];

const MapView: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = React.useState<HistoricalEvent | null>(null);
  const [activeYear, setActiveYear] = React.useState<number | null>(null);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = React.useState<string[]>([]);
  const [legendCollapsed, setLegendCollapsed] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [timelineOpen, setTimelineOpen] = React.useState(false);

  // popups
  const [hoverInfo, setHoverInfo] = React.useState<{ lngLat: [number, number]; reason: string } | null>(null);
  const [multiPopup, setMultiPopup] = React.useState<{ position: [number, number] | null; events: HistoricalEvent[] }>({
    position: null,
    events: [],
  });

  const mapRef = React.useRef<MapRef | null>(null);
  const isMobile = useIsMobile();

  // Derived data
  const visibleEvents = useVisibleEvents({
    allEvents: historicalEvents,
    activeYear,
    selectedTags,
    selectedPeople,
    selectedEvent,
  });
  const locationPoints = useLocationPoints(visibleEvents, selectedEvent);
  const connectionData = useConnectionData(selectedEvent, visibleEvents);

  const handleYear = (y: number | null) => { setActiveYear(y); if (isMobile) setTimelineOpen(false); };

  React.useEffect(() => {
    if (activeYear == null) localStorage.removeItem('activeYear');
    else localStorage.setItem('activeYear', String(activeYear));
  }, [activeYear]);

  return (
    <>
      <Helmet>
        <title>History Map</title>
        <meta name="description" content="Explore historical events on an interactive map." />
      </Helmet>

      {isMobile && (
        <Button
          type="primary"
          icon={<ClockCircleOutlined />}
          onClick={() => setTimelineOpen(true)}
          style={{ position: 'absolute', left: 12, top: 12, zIndex: 1200 }}
        >
          Timeline
        </Button>
      )}

      <FilterSidebar
        selectedTags={selectedTags}
        selectedPeople={selectedPeople}
        allTags={Array.from(new Set(historicalEvents.flatMap((e) => e.tags || []))).sort()}
        allPeople={Array.from(new Set(historicalEvents.flatMap((e) => e.people || []))).sort()}
        onChangeTags={setSelectedTags}
        onChangePeople={setSelectedPeople}
        onClear={() => {
          setSelectedTags([]);
          setSelectedPeople([]);
        }}
        // for mobile view
        isMobile={isMobile}
        mobileOpen={isMobile ? drawerOpen : undefined}
        onMobileClose={isMobile ? () => setDrawerOpen(false) : undefined}
      />

      <MapLegend
        collapsed={legendCollapsed}
        onToggle={() => setLegendCollapsed((s) => !s)}
        colors={{
        clusterLow: COLOR_CLUSTER_LOW,
        clusterMid: COLOR_CLUSTER_MID,
        clusterHigh: COLOR_CLUSTER_HIGH,
        eventDefault: COLOR_EVENT_DEFAULT,
        eventPrimary: COLOR_EVENT_PRIMARY,
        eventRelated: COLOR_EVENT_RELATED,
        lineColor: COLOR_LINE,
        labelColor: COLOR_LABEL,
      }}
      />

      <LibreMap
        ref={mapRef}
        mapLib={import('maplibre-gl')}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        initialViewState={{ latitude: 39.8283, longitude: -98.5795, zoom: 3.5 }}
        style={{ width: '100%', height: '100vh' }}
        interactiveLayerIds={[...INTERACTIVE_LAYERS]}
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
              layers: [...INTERACTIVE_LAYERS],
            }).length > 0;
            map.getCanvas().style.cursor = isInteractive ? 'pointer' : '';
          }
        }}
        onClick={async (e) => {
          const map = mapRef.current?.getMap();
          if (!map) return;

          // Small bbox to make clicking forgiving
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

          // 2) Unclustered point -> single or multi popup
          const pointHits = map.queryRenderedFeatures(bbox as any, { layers: ['unclustered-point-hit'] }) as any[];
          if (pointHits.length) {
            const f = pointHits[0];
            const ids = ((f.properties?.eventIds as string) || '').split(',').filter(Boolean);
            const [lng, lat] = f.geometry.coordinates as [number, number];

            if (ids.length <= 1) {
              const ev = historicalEvents.find((x) => x.id === ids[0]);
              if (ev) {
                setSelectedEvent(ev);
                setMultiPopup({ position: null, events: [] });
              }
            } else {
              const list = ids
                .map((id) => historicalEvents.find((x) => x.id === id))
                .filter((x): x is HistoricalEvent => !!x);
              setMultiPopup({ position: [lng, lat], events: list });
            }
            return;
          }
        }}
      >
        <EventsSource data={locationPoints} mobile={isMobile}/>
        <ConnectionsSource data={connectionData} />

        {/* Popups */}
        <SelectedEventPopup event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        <HoverReasonPopup lngLat={hoverInfo?.lngLat ?? null} reason={hoverInfo?.reason ?? null} />
        <MultiEventPopup
          data={multiPopup}
          onSelect={(e) => {
            setSelectedEvent(e);
            setMultiPopup({ position: null, events: [] });
          }}
          onClose={() => setMultiPopup({ position: null, events: [] })}
        />
      </LibreMap>

      {/* Timeline: drawer on mobile, inline on desktop */}
      {isMobile ? (
        <TimelinePanel
          variant="drawer"  
          open={timelineOpen}
          onClose={() => setTimelineOpen(false)}
          year={activeYear}
          onChange={handleYear}
          min={1700}
          max={2000}
          heightVh={42}
        />
      ) : (
        <TimelinePanel
          variant="inline"
          year={activeYear}
          onChange={setActiveYear}
          min={1700}
          max={2000}
        />
      )}
    </>
  );
};

export default MapView;
