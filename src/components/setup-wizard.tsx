'use client';

import { useState } from 'react';
import { useOrg } from '@/lib/acmi/acmi-context';

type Step = 'welcome' | 'create-org' | 'acmi-config' | 'done';

export function SetupWizard() {
  const { refresh } = useOrg();
  const [step, setStep] = useState<Step>('welcome');
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [acmiUrl, setAcmiUrl] = useState('');
  const [acmiToken, setAcmiToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrg = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/db/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          slug: orgSlug || orgName.toLowerCase().replace(/\s+/g, '-'),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed: ${res.status}`);
      }
      // Refresh org context
      await refresh();
      // Wait a tick for refresh to complete, then advance
      setTimeout(() => setStep('acmi-config'), 300);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setError(null);
    try {
      // Need to re-fetch to get the newly created org
      const orgRes = await fetch('/api/db/organizations');
      const orgData = await orgRes.json();
      const org = orgData.organizations?.[0];
      if (!org) throw new Error('No org found. Try refreshing.');

      const res = await fetch(`/api/db/organizations/${org.slug}/acmi-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upstash_url: acmiUrl,
          upstash_token: acmiToken,
          tenant_prefix: org.slug,
        }),
      });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);

      await refresh();
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="mb-6 text-5xl">🚀</div>
        <h1 className="mb-3 text-3xl font-bold">Welcome to ACMI Console</h1>
        <p className="mb-8 text-muted-foreground">
          Your admin panel for managing AI agent fleets. Let&apos;s set up your workspace.
        </p>
        <button
          onClick={() => setStep('create-org')}
          className="rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90"
        >
          Get Started
        </button>
      </div>
    );
  }

  if (step === 'create-org') {
    return (
      <div className="mx-auto max-w-lg py-12">
        <h2 className="mb-6 text-2xl font-bold">Create Your Workspace</h2>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                setOrgSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '')
                );
              }}
              className="w-full rounded-lg border px-4 py-3 text-base"
              placeholder="My Agent Fleet"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug (used in URLs)</label>
            <input
              type="text"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="w-full rounded-lg border px-4 py-3 text-base font-mono text-sm"
              placeholder="my-agent-fleet"
            />
          </div>
          <button
            onClick={handleCreateOrg}
            disabled={saving || !orgName}
            className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'acmi-config') {
    return (
      <div className="mx-auto max-w-lg py-12">
        <h2 className="mb-6 text-2xl font-bold">Connect ACMI Redis</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Enter your Upstash Redis credentials so the console can read your ACMI agent data.
          Get these from your Upstash dashboard.
        </p>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Upstash Redis URL</label>
            <input
              type="text"
              value={acmiUrl}
              onChange={(e) => setAcmiUrl(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-base font-mono text-sm"
              placeholder="https://us1-xxxx-xxxx.upstash.io"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">REST Token</label>
            <input
              type="password"
              value={acmiToken}
              onChange={(e) => setAcmiToken(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-base font-mono text-sm"
              placeholder="Your Upstash REST token"
            />
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={saving || !acmiUrl || !acmiToken}
            className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Connect & View Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  // Done state — auto-refresh after 2s
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <div className="mb-6 text-5xl">✅</div>
      <h2 className="mb-3 text-2xl font-bold">All Set!</h2>
      <p className="mb-8 text-muted-foreground">
        Your ACMI Console is connected. Refreshing dashboard...
      </p>
      <meta httpEquiv="refresh" content="2;url=/admin" />
    </div>
  );
}
