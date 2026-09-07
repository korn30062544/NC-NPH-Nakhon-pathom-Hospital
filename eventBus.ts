import { GlobalSyncEvent } from '../types';

type EventListener = (event: GlobalSyncEvent) => void;

class GlobalEventBus {
  private listeners: EventListener[] = [];
  private history: GlobalSyncEvent[] = [];
  private maxHistory: number = 20;

  public subscribe(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public emit(
    type: GlobalSyncEvent['type'],
    message: string,
    affectedRooms: string[],
    recalculatedStats: GlobalSyncEvent['recalculatedStats']
  ): GlobalSyncEvent {
    const event: GlobalSyncEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message,
      affectedRooms,
      recalculatedStats,
    };

    this.history.unshift(event);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    // Notify all subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in EventBus listener:', err);
      }
    });

    return event;
  }

  public getHistory(): GlobalSyncEvent[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
  }
}

export const globalEventBus = new GlobalEventBus();
