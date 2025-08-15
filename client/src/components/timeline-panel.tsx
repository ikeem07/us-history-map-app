import React, { useState, useEffect, useRef } from 'react';
import { Slider, InputNumber, Typography, Button, Drawer, Space } from 'antd';

const { Text } = Typography;

export type TimelinePanelProps = {
  year: number | null;
  min?: number;
  max?: number;
  onChange: (newYear: number | null) => void;
  variant?: 'inline' | 'drawer';
  open?: boolean;       // used when variant === 'drawer'
  onClose?: () => void; // used when variant === 'drawer'
  heightVh?: number;    // bottom sheet height (viewport %)
};

const TimelinePanel: React.FC<TimelinePanelProps> = ({ 
  year, 
  onChange, 
  min = 1700, 
  max = 2000,
  variant = 'inline',
  open = false,
  onClose,
  heightVh = 42 
}) => {
  const visibleRange = 150;
  const [windowStart, setWindowStart] = useState(min);
  const windowEnd = Math.min(windowStart + visibleRange, max);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackYear, setPlaybackYear] = useState<number | null>(null);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shiftWindow = (direction: 'left' | 'right') => {
    const shiftAmount = 25;
    if (direction === 'left') {
      setWindowStart((prev) => Math.max(min, prev - shiftAmount));
    } else {
      setWindowStart((prev) => Math.min(max - visibleRange, prev + shiftAmount));
    }
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  useEffect(() => {
    if (isPlaying) {
      playRef.current = setInterval(() => {
        setPlaybackYear((prev) => {
          const current = prev ?? year ?? windowStart;
          const next = current + 1;
          if (next > windowEnd) {
            setIsPlaying(false);
            return current;
          } else {
            onChange(next);
            return next;
          }
        });
      }, 1000);
    } else if (playRef.current) {
      clearInterval(playRef.current);
      playRef.current = null;
    }
    return () => {
      if (playRef.current) {
        clearInterval(playRef.current)
        playRef.current = null;
      };
    };
  }, [isPlaying, windowStart, windowEnd, year, onChange]);

  useEffect(() => {
    if (year !== null && (year < windowStart || year > windowEnd)) {
      const newStart = Math.max(min, Math.min(year, max - visibleRange));
      setWindowStart(newStart);
    }
  }, [year, windowStart, windowEnd, min, max]);

  // Marks: every-10-years for inline;
  // use sparser marks in drawer for readability on phones.
  const makeMarks = (dense: boolean) => {
    const marks: Record<number, string> = {};
    const step = dense ? 10 : 25;
    for (let y = windowStart; y <= windowEnd; y += step) marks[y] = `${y}`;
    marks[windowStart] = `${windowStart}`;
    marks[windowEnd] = `${windowEnd}`;
    return marks;
  }

  const Controls = (
    <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
      <Space align="center" wrap>
        <Text strong>Year:</Text>
        <InputNumber
          min={min}
          max={max}
          value={year ?? undefined}
          onChange={(value) => {
            if (typeof value === 'number') {
              setPlaybackYear(null);
              onChange(value);
            }
          }}
          style={{ width: 100 }}
          size={variant === 'drawer' ? 'large' : 'middle'}
        />
        <Button onClick={() => shiftWindow('left')} size={variant === 'drawer' ? 'large' : 'middle'}>
          {'←'}
        </Button>
        <Button onClick={() => shiftWindow('right')} size={variant === 'drawer' ? 'large' : 'middle'}>
          {'→'}
        </Button>
      </Space>

      <Space>
        <Button
          onClick={() => {
            setIsPlaying(false);
            onChange(null);
          }}
          size={variant === 'drawer' ? 'large' : 'middle'}
        >
          Clear
        </Button>
        <Button onClick={togglePlay} type="primary" size={variant === 'drawer' ? 'large' : 'middle'}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
      </Space>
    </Space>
  );

  const SliderEl = (
    <Slider
      min={windowStart}
      max={windowEnd}
      step={1}
      value={year ?? windowStart}
      onChange={(value) => {
        setPlaybackYear(null);
        onChange(value as number);
      }}
      marks={variant === 'drawer' ? makeMarks(false) : makeMarks(true)}
      style={{ flex: 1 }}
      tooltip={{ open: false }}
      // slightly larger hit targets in drawer
      styles={
        variant === 'drawer'
          ? { handle: { width: 20, height: 20, marginTop: -8 }, rail: { height: 6 }, track: { height: 6 } }
          : undefined
      }
    />
  );

  const body = (
    <div style={{ padding: 12 }}>
      {Controls}
      {SliderEl}
    </div>
  );

  if (variant === 'drawer') {
    // Mobile bottom sheet
    return (
      <Drawer
        placement="bottom"
        open={open}
        onClose={onClose}
        height={`${heightVh}vh`}
        title="Timeline"
        getContainer={false}               // render inside page to avoid z-index surprises
        maskStyle={{ background: 'rgba(0,0,0,.2)' }}
        styles={{ header: { padding: '8px 12px' }, body: { padding: 0 } }}
      >
        {body}
      </Drawer>
    );
  }

  // Desktop inline bar
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
        flexDirection: 'column',
        gap: 8
      }}
    >
      {Controls}
      {SliderEl}
    </div>
  );
};

export default TimelinePanel;
