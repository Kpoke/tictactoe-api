/**
 * Timer utility for game time management
 * Uses a single interval to avoid memory leaks
 */
export class Timer {
  private time: number;
  private intervalId: NodeJS.Timeout | null = null;
  private isPaused: boolean = true;
  private readonly initialTime: number;

  constructor(seconds: number) {
    this.initialTime = seconds;
    this.time = seconds;
  }

  getTime(): number {
    return this.time;
  }

  setTime(newTime: number): void {
    this.time = newTime;
  }

  start(): void {
    if (this.isPaused && this.time > 0) {
      this.isPaused = false;
      this.intervalId = setInterval(() => {
        if (this.time > 0 && !this.isPaused) {
          this.time--;
        } else {
          this.pause();
        }
      }, 1000);
    }
  }

  pause(): void {
    this.isPaused = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset(): void {
    this.pause();
    this.time = this.initialTime;
  }

  destroy(): void {
    this.pause();
  }
}
