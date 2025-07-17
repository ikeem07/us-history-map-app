export type HistoricalEvent = {
  id: string;
  title: string;
  description: string;
  date: string; // ISO 8601 format, e.g. '1776-07-04'
  location: {
    city?: string;
    state?: string;
    latitude: number;
    longitude: number;
  };
  relatedEventIds: string[];
  tags?: string[];
  people?: string[];
};