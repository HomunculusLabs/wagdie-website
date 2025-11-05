/**
 * Event Repository - Handles burn, death, and fight event markers
 * In production, this would fetch from Supabase or another data source
 * Currently returns mock data for demonstration
 */

import type { EventMarker } from '@/lib/types/map';
import { mockBurnEvents, mockDeathEvents, mockFightEvents } from '@/lib/data/mockEvents';

export class EventRepository {
  private static instance: EventRepository;

  private constructor() {}

  public static getInstance(): EventRepository {
    if (!EventRepository.instance) {
      EventRepository.instance = new EventRepository();
    }
    return EventRepository.instance;
  }

  /**
   * Get all burn events
   * @returns Promise<EventMarker[]> - Array of burn events
   */
  async getBurnEvents(): Promise<EventMarker[]> {
    try {
      // In production, this would fetch from Supabase
      // For now, return mock data
      return mockBurnEvents;
    } catch (error) {
      console.error('EventRepository.getBurnEvents() error:', error);
      return [];
    }
  }

  /**
   * Get all death events
   * @returns Promise<EventMarker[]> - Array of death events
   */
  async getDeathEvents(): Promise<EventMarker[]> {
    try {
      // In production, this would fetch from Supabase
      // For now, return mock data
      return mockDeathEvents;
    } catch (error) {
      console.error('EventRepository.getDeathEvents() error:', error);
      return [];
    }
  }

  /**
   * Get all fight events
   * @returns Promise<EventMarker[]> - Array of fight events
   */
  async getFightEvents(): Promise<EventMarker[]> {
    try {
      // In production, this would fetch from Supabase
      // For now, return mock data
      return mockFightEvents;
    } catch (error) {
      console.error('EventRepository.getFightEvents() error:', error);
      return [];
    }
  }

  /**
   * Get all events of a specific type
   * @param type - Type of event ('burn' | 'death' | 'fight')
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
   * Get all events across all types
   * @returns Promise<EventMarker[]> - Array of all events
   */
  async getAllEvents(): Promise<EventMarker[]> {
    try {
      const [burns, deaths, fights] = await Promise.all([
        this.getBurnEvents(),
        this.getDeathEvents(),
        this.getFightEvents(),
      ]);

      return [...burns, ...deaths, ...fights];
    } catch (error) {
      console.error('EventRepository.getAllEvents() error:', error);
      return [];
    }
  }
}

export const eventRepository = EventRepository.getInstance();
