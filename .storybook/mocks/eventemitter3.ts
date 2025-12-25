// Mock EventEmitter for Storybook builds
// Resolves ESM/CJS interop issues with eventemitter3

type Listener = (...args: unknown[]) => void;

export class EventEmitter<EventTypes extends string = string> {
  private events: Record<string, Listener[]> = {};

  on(event: EventTypes, fn: Listener): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(fn);
    return this;
  }

  off(event: EventTypes, fn: Listener): this {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(f => f !== fn);
    }
    return this;
  }

  emit(event: EventTypes, ...args: unknown[]): boolean {
    if (this.events[event]) {
      this.events[event].forEach(fn => fn(...args));
      return true;
    }
    return false;
  }

  once(event: EventTypes, fn: Listener): this {
    const onceFn = (...args: unknown[]) => {
      this.off(event, onceFn as Listener);
      fn(...args);
    };
    return this.on(event, onceFn as Listener);
  }

  addListener(event: EventTypes, fn: Listener): this {
    return this.on(event, fn);
  }

  removeListener(event: EventTypes, fn: Listener): this {
    return this.off(event, fn);
  }

  removeAllListeners(event?: EventTypes): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  listeners(event: EventTypes): Listener[] {
    return this.events[event] || [];
  }

  listenerCount(event: EventTypes): number {
    return (this.events[event] || []).length;
  }

  eventNames(): EventTypes[] {
    return Object.keys(this.events) as EventTypes[];
  }
}

export default EventEmitter;
