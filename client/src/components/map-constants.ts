// Shared style & cluster constants

// Event dot colors
export const COLOR_EVENT_PRIMARY = '#f5222d';
export const COLOR_EVENT_RELATED = '#1677ff';
export const COLOR_EVENT_DEFAULT = '#666666';

// Connection line + label color
export const COLOR_LINE = '#333333';
export const COLOR_LINE_HOVER_TARGET = '#000000';
export const COLOR_LABEL = 'rgba(12, 107, 3, 1)';

// Cluster bubble ramp (low → mid → high)
export const COLOR_CLUSTER_LOW = '#9ecae1';
export const COLOR_CLUSTER_MID = '#6baed6';
export const COLOR_CLUSTER_HIGH = '#3182bd';

// Cluster thresholds (breakpoints for point_count)
export const CLUSTER_STEP_1 = 10;
export const CLUSTER_STEP_2 = 25;

// Cluster circle radii for each step
export const RADIUS_SMALL = 16;
export const RADIUS_MED = 20;
export const RADIUS_LARGE = 26;

// Cluster engine tuning
export const CLUSTER_RADIUS = 70;   // px
export const CLUSTER_MAX_ZOOM = 13; // stop clustering beyond this zoom

// Coordinate rounding to merge near-duplicates (≈ 1.1m at equator)
export const GROUP_PRECISION = 5;
export const roundCoord = (n: number, p = GROUP_PRECISION) => {
  const k = Math.pow(10, p);
  return Math.round(n * k) / k;
};
