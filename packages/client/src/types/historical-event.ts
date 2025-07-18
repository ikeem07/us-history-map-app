export type RelatedEvent = {
  id: string;
  reason: string; // Explanation of how this event is related to the main event
}

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
  relatedEvents: RelatedEvent[]; // Array of related events with reasons
  tags?: string[];
  people?: string[];
};