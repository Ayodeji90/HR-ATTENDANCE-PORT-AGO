import React from 'react';
import { ScrollText } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

/**
 * The audit_logs table exists in the schema, but no backend module reads or
 * writes it yet (out of scope for this pass). Rather than call a 404
 * endpoint and silently show an empty table, this page says so honestly.
 */
const AuditLogs: React.FC = () => {
  return (
    <div>
      <h1 className="mb-4">Audit Logs</h1>
      <EmptyState
        icon={<ScrollText size={36} className="text-ink-300" />}
        title="Audit log viewer isn't available yet"
        description="The audit trail is being tracked in the database, but the viewer hasn't been built yet."
      />
    </div>
  );
};

export default AuditLogs;
