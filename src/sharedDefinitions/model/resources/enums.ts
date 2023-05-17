export const JobStatus = {
  Waiting: 'Waiting',
  Ready: 'Ready',
  Starting: 'Starting',
  Running: 'Running',
  Completed: 'Completed',
  Failed: 'Failed',
  Disposed: 'Disposed',
  Missing: 'Missing',
} as const
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus]

export const JobPriority = {
  VeryHigh: 5,
  High: 4,
  Middle: 3,
  Low: 2,
  VeryLow: 1,
} as const
export type JobPriority = (typeof JobPriority)[keyof typeof JobPriority]
