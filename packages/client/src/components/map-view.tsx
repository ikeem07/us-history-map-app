import React, { act, useEffect } from 'react';
import { Map, Marker, Source, Layer, Popup, MapRef } from 'react-map-gl/maplibre';
import { Card, Typography, Slider } from 'antd';
import type { Feature, FeatureCollection, LineString } from 'geojson';

import events from '../data/historical-events.json';
import TimelinePanel from './timeline-panel';
import type { HistoricalEvent } from '../types/historical-event';


const historicalEvents = events as HistoricalEvent[];

const MapView: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = React.useState<HistoricalEvent | null>(null);
  const [hoverInfo, setHoverInfo] = React.useState<{
    lngLat: [number, number];
    reason: string;
  } | null>(null);
  const [activeYear, setActiveYear] = React.useState<number | null>(1776);

  const mapRef = React.useRef<MapRef | null>(null);

  const { Title, Paragraph, Text } = Typography;

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    const enterHandler = () => {
      map.getCanvas().style.cursor = 'pointer';
    }

    const leaveHandler = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('mouseenter', 'line-hover-target', enterHandler);
    map.on('mouseleave', 'line-hover-target', leaveHandler);

    return () => {
      map.off('mouseenter', 'line-hover-target', enterHandler);
      map.off('mouseleave', 'line-hover-target', leaveHandler);
    };
  }, [selectedEvent]);

  const visibleEvents = React.useMemo(() => {
    const base = activeYear
      ? historicalEvents.filter(e => new Date(e.date).getFullYear() === activeYear)
      : historicalEvents;
    
    if (!selectedEvent) return base;

    const relatedIds = new Set(selectedEvent.relatedEvents.map(r => r.id));
    const relatedOnly = historicalEvents.filter(e => relatedIds.has(e.id));

    // Add any related events not already in base
    const merged = [...base];
    for (const e of relatedOnly) {
      if (!base.some(b => b.id === e.id)) {
        merged.push(e);
      }
    }
    return merged;
  }, [activeYear, selectedEvent])

  const connectionFeatures: Feature<LineString>[] = selectedEvent
    ? selectedEvent.relatedEvents
      .map(({ id: relatedId, reason }): Feature<LineString> | null => {
        const target = visibleEvents.find((e) => e.id === relatedId);
        if (!target) return null;

        const [lng1, lat1] = [selectedEvent.location.longitude, selectedEvent.location.latitude];
        const [lng2, lat2] = [target.location.longitude, target.location.latitude];

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

  return (
    <>
      <Map
        ref={mapRef}
        mapLib={import('maplibre-gl')}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        initialViewState={{
          latitude: 39.8283,
          longitude: -98.5795,
          zoom: 3.5
        }}
        style={{ width: '100%', height: '100vh' }}
        onMouseMove={(e) => {
          const features = e.features ?? [];
          const hovered = features.find((f) => f.layer.id === 'line-hover-target');
          if (hovered?.properties?.reason) {
            setHoverInfo({
              lngLat: e.lngLat.toArray() as [number, number],
              reason: hovered.properties.reason
            })
          } else {
            setHoverInfo(null);
          }
        }}
        interactiveLayerIds={['line-hover-target']}
      >
        {/* Markers for each event */}
        {visibleEvents.map((event) => {
          const isPrimary = selectedEvent?.id === event.id;
          const isRelated = selectedEvent?.relatedEvents.some((r) => r.id === event.id);
          const color = isPrimary ? 'red' : isRelated ? 'blue' : 'gray';

          return (
            <Marker
              key={event.id}
              latitude={event.location.latitude}
              longitude={event.location.longitude}
              anchor="bottom"
            >
              <div
                title={event.title}
                onClick={() => {
                  if (selectedEvent?.id === event.id) {
                    setSelectedEvent(null);
                  } else {
                    setSelectedEvent(event)
                  }
                }}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: '2px solid white'
                }}
              />
            </Marker>
          )
        })}

        {/* Connection lines between events */}
        <Source id="connections" type="geojson" data={connectionData}>
          {/* Invisible hover layer */}
          <Layer
            id='line-hover-target'
            type='line'
            paint={{
              'line-color': '#000',
              'line-opacity': 0,
              'line-width': 10
            }}
          />
          {/* Actual visible line layer */}
          <Layer
            id="lines"
            type="line"
            paint={{
              'line-color': '#333',
              'line-width': 2
            }}
          />
          {/* Label layer */}
          <Layer
            id='line-labels'
            type='symbol'
            layout={{
              'symbol-placement': 'line-center',
              'text-field': ['get', 'label'],
              'text-size': 13,
              'text-anchor': 'top'
            }}
            paint={{
              'text-color': 'rgba(12, 107, 3, 1)'
            }}
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
              <Card 
                size="small" 
                style={{ boxShadow: 'none', margin: 0 }}
                className='custom-ant-card'
              >
                <Title level={5} style={{ marginBottom: 8 }}>
                  {selectedEvent.title} 
                  <br />
                  ({selectedEvent.date})
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
      </Map>
      <TimelinePanel
        year={activeYear}
        onChange={setActiveYear}
        min={1700}
        max={2000}
      />
    </>
  );
};

export default MapView;
