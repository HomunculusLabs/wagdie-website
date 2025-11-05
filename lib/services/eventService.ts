/**
 * Event Service - Business logic for event markers
 * Provides caching and error handling for event data
 */

import { eventRepository } from '@/lib/repositories/eventRepository';
import type { EventMarker } from '@/lib/types/map';

export class EventService {
  private static instance: EventService;
  private cache: Map<string, { data: EventMarker[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  /**
   * Get all burn events with caching
   * @returns Promise<EventMarker[]> - Array of burn events
   */
  async getBurnEvents(): Promise<EventMarker[]> {
    const cacheKey = 'burn-events';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const data = await eventRepository.getBurnEvents();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('EventService.getBurnEvents() error:', error);
      return [];
    }
  }

  /**
   * Get all death events with caching
   * @returns Promise<EventMarker[]> - Array of death events
   */
  async getDeathEvents(): Promise<EventMarker[]> {
    const cacheKey = 'death-events';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const data = await eventRepository.getDeathEvents();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('EventService.getDeathEvents() error:', error);
      return [];
    }
  }

  /**
   * Get all fight events with caching
   * @returns Promise<EventMarker[]> - Array of fight events
   */
  async getFightEvents(): Promise<EventMarker[]> {
    const cacheKey = 'fight-events';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const data = await eventRepository.getFightEvents();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('EventService.getFightEvents() error:', error);
      return [];
    }
  }

  /**
   * Get all events of a specific type
   * @param type - Type of event
   * @returns Promise<EventMarker[]> - Array of events
   */
  async getEventsByType(type: 'burn' | 'death' | 'fight'): Promise<EventMarker[]> {
    switch (type) {
      case 'burn':
        return this.getBurnEvents();
      case 'death':
        return this.getDeathEvents();
      case 'fight':
        return this.getFightEvents();
      default:
        return [];
    }
  }

  /**
   * Clear cache for all event types
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for a specific event type
   * @param type - Type of event
   */
  clearCacheForType(type: 'burn' | 'death' | 'fight'): void {
    const cacheKey = `${type}-events`;
    this.cache.delete(cacheKey);
  }
}

export const eventService = EventService.getInstance();
