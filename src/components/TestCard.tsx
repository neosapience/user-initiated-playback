import type { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  children: ReactNode;
}

export function TestCard({ title, description, children }: Props) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ fontSize: 16, marginBottom: 4 }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>{description}</p>
      {children}
    </div>
  );
}
