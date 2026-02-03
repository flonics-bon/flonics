// Example analytics module
export class AnalyticsModule {
  constructor() {
    console.log('Analytics module initialized');
  }

  public trackEvent(eventName: string, data: Record<string, any>): void {
    console.log(`Event tracked: ${eventName}`, data);
  }
}
