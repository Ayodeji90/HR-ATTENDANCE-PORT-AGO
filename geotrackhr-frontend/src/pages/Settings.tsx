import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

/**
 * There is no backend settings endpoint yet (out of scope for this pass).
 * Previously this page silently POSTed to a nonexistent /settings route
 * and told the user "Settings saved" regardless — replaced with an honest
 * not-yet-available state instead of a false success message.
 */
const Settings: React.FC = () => {
  return (
    <div>
      <h1 className="mb-4">System Settings</h1>
      <EmptyState
        icon={<SettingsIcon size={36} className="text-ink-300" />}
        title="System settings aren't available yet"
        description="This screen will let admins configure notification and system preferences once the backend supports it."
      />
    </div>
  );
};

export default Settings;
