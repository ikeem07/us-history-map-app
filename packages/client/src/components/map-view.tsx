import React from 'react';
import { Map, Marker, Source, Layer, Popup } from 'react-map-gl/maplibre';
import { Card, Typography } from 'antd';

import events from '../data/historical-events.json';
import type { HistoricalEvent } from '../types/historical-event';
import type { Feature, FeatureCollection, LineString } from 'geojson';

const historicalEvents = events as HistoricalEvent[];

const MapView: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = React.useState<HistoricalEvent | null>(null);

  const { Title, Paragraph, Text } = Typography;

  const connectionFeatures: Feature<LineString>[] = selectedEvent
    ? selectedEvent.relatedEventIds
      .map((relatedId): Feature<LineString> | null => {
        const target = historicalEvents.find((e) => e.id === relatedId);
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
            label
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
    <Map
      mapLib={import('maplibre-gl')}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      initialViewState={{
        latitude: 39.8283,
        longitude: -98.5795,
        zoom: 3.5
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      {/* Markers for each event */}
      {historicalEvents.map((event) => (
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
              backgroundColor: 'red',
              cursor: 'pointer',
              border: '2px solid white'
            }}
          />
        </Marker>
      ))}

      {/* Connection lines between events */}
      <Source id="connections" type="geojson" data={connectionData}>
        <Layer
          id="lines"
          type="line"
          paint={{
            'line-color': '#333',
            'line-width': 2
          }}
        />
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
    </Map>
  );
};

export default MapView;
