'use client';

import { useState } from 'react';
import { useOrg } from '@/lib/acmi/acmi-context';
import { AcmiEntitySearch } from '@/components/acmi/AcmiEntitySearch';

export default function SettingsPage() {
  const { activeOrg } = useOrg();
  const [config, setConfig] = useState({ url: '', token: '', tenantPrefix: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!activeOrg) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/db/organizations/${activeOrg.slug}/acmi-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upstash_url: config.url,
          upstash_token: config.token,
          tenant_prefix: config.tenantPrefix || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save: ${res.status}`);
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {activeOrg && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          Active org: <strong>{activeOrg.name}</strong> (slug: {activeOrg.slug})
        </div>
      )}

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">ACMI Connection</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Upstash Redis URL</label>
            <input
              type="text"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="https://us1-xxxx-xxxx.upstash.io"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Redis Token</label>
            <input
              type="password"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Your Upstash Redis REST token"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tenant Prefix (optional)</label>
            <input
              type="text"
              value={config.tenantPrefix}
              onChange={(e) => setConfig({ ...config, tenantPrefix: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g. client:acme-corp"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !config.url || !config.token || !activeOrg}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          {saved && <p className="text-sm text-green-600">✓ Configuration saved successfully.</p>}
          {error && <p className="text-sm text-red-600">✗ {error}</p>}
        </div>
      </section>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">ACM Entity Search</h2>
        <AcmiEntitySearch
          entities={[]}
          onSelect={(entity) => console.log('Selected:', entity)}
          placeholder="Search ACMI entities…"
        />
      </section>
    </div>
  );
}
