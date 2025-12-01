/**
 * Performance Monitoring Utility
 *
 * Tracks render performance, frame rates, and other metrics to ensure
 * the map maintains 60fps with 50+ markers.
 */

export interface PerformanceMetrics {
  renderTime: number;
  fps: number;
  markerCount: number;
  timestamp: number;
}

export interface PerformanceThresholds {
  maxRenderTime: number; // ms
  minFps: number;
  maxMarkerCount: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxRenderTime: 16.67, // 60fps = 16.67ms per frame
  minFps: 60,
  maxMarkerCount: 50,
};

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private frameCount = 0;
  private lastFrameTime = performance.now();

  constructor(thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * Measure component render time
   */
  startMeasure(): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      this.recordRenderTime(renderTime);
    };
  }

  /**
   * Record render time for a component
   */
  private recordRenderTime(renderTime: number): void {
    const fps = 1000 / renderTime;
    const currentTime = performance.now();

    this.metrics.push({
      renderTime,
      fps,
      markerCount: this.getCurrentMarkerCount(),
      timestamp: currentTime,
    });

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Check if performance is below threshold
    if (renderTime > this.thresholds.maxRenderTime) {
      console.warn(
        `[Performance] Slow render detected: ${renderTime.toFixed(2)}ms (threshold: ${this.thresholds.maxRenderTime}ms)`
      );
    }
  }

  /**
   * Track frame rate (call on each frame)
   */
  trackFrame(): void {
    this.frameCount++;
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    if (deltaTime >= 1000) {
      const fps = (this.frameCount * 1000) / deltaTime;

      if (fps < this.thresholds.minFps) {
        console.warn(
          `[Performance] Low FPS detected: ${fps.toFixed(1)}fps (threshold: ${this.thresholds.minFps}fps)`
        );
      }

      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    if (this.metrics.length === 0) return 60;

    const latest = this.metrics[this.metrics.length - 1];
    return latest.fps;
  }

  /**
   * Get average render time over last N measurements
   */
  getAverageRenderTime(count: number = 10): number {
    if (this.metrics.length === 0) return 0;

    const recent = this.metrics.slice(-count);
    const sum = recent.reduce((acc, m) => acc + m.renderTime, 0);
    return sum / recent.length;
  }

  /**
   * Get performance report
   */
  getReport(): {
    currentFps: number;
    averageRenderTime: number;
    markerCount: number;
    isHealthy: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    const currentFps = this.getCurrentFPS();
    const averageRenderTime = this.getAverageRenderTime();
    const markerCount = this.getCurrentMarkerCount();

    if (currentFps < this.thresholds.minFps) {
      violations.push(`FPS below threshold: ${currentFps.toFixed(1)}fps < ${this.thresholds.minFps}fps`);
    }

    if (averageRenderTime > this.thresholds.maxRenderTime) {
      violations.push(
        `Render time above threshold: ${averageRenderTime.toFixed(2)}ms > ${this.thresholds.maxRenderTime}ms`
      );
    }

    if (markerCount > this.thresholds.maxMarkerCount) {
      console.log(
        `[Performance] High marker count: ${markerCount} (threshold: ${this.thresholds.maxMarkerCount})`
      );
    }

    return {
      currentFps,
      averageRenderTime,
      markerCount,
      isHealthy: violations.length === 0,
      violations,
    };
  }

  /**
   * Get current marker count (placeholder - would be set by components)
   */
  private getCurrentMarkerCount(): number {
    // In a real implementation, this would track the actual marker count
    // For now, return a placeholder
    return 0;
  }

  /**
   * Set current marker count
   */
  setMarkerCount(count: number): void {
    // This would update an internal state
    // For now, we just log it
    if (count > this.thresholds.maxMarkerCount) {
      console.log(`[Performance] Rendering ${count} markers`);
    }
  }

  /**
   * Clear all metrics
   */
  reset(): void {
    this.metrics = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Singleton instance for global monitoring
let globalMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
};

export default PerformanceMonitor;
