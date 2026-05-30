'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setCurrentOrgId, getCurrentOrgId } from './client-functions';

export interface OrgInfo {
  id: string;
  slug: string;
  name: string;
  hasAcmiConfig: boolean;
}

interface OrgContextValue {
  orgs: OrgInfo[];
  activeOrg: OrgInfo | null;
  setActiveOrg: (org: OrgInfo) => void;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const OrgContext = createContext<OrgContextValue>({
  orgs: [],
  activeOrg: null,
  setActiveOrg: () => {},
  isLoading: true,
  error: null,
  refresh: () => {},
});

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within AcmiProvider');
  return ctx;
}

export function AcmiProvider({ children }: { children: React.ReactNode }) {
  const [orgs, setOrgs] = useState<OrgInfo[]>([]);
  const [activeOrg, setActiveOrgState] = useState<OrgInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSetActiveOrg = useCallback((org: OrgInfo) => {
    setActiveOrgState(org);
    setCurrentOrgId(org.id); // Sync to client-functions module-level var
  }, []);

  const fetchOrgs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/db/organizations');
      if (!res.ok) throw new Error(`Failed to fetch orgs: ${res.status}`);
      const data = await res.json();
      const orgList: OrgInfo[] = (data.organizations || []).map((o: Record<string, unknown>) => ({
        id: o.id as string,
        slug: o.slug as string,
        name: o.name as string,
        hasAcmiConfig: false,
      }));
      setOrgs(orgList);

      // If no active org yet and we have orgs, set the first one
      if (orgList.length > 0) {
        // Check if current active org is still in list
        const stillExists = activeOrg && orgList.some((o) => o.id === activeOrg.id);
        if (!stillExists) {
          handleSetActiveOrg(orgList[0]);
        }
      } else {
        // No orgs — clear
        if (activeOrg) {
          handleSetActiveOrg(null as unknown as OrgInfo);
          setCurrentOrgId(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [activeOrg, handleSetActiveOrg]);

  useEffect(() => {
    fetchOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OrgContext.Provider
      value={{
        orgs,
        activeOrg,
        setActiveOrg: handleSetActiveOrg,
        isLoading,
        error,
        refresh: fetchOrgs,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}
