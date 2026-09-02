import { JobSource } from './job-source.interface.js';

export class JobSourceRegistry {
  private readonly sources: JobSource[] = [];

  register(source: JobSource): void {
    this.sources.push(source);
  }

  getSources(): JobSource[] {
    return [...this.sources];
  }
}
