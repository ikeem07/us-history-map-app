import React from 'react';
import { Slider, InputNumber, Typography } from 'antd';

const { Text } = Typography;

export type TimelinePanelProps = {
  year: number;
  min?: number;
  max?: number;
  onChange: (newYear: number) => void;
};

const TimelinePanel: React.FC<TimelinePanelProps> = ({ year, onChange, min = 1700, max = 2000 }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 1000,
        background: 'white',
        padding: '8px 12px',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        width: 'calc(100vw - 40px)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        height: 64
      }}
    >
      <Text strong>Timeline</Text>
      <InputNumber
        min={min}
        max={max}
        value={year}
        onChange={(value) => {
          if (typeof value === 'number') onChange(value);
        }}
        style={{ width: 100 }}
      />
      <Slider
        min={min}
        max={max}
        step={1}
        value={year}
        onChange={onChange}
        marks={{
          1700: '1700',
          1770: '1770',
          1780: '1780',
          1790: '1790',
          1800: '1800',
          1810: '1810',
          1820: '1820',
          1830: '1830',
          1840: '1840',
          1850: '1850',
          1860: '1860',
          1963: '1963',
          2000: '2000'
        }}
        style={{ flex: 1 }}
      />
    </div>
  );
};

export default TimelinePanel;
