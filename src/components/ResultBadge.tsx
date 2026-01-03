import type { TestStatus } from '../types/autoplay';

const statusConfig: Record<TestStatus, { color: string; text: string }> = {
  pending: { color: '#6b7280', text: '대기' },
  running: { color: '#3b82f6', text: '실행 중...' },
  success: { color: '#10b981', text: '재생됨' },
  failed: { color: '#ef4444', text: '차단됨' },
  error: { color: '#f59e0b', text: '오류' },
};

interface Props {
  status: TestStatus;
  error?: string | null;
}

export function ResultBadge({ status, error }: Props) {
  const config = statusConfig[status];

  return (
    <div style={{ marginTop: 8 }}>
      <span
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: 4,
          backgroundColor: config.color,
          color: 'white',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {config.text}
      </span>
      {error && status === 'error' && (
        <p style={{ marginTop: 4, fontSize: 12, color: '#666' }}>{error}</p>
      )}
    </div>
  );
}
