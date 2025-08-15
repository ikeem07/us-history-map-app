import React from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString } from 'geojson';
import { COLOR_LINE, COLOR_LABEL, COLOR_LINE_HOVER_TARGET } from '../../constants/map';

type Props = {
  data: FeatureCollection<LineString>;
};

const ConnectionsSource: React.FC<Props> = ({ data }) => {
  return (
    <Source id="connections" type="geojson" data={data}>
      <Layer id="line-hover-target" type="line" paint={{ 'line-color': COLOR_LINE_HOVER_TARGET, 'line-opacity': 0, 'line-width': 10 }} />
      <Layer id="lines" type="line" paint={{ 'line-color': COLOR_LINE, 'line-width': 2 }} />
      <Layer
        id="line-labels"
        type="symbol"
        layout={{ 'symbol-placement': 'line-center', 'text-field': ['get', 'label'] as any, 'text-size': 13, 'text-anchor': 'top' }}
        paint={{ 'text-color': COLOR_LABEL }}
      />
    </Source>
  );
};

export default ConnectionsSource;
