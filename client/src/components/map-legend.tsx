import React from 'react';
import { Card, Typography, Space } from 'antd';

const { Text } = Typography;

/** Keep in sync with map layer colors */
const COLORS = {
  cluster: '#3399ff',
  selected: '#ff4d4f',
  related: '#1890ff',
  default: '#999999',
  line: '#333333',
  label: 'rgba(12, 107, 3, 1)' // connection line label color
};

type MapLegendProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

const Dot: React.FC<{ color: string; size?: number; border?: string }> = ({ color, size = 10, border = '#fff' }) => (
  <span
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: color,
      border: `2px solid ${border}`,
      marginRight: 8
    }}
    aria-hidden
  />
);

const LineSwitch: React.FC<{ color: string }> = ({ color }) => (
  <span
    style={{
      display: 'inline-block',
      width: 28,
      height: 0,
      borderTop: `3px solid ${color}`,
      marginRight: 8,
      transform: 'translateY(-2px)'
    }}
    aria-hidden
  />
);

const MapLegend: React.FC<MapLegendProps> = ({ collapsed = false, onToggle }) => {
  return (
    <div
      role="region"
      aria-label='Map Legend'
      style={{
        position: 'absolute',
        right: 20,
        top: 20,
        zIndex: 1100,
        maxWidth: 280
      }}
    >
      <Card
        size='small'
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text strong style={{ marginRight: 4 }}>Legend</Text>
            <button
              type='button'
              onClick={onToggle}
              aria-expanded={!collapsed}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                margin: 4,
                fontSize: 12
              }}
              title={collapsed ? 'Expand legend' : 'Collapse legend'}
            >
              {collapsed ? 'Show' : 'Hide'}
            </button>
          </div>
        }
        styles={{
          body: { padding: collapsed ? 8 : 12 }
        }}
      >
        {!collapsed && (
          <Space direction='vertical' size={8} style={{ width: '100%' }}>
            <div>
              <Dot color={COLORS.cluster} />
              <Text>Cluster (number shows total events)</Text>
            </div>
            <div>
              <Dot color={COLORS.selected} />
              <Text>Selected svent</Text>
            </div>
            <div>
              <Dot color={COLORS.related} />
              <Text>Related event</Text>
            </div>
            <div>
              <Dot color={COLORS.default} />
              <Text>Event</Text>
            </div>
            <div>
              <LineSwitch color={COLORS.line} />
              <Text>Connection line</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  display: 'inline-block',
                  minWidth: 28,
                  marginRight: 8,
                  height: 14,
                  lineHeight: '14px',
                  color: COLORS.label,
                  border: '1px dashed #d9d9d9',
                  textAlign: 'center',
                  fontSize: 10,
                }}
                aria-hidden
              >
                Label
              </span>
              <Text>Connection label</Text>
            </div>
          </Space>
        )}
      </Card>
    </div>
  );
};

export default MapLegend;
