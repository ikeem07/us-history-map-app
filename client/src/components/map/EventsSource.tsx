import React from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { FeatureCollection, Point } from 'geojson';
import type { LocationPointProps } from '../../hooks/useLocationPoints';

import {
  COLOR_EVENT_PRIMARY,
  COLOR_EVENT_RELATED,
  COLOR_EVENT_DEFAULT,
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
} from '../../constants/map';

type Props = {
  data: FeatureCollection<Point, LocationPointProps>;
};

const EventsSource: React.FC<Props> = ({ data }) => {
  return (
    <Source
      id="events"
      type="geojson"
      data={data as unknown as FeatureCollection}
      cluster={true}
      clusterRadius={CLUSTER_RADIUS}
      clusterMaxZoom={CLUSTER_MAX_ZOOM}
      generateId={true}
    >
      {/* Cluster bubbles */}
      <Layer
        id="clusters"
        type="circle"
        filter={['has', 'point_count'] as any}
        paint={{
          'circle-color': ['step', ['get', 'point_count'], COLOR_CLUSTER_LOW, CLUSTER_STEP_1, COLOR_CLUSTER_MID, CLUSTER_STEP_2, COLOR_CLUSTER_HIGH] as any,
          'circle-radius': ['step', ['get', 'point_count'], RADIUS_SMALL, CLUSTER_STEP_1, RADIUS_MED, CLUSTER_STEP_2, RADIUS_LARGE] as any,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        }}
      />

      {/* Cluster count labels */}
      <Layer
        id="cluster-count"
        type="symbol"
        filter={['has', 'point_count'] as any}
        layout={{
          'text-field': ['to-string', ['get', 'point_count']] as any,
          'text-size': 12,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        }}
        paint={{ 'text-color': '#08306b' }}
      />

      {/* Unclustered points */}
      <Layer
        id="unclustered-point"
        type="circle"
        filter={['!', ['has', 'point_count']] as any}
        paint={{
          'circle-color': ['match', ['get', 'role'], 'primary', COLOR_EVENT_PRIMARY, 'related', COLOR_EVENT_RELATED, /* default */ COLOR_EVENT_DEFAULT] as any,
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        }}
      />

      {/* Invisible, bigger hit area for easy clicking */}
      <Layer
        id="unclustered-point-hit"
        type="circle"
        filter={['!', ['has', 'point_count']] as any}
        paint={{ 'circle-color': '#000000', 'circle-opacity': 0.01, 'circle-radius': 14 }}
      />
    </Source>
  );
};

export default EventsSource;
