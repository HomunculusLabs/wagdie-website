/**
 * Performance monitoring utility for migration framework
 */

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  recordsProcessed: number;
  recordsPerSecond: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

export interface PerformanceThresholds {
  maxMemoryMB: number;
  minRecordsPerSecond: number;
  maxDurationMinutes: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(thresholds: PerformanceThresholds = {
    maxMemoryMB: 100,
    minRecordsPerSecond: 100,
    maxDurationMinutes: 30
  }) {
    this.thresholds = thresholds;
    this.metrics = {
      startTime: Date.now(),
      recordsProcessed: 0,
      recordsPerSecond: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.metrics.startTime = Date.now();

    // Monitor performance every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkThresholds();
    }, 5000);

    console.log('🔍 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): PerformanceMetrics {
    if (!this.isMonitoring) {
      return this.metrics;
    }

    this.isMonitoring = false;
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log(`🏁 Performance monitoring stopped: ${this.formatDuration(this.metrics.duration)}`);
    return this.metrics;
  }

  /**
   * Update performance metrics
   */
  updateMetrics(recordsProcessed: number = 0): void {
    this.metrics.recordsProcessed = recordsProcessed;
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.cpuUsage = process.cpuUsage(this.metrics.cpuUsage);

    if (this.metrics.startTime) {
      const elapsedMs = Date.now() - this.metrics.startTime;
      const elapsedSeconds = elapsedMs / 1000;
      this.metrics.recordsPerSecond = elapsedSeconds > 0 ? recordsProcessed / elapsedSeconds : 0;
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    this.updateMetrics(this.metrics.recordsProcessed);
    return { ...this.metrics };
  }

  /**
   * Check if performance thresholds are exceeded
   */
  checkThresholds(): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    // Check memory usage
    const memoryUsageMB = this.metrics.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > this.thresholds.maxMemoryMB) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `Memory usage (${memoryUsageMB.toFixed(1)}MB) exceeds threshold (${this.thresholds.maxMemoryMB}MB)`,
        value: memoryUsageMB,
        threshold: this.thresholds.maxMemoryMB
      });
    }

    // Check processing speed
    if (this.metrics.recordsPerSecond < this.thresholds.minRecordsPerSecond && this.metrics.recordsProcessed > 0) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `Processing speed (${this.metrics.recordsPerSecond.toFixed(1)} rec/s) below threshold (${this.thresholds.minRecordsPerSecond} rec/s)`,
        value: this.metrics.recordsPerSecond,
        threshold: this.thresholds.minRecordsPerSecond
      });
    }

    // Check duration
    if (this.metrics.startTime) {
      const elapsedMinutes = (Date.now() - this.metrics.startTime) / 1000 / 60;
      if (elapsedMinutes > this.thresholds.maxDurationMinutes) {
        alerts.push({
          type: 'duration',
          severity: 'error',
          message: `Migration duration (${elapsedMinutes.toFixed(1)}min) exceeds maximum (${this.thresholds.maxDurationMinutes}min)`,
          value: elapsedMinutes,
          threshold: this.thresholds.maxDurationMinutes
        });
      }
    }

    // Log alerts
    alerts.forEach(alert => {
      const level = alert.severity === 'error' ? 'error' : 'warn';
      console[level](`⚠️  Performance alert: ${alert.message}`);
    });

    return alerts;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): PerformanceSummary {
    const memoryUsageMB = this.metrics.memoryUsage.heapUsed / 1024 / 1024;
    const memoryTotalMB = this.metrics.memoryUsage.heapTotal / 1024 / 1024;
    const duration = this.metrics.duration || (Date.now() - this.metrics.startTime);

    return {
      duration: this.formatDuration(duration),
      recordsProcessed: this.metrics.recordsProcessed,
      recordsPerSecond: Math.round(this.metrics.recordsPerSecond),
      memoryUsage: `${memoryUsageMB.toFixed(1)}MB`,
      memoryUtilization: `${((memoryUsageMB / memoryTotalMB) * 100).toFixed(1)}%`,
      alerts: this.checkThresholds()
    };
  }

  /**
   * Log current performance status
   */
  logPerformanceStatus(): void {
    const summary = this.getPerformanceSummary();
    const status = summary.alerts.length === 0 ? '✅' : '⚠️';

    console.log(`${status} Performance Status:`);
    console.log(`   Duration: ${summary.duration}`);
    console.log(`   Records: ${summary.recordsProcessed} (${summary.recordsPerSecond} rec/s)`);
    console.log(`   Memory: ${summary.memoryUsage} (${summary.memoryUtilization})`);

    if (summary.alerts.length > 0) {
      console.log(`   Alerts: ${summary.alerts.length} performance issues detected`);
    }
  }

  /**
   * Create performance benchmark report
   */
  createBenchmarkReport(): BenchmarkReport {
    const summary = this.getPerformanceSummary();
    const efficiency = this.calculateEfficiency();

    return {
      summary,
      efficiency,
      recommendations: this.generateRecommendations(),
      grade: this.calculateGrade(efficiency)
    };
  }

  private updateMetrics(): void {
    this.metrics.memoryUsage = process.memoryUsage();

    if (this.metrics.startTime && this.metrics.recordsProcessed > 0) {
      const elapsedMs = Date.now() - this.metrics.startTime;
      const elapsedSeconds = elapsedMs / 1000;
      this.metrics.recordsPerSecond = this.metrics.recordsProcessed / elapsedSeconds;
    }
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private calculateEfficiency(): PerformanceEfficiency {
    const speedScore = Math.min(100, (this.metrics.recordsPerSecond / this.thresholds.minRecordsPerSecond) * 100);
    const memoryUsageMB = this.metrics.memoryUsage.heapUsed / 1024 / 1024;
    const memoryScore = Math.max(0, 100 - (memoryUsageMB / this.thresholds.maxMemoryMB) * 100);

    const alerts = this.checkThresholds();
    const stabilityScore = Math.max(0, 100 - (alerts.length * 10));

    return {
      speed: Math.round(speedScore),
      memory: Math.round(memoryScore),
      stability: Math.round(stabilityScore),
      overall: Math.round((speedScore + memoryScore + stabilityScore) / 3)
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const efficiency = this.calculateEfficiency();

    if (efficiency.speed < 70) {
      recommendations.push('Consider increasing batch size or parallel processing');
    }

    if (efficiency.memory < 70) {
      recommendations.push('Consider processing smaller batches to reduce memory usage');
    }

    if (efficiency.stability < 70) {
      recommendations.push('Review error handling and data validation rules');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal');
    }

    return recommendations;
  }

  private calculateGrade(efficiency: PerformanceEfficiency): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (efficiency.overall >= 90) return 'A';
    if (efficiency.overall >= 80) return 'B';
    if (efficiency.overall >= 70) return 'C';
    if (efficiency.overall >= 60) return 'D';
    return 'F';
  }
}

// Supporting interfaces
export interface PerformanceAlert {
  type: 'memory' | 'performance' | 'duration';
  severity: 'warning' | 'error';
  message: string;
  value: number;
  threshold: number;
}

export interface PerformanceSummary {
  duration: string;
  recordsProcessed: number;
  recordsPerSecond: number;
  memoryUsage: string;
  memoryUtilization: string;
  alerts: PerformanceAlert[];
}

export interface PerformanceEfficiency {
  speed: number;
  memory: number;
  stability: number;
  overall: number;
}

export interface BenchmarkReport {
  summary: PerformanceSummary;
  efficiency: PerformanceEfficiency;
  recommendations: string[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// Default performance monitor instance
export const performanceMonitor = new PerformanceMonitor();