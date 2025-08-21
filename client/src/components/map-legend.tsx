import React from 'react';
import { Card, Typography, Button } from 'antd';
import { InfoCircleOutlined, DragOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'; 
import {
  COLOR_EVENT_PRIMARY, COLOR_EVENT_RELATED, COLOR_EVENT_DEFAULT,
  COLOR_LINE, COLOR_LABEL, COLOR_CLUSTER_LOW, COLOR_CLUSTER_MID, COLOR_CLUSTER_HIGH,
  CLUSTER_STEP_1, CLUSTER_STEP_2
} from '../constants/map';
import { useIsMobile } from '../hooks/useIsMobile';

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

const DRAG_VIEWPORT_MARGIN = 8;

export type MapLegendProps = {
  collapsed?: boolean;
  onToggle: () => void;
  colors?: typeof DEFAULT_COLORS;
  initialPosition?: { top?: number; right?: number; left?: number; bottom?: number };
  autoCollapseOnMobile?: boolean;
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

const MapLegend: React.FC<MapLegendProps> = ({ 
  collapsed, 
  onToggle, 
  colors = DEFAULT_COLORS, 
  initialPosition,
  autoCollapseOnMobile 
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
  const dragStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const isMobile = useIsMobile();

  // Insure legend stays within viewport on screen resize
  const clampToViewport = React.useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    const margin = 8; // margin from edges
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const maxX = Math.max(margin, window.innerWidth - w - margin);
    const maxY = Math.max(margin, window.innerHeight - h - margin);

    setPos((p) => ({
      x: Math.max(margin, Math.min(p.x, maxX)),
      y: Math.max(margin, Math.min(p.y, maxY))
    }));
  }, []);

  // Convert initial “right-based” x to absolute left after first render,
  // then clamp to viewport.
  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    if (pos.x < 0) {
      const margin = Math.abs(pos.x);
      const left = window.innerWidth - (node.offsetWidth + margin);
      setPos({ x: Math.max(8, left), y: pos.y });
    } else {
      clampToViewport();
    }
  }, []);

  React.useEffect(() => {
    if (isMobile && autoCollapseOnMobile) onToggle?.()
  }, [isMobile])

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStartRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    // avoid text selection with dragging
    document.body.style.userSelect = 'none';
  }

  const onMouseMove = React.useCallback((e: MouseEvent) => {
    if (!dragging || !dragStartRef.current) return;
    const nx = e.clientX - dragStartRef.current.x;
    const ny = e.clientY - dragStartRef.current.y;

    // Clamp to viewport while dragging
    const node = containerRef.current;
    const w = node?.offsetWidth ?? 0;
    const h = node?.offsetHeight ?? 0;
    const maxX = Math.max(DRAG_VIEWPORT_MARGIN, window.innerWidth - w - DRAG_VIEWPORT_MARGIN);
    const maxY = Math.max(DRAG_VIEWPORT_MARGIN, window.innerHeight - h - DRAG_VIEWPORT_MARGIN);

    const clampedX = Math.max(DRAG_VIEWPORT_MARGIN, Math.min(nx, maxX));
    const clampedY = Math.max(DRAG_VIEWPORT_MARGIN, Math.min(ny, maxY));

    setPos({ x: clampedX, y: clampedY });
  }, [dragging]);

  const onMouseUp = React.useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    dragStartRef.current = null;
    document.body.style.userSelect = '';
    clampToViewport();
  }, [dragging, clampToViewport]);

  React.useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // Clamp on window resize (e.g., user resizes or rotates)
  React.useEffect(() => {
    let raf = 0;
    const onResize = () => {
      // throttle with rAF
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(clampToViewport);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [clampToViewport]);

  // Clamp when the legend content size changes (collapse/expand, or content wraps)
  React.useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      // Use rAF to avoid layout thrash during rapid size changes
      requestAnimationFrame(clampToViewport);
    });
    ro.observe(node);

    return () => ro.disconnect();
  }, [clampToViewport]);

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
              size={isMobile ? 'middle' : 'small'}
              type="text"
              title="Drag"
              icon={<DragOutlined />}
              onMouseDown={onMouseDown}
              style={{ cursor: 'grab', padding: isMobile ? 6 : 0 }}
            />
            <Button
              size={isMobile ? 'middle' : 'small'}
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
