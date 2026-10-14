import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

export type ScreenModule =
  | 'Profile'
  | 'Learning Resource'
  | 'Assignment'
  | 'Test Module'
  | 'Events'
  | 'Notice'
  | 'Technical Query'
  | 'Change Password'
  | 'Dashboard';

class ScreenTimeTracker {
  private currentModule: ScreenModule | null = null;
  private enterTime: number | null = null;
  private toastCallback: ((msg: string) => void) | null = null;

  public setToastCallback(cb: (msg: string) => void) {
    this.toastCallback = cb;
  }

  public showToast(msg: string) {
    if (this.toastCallback) {
      this.toastCallback(msg);
    }
  }

  public onScreenEnter(moduleName: ScreenModule, traineeName: string = 'KUMARI K') {
    // If previous screen was active, record out time first
    if (this.currentModule && this.enterTime) {
      this.onScreenLeave(this.currentModule, traineeName);
    }

    this.currentModule = moduleName;
    this.enterTime = Date.now();

    // Trigger visual toast per manual screenshots
    if (moduleName === 'Profile') {
      this.showToast('Profile in time placed');
    } else if (moduleName === 'Learning Resource') {
      this.showToast('Learning Resource in time placed');
    } else if (moduleName === 'Assignment') {
      this.showToast('Assignment in time placed');
    } else if (moduleName === 'Events') {
      this.showToast('Event in time placed');
    } else if (moduleName === 'Test Module') {
      this.showToast('Status is ok');
    }
  }

  public onScreenLeave(moduleName: ScreenModule, traineeName: string = 'KUMARI K') {
    if (this.currentModule === moduleName && this.enterTime) {
      const durationSeconds = Math.max(1, Math.round((Date.now() - this.enterTime) / 1000));
      
      if (moduleName === 'Learning Resource') {
        this.showToast('Learning Resource out time placed');
      }

      // Record to backend analytics
      this.recordTelemetry({
        traineeId: 'T001',
        traineeName,
        module: moduleName,
        durationSeconds
      });

      this.currentModule = null;
      this.enterTime = null;
    }
  }

  private async recordTelemetry(payload: {
    traineeId: string;
    traineeName: string;
    module: string;
    durationSeconds: number;
  }) {
    try {
      await apiService.recordScreenTime(payload);
    } catch (err) {
      // Store locally in offline queue
      try {
        const queueStr = await AsyncStorage.getItem('@ysf_screentime_queue');
        const queue = queueStr ? JSON.parse(queueStr) : [];
        queue.push({ ...payload, timestamp: new Date().toISOString() });
        await AsyncStorage.setItem('@ysf_screentime_queue', JSON.stringify(queue));
      } catch (storageErr) {
        console.warn('Failed to queue offline telemetry', storageErr);
      }
    }
  }
}

export const screenTimeTracker = new ScreenTimeTracker();
