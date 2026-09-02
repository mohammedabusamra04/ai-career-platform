import { Job, JobSearchQuery, JobSourceType } from '../job.types.js';

export interface JobSource {
  type: JobSourceType;

  fetchJobs(query: JobSearchQuery): Promise<Job[]>;
}
