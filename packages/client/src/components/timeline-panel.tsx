import React, { useState, useEffect, useRef } from 'react';
import { Slider, InputNumber, Typography, Button } from 'antd';

const { Text } = Typography;

export type TimelinePanelProps = {
  year: number | null;
  min?: number;
  max?: number;
  onChange: (newYear: number | null) => void;
};

const TimelinePanel: React.FC<TimelinePanelProps> = ({ year, onChange, min = 1700, max = 2000 }) => {
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
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, [isPlaying, windowStart, windowEnd, year, onChange]);

  useEffect(() => {
    if (year !== null && (year < windowStart || year > windowEnd)) {
      const newStart = Math.max(min, Math.min(year, max - visibleRange));
      setWindowStart(newStart);
    }
  }, [year, windowStart, windowEnd, min, max]);

  // Generate dynamic marks for visible range
  const marks: Record<number, string> = {};
  for (let y = windowStart; y <= windowEnd; y += 10) {
    marks[y] = `${y}`;
  }

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
      <Button onClick={() => shiftWindow('left')}>{'←'}</Button>
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
      />
      <Slider
        min={windowStart}
        max={windowEnd}
        step={1}
        value={year ?? windowStart}
        onChange={(value) => {
          setPlaybackYear(null);
          onChange(value);
        }}
        marks={marks}
        style={{ flex: 1 }}
      />
      <Button onClick={() => shiftWindow('right')}>{'→'}</Button>
      <Button onClick={() => {
        setIsPlaying(false);
        onChange(null);
      }}>Clear</Button>
      <Button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</Button>
    </div>
  );
};

export default TimelinePanel;
