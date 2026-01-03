export type TestStatus = 'pending' | 'running' | 'success' | 'failed' | 'error';

export interface TestResult {
  id: string;
  name: string;
  status: TestStatus;
  error?: string;
}
