'use client';

import { useState } from 'react';
import { AcmiEntitySearch } from '@/components/acmi/AcmiEntitySearch';

export default function SettingsPage() {
  const [config, setConfig] = useState({ url: '', token: '', tenantPrefix: '' });
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

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
            onClick={async () => {
              setSaving(true);
              // Will wire to PUT /api/db/organizations/[slug]/acmi-config later
              await new Promise(r => setTimeout(r, 500));
              setSaving(false);
            }}
            disabled={saving || !config.url || !config.token}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
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
