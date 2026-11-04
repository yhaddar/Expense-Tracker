import { AppShell } from '../components/app-shell';
import { SettingsPage } from '../components/app-pages';

export default function SettingsRoute() {
  return (
    <AppShell>
      <SettingsPage />
    </AppShell>
  );
}
