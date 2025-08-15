import React from 'react';
import { Card, Typography, Button } from 'antd';
import { InfoCircleOutlined, DragOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'; 
import {
  COLOR_EVENT_PRIMARY, COLOR_EVENT_RELATED, COLOR_EVENT_DEFAULT,
  COLOR_LINE, COLOR_LABEL,
  COLOR_CLUSTER_LOW, COLOR_CLUSTER_MID, COLOR_CLUSTER_HIGH,
  CLUSTER_STEP_1, CLUSTER_STEP_2
} from '../constants/map';

const { Text } = Typography;

const DEFAULT_COLORS = {
  clusterLow: COLOR_CLUSTER_LOW,
  clusterMid: COLOR_CLUSTER_MID,
  clusterHigh: COLOR_CLUSTER_HIGH,
  eventDefault: COLOR_EVENT_DEFAULT,
  eventPrimary: COLOR_EVENT_PRIMARY,
  eventRelated: COLOR_EVENT_RELATED,
  lineColor: COLOR_LINE,
  labelColor: COLOR_LABEL,
};

export type MapLegendProps = {
  collapsed?: boolean;
  onToggle: () => void;
  colors?: typeof DEFAULT_COLORS;
  initialPosition?: { top?: number; right?: number; left?: number; bottom?: number };
}

const circle = (color: string, size = 12, extra?: React.CSSProperties): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: '50%',
  background: color,
  border: '2px solid #fff',
  boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
  display: 'inline-block',
  marginRight: 8,
  ...extra
})

const lineSwatch = (color: string): React.CSSProperties => ({
  width: 28,
  height: 2,
  background: color,
  display: 'inline-block',
  marginRight: 8
});

const labelChip = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '1px 6px',
  background: 'rgba(0,0,0,0.01)',
  borderRadius: 4,
  border: '1px solid rgba(0,0,0,0.08)',
  color,
})

const MapLegend: React.FC<MapLegendProps> = ({ 
  collapsed, 
  onToggle, 
  colors = DEFAULT_COLORS, 
  initialPosition 
}) => {
  // simple draggable position managed locally
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState<{ x: number; y: number }>(() => {
    // default: top-right (20px from edges)
    const top = initialPosition?.top ?? 20;
    const right = initialPosition?.right ?? 20;
    // calculate x from right on first mount
    return { x: -right, y: top };
  });
  const [dragging, setDragging] = React.useState(false);
  const startRef = React.useRef<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    // On first mount, convert negative x (meaning "from right") to absolute left
    if (containerRef.current && pos.x < 0) {
      const width = containerRef.current.offsetWidth;
      setPos({ x: window.innerWidth - (Math.abs(pos.x) + width), y: pos.y });
    }
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    startRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    // avoid text selection with dragging
    document.body.style.userSelect = 'none';
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging || !startRef.current) return;
    const nx = e.clientX - startRef.current.x;
    const ny = e.clientY - startRef.current.y;
    // keep within viewport
    const node = containerRef.current;
    const w = node?.offsetWidth ?? 0;
    const h = node?.offsetHeight ?? 0;
    const maxX = window.innerWidth - w - 8;
    const maxY = window.innerHeight - h - 8;
    setPos({
      x: Math.max(8, Math.min(nx, maxX)),
      y: Math.max(8, Math.min(ny, maxY))
    });
  };

  const onMouseUp = () => {
    setDragging(false);
    startRef.current = null;
    document.body.style.userSelect = '';
  };

  React.useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        zIndex: 1100,
        cursor: dragging ? 'grabbing' : 'default'
      }}
    >
      <Card
        size='small'
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <InfoCircleOutlined />
            <span>Map Legend</span>
            <div style={{ flex: 1 }} />
            <Button
              size='small'
              type="text"
              title="Drag"
              icon={<DragOutlined />}
              onMouseDown={onMouseDown}
              style={{ cursor: 'grab' }}
            />
            <Button
              size='small'
              type="text"
              onClick={onToggle}
              icon={collapsed ? <PlusOutlined /> : <MinusOutlined />}
              title={collapsed ? "Expand" : "Collapse"}
              style={{ marginRight: 1 }}
            />
          </div>
        }
        style={{ width: 200, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        styles={{
          header: { padding: '8px 12px' },
          body: { padding: collapsed ? 0 : 12, display: collapsed ? 'none' : 'block' },
        }}
      >
        {/* Clusters */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ marginBottom: 4, fontWeight: 600 }}>Clusters</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <span style={circle(colors.clusterLow, 12)} /> <Text>1–{CLUSTER_STEP_1 - 1} events</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <span style={circle(colors.clusterMid, 14)} /> <Text>{CLUSTER_STEP_1}–{CLUSTER_STEP_2 - 1} events</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={circle(colors.clusterHigh, 16)} /> <Text>{CLUSTER_STEP_2}+ events</Text>
          </div>
        </div>

        {/* Points */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ marginBottom: 4, fontWeight: 600 }}>Events</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <span style={circle(colors.eventPrimary)} /> <Text>Selected event</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <span style={circle(colors.eventRelated)} /> <Text>Related event</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={circle(colors.eventDefault)} /> <Text>Other event</Text>
          </div>
        </div>

        {/* Connections */}
        <div>
          <div style={{ marginBottom: 4, fontWeight: 600 }}>Connections</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span style={lineSwatch(colors.lineColor)} /> <Text>Connection line</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 8 }}>
              {/* Line above */}
              <span 
                style={{
                  width: 28,
                  height: 2,
                  borderTop: `2px solid ${colors.lineColor}`,
                  marginBottom: 2
                }}
              />
              {/* Text below */}
              <span
                style={{
                  fontSize: 10,
                  color: colors.labelColor,
                  lineHeight: '10px',
                }}
              >
                Label
              </span>
            </span>
            <Text>Connection label</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MapLegend;
