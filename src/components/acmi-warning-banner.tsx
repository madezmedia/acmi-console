'use client';

import Link from 'next/link';
import { useOrg } from '@/lib/acmi/acmi-context';
import { useState, useEffect } from 'react';

export function AcmiWarningBanner() {
  const { activeOrg } = useOrg();
  const [hasConfig, setHasConfig] = useState(true); // assume configured
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!activeOrg) return;

    fetch(`/api/db/organizations/${activeOrg.slug}/acmi-config`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.config) setHasConfig(false);
        else setHasConfig(true);
      })
      .catch(() => setHasConfig(false))
      .finally(() => setChecked(true));
  }, [activeOrg]);

  if (!checked || hasConfig || !activeOrg) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      ⚠ ACMI Redis not configured.{' '}
      <Link href="/admin/settings" className="font-medium underline underline-offset-2">
        Configure in Settings
      </Link>{' '}
      to view agent data.
    </div>
  );
}
