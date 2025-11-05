/**
 * useEventMarkers Hook - Fetches and manages event marker data
 * Handles loading states and error handling for burn, death, and fight events
 */

import { useState, useEffect, useMemo } from 'react';
import { eventService } from '@/lib/services/eventService';
import type { EventMarker } from '@/lib/types/map';

interface EventMarkerData {
  burns: EventMarker[];
  deaths: EventMarker[];
  fights: EventMarker[];
}

interface UseEventMarkersResult {
  eventMarkers: EventMarkerData;
  loading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
}

/**
 * Custom hook to fetch event markers data
 * @returns UseEventMarkersResult - Object containing event data, loading state, and error
 */
export function useEventMarkers(): UseEventMarkersResult {
  const [eventMarkers, setEventMarkers] = useState<EventMarkerData>({
    burns: [],
    deaths: [],
    fights: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const [burns, deaths, fights] = await Promise.all([
        eventService.getBurnEvents(),
        eventService.getDeathEvents(),
        eventService.getFightEvents(),
      ]);

      setEventMarkers({
        burns,
        deaths,
        fights,
      });
    } catch (err) {
      console.error('useEventMarkers: Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const refreshEvents = async () => {
    // Clear cache before refreshing
    eventService.clearCache();
    await fetchEvents();
  };

  return {
    eventMarkers,
    loading,
    error,
    refreshEvents,
  };
}

/**
 * Custom hook to fetch a specific type of event markers
 * @param type - Type of event ('burn' | 'death' | 'fight')
 * @returns EventMarker[] - Array of events for the specified type
 */
export function useEventMarkersByType(type: 'burn' | 'death' | 'fight') {
  const { eventMarkers, loading, error } = useEventMarkers();

  const markers = useMemo(() => {
    switch (type) {
      case 'burn':
        return eventMarkers.burns;
      case 'death':
        return eventMarkers.deaths;
      case 'fight':
        return eventMarkers.fights;
      default:
        return [];
    }
  }, [eventMarkers, type]);

  return {
    markers,
    loading,
    error,
  };
}
