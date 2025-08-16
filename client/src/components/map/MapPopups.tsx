import React from 'react';
import { Popup } from 'react-map-gl/maplibre';
import { Card, Typography } from 'antd';
import type { HistoricalEvent } from '../../types/historical-event';

type MultiPopup = {
  position: [number, number] | null;
  events: HistoricalEvent[];
};

export function SelectedEventPopup({
  event,
  onClose,
}: {
  event: HistoricalEvent | null;
  onClose: () => void;
}) {
  const { Title, Paragraph, Text } = Typography;
  if (!event) return null;

  return (
    <Popup
      latitude={event.location.latitude}
      longitude={event.location.longitude}
      onClose={onClose}
      closeButton={true}
      closeOnClick={false}
      anchor="top"
      style={{ width: 'min(360px, calc(100vw - 40px))' }}
    >
      <div style={{ minWidth: '100%' }}>
        <Card size="small" style={{ boxShadow: 'none', margin: 0 }} className="custom-ant-card">
          <Title level={5} style={{ marginBottom: 8 }}>
            {event.title}
            <br />({event.date})
          </Title>
          <Paragraph style={{ marginBottom: 8 }}>{event.description}</Paragraph>
          {event.people?.length ? (
            <Paragraph style={{ marginTop: 8 }}>
              <Text strong>People:</Text> {event.people.join(', ')}
            </Paragraph>
          ) : null}
        </Card>
      </div>
    </Popup>
  );
}

export function HoverReasonPopup({
  lngLat,
  reason,
}: {
  lngLat: [number, number] | null;
  reason: string | null;
}) {
  if (!lngLat || !reason) return null;
  return (
    <Popup longitude={lngLat[0]} latitude={lngLat[1]} closeButton={false} closeOnClick={false} offset={10} anchor="top" style={{ maxWidth: 'min(300px, calc(100vw - 40px))' }}>
      <Typography.Text>{reason}</Typography.Text>
    </Popup>
  );
}

export function MultiEventPopup({
  data,
  onSelect,
  onClose,
}: {
  data: MultiPopup;
  onSelect: (e: HistoricalEvent) => void;
  onClose: () => void;
}) {
  if (!data.position || data.events.length <= 1) return null;

  return (
    <Popup longitude={data.position[0]} latitude={data.position[1]} closeOnClick={false} onClose={onClose} anchor="top">
      <div style={{ maxWidth: 260 }}>
        <strong>Events at this location:</strong>
        <ul style={{ paddingLeft: 16, marginTop: 8 }}>
          {data.events.map((e) => (
            <li
              key={e.id}
              onClick={() => onSelect(e)}
              style={{ cursor: 'pointer', marginBottom: 6, textDecoration: 'underline', color: '#1677ff' }}
            >
              {e.title} <br />
              <small>{e.date}</small>
            </li>
          ))}
        </ul>
      </div>
    </Popup>
  );
}
