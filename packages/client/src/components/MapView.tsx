import React from 'react';
import { Map, Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import events from '../data/historical-events.json';
import type { HistoricalEvent } from '../types/HistoricalEvent';
import type { Feature, FeatureCollection, LineString } from 'geojson';

const historicalEvents = events as HistoricalEvent[];

const MapView: React.FC = () => {
  const connectionFeatures: Feature<LineString>[] =
    historicalEvents.flatMap((event) =>
      event.relatedEventIds
        .map((relatedId): Feature<LineString> | null => {
          const target = historicalEvents.find((e) => e.id === relatedId);
          if (!target) return null;

          return {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [event.location.longitude, event.location.latitude],
                [target.location.longitude, target.location.latitude]
              ]
            },
            properties: {}
          };
        })
  ).filter((f): f is Feature<LineString> => f !== null);

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
      </Source>
    </Map>
  );
};

export default MapView;
