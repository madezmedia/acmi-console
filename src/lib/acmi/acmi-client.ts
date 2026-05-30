import type { AcmiNamespace, AcmiSlot, AcmiBootstrap, AcmiEvent } from './acmi-types';

interface AcmiClientOptions {
  url: string;
  token: string;
  tenantPrefix?: string;
}

function key(ns: AcmiNamespace | string, id: string, slot: AcmiSlot, tenantPrefix?: string): string {
  const base = tenantPrefix
    ? `acmi:tenant:${tenantPrefix}:${ns}:${id}`
    : `acmi:${ns}:${id}`;
  return `${base}:${slot}`;
}

async function redisCommand(url: string, token: string, cmd: string, ...args: string[]) {
  const path = `/${cmd}/${args.map(a => encodeURIComponent(a)).join('/')}`;
  const res = await fetch(`${url}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Redis error: ${res.status} ${res.statusText}`);
  return res.json();
}

export class AcmiClient {
  private url: string;
  private token: string;
  private tenantPrefix?: string;

  constructor(opts: AcmiClientOptions) {
    this.url = opts.url;
    this.token = opts.token;
    this.tenantPrefix = opts.tenantPrefix;
  }

  async getProfile(ns: AcmiNamespace | string, id: string) {
    const k = key(ns, id, 'profile', this.tenantPrefix);
    const res = await redisCommand(this.url, this.token, 'GET', k);
    return res.result ? JSON.parse(res.result) : null;
  }

  async setProfile(ns: AcmiNamespace | string, id: string, data: Record<string, unknown>) {
    const k = key(ns, id, 'profile', this.tenantPrefix);
    return redisCommand(this.url, this.token, 'SET', k, JSON.stringify(data));
  }

  async getSignals(ns: AcmiNamespace | string, id: string) {
    const k = key(ns, id, 'signals', this.tenantPrefix);
    const res = await redisCommand(this.url, this.token, 'GET', k);
    return res.result ? JSON.parse(res.result) : {};
  }

  async setSignal(ns: AcmiNamespace | string, id: string, signalKey: string, value: unknown) {
    const signals = await this.getSignals(ns, id);
    signals[signalKey] = value;
    return this.setSignals(ns, id, signals);
  }

  async setSignals(ns: AcmiNamespace | string, id: string, data: Record<string, unknown>) {
    const k = key(ns, id, 'signals', this.tenantPrefix);
    return redisCommand(this.url, this.token, 'SET', k, JSON.stringify(data));
  }

  async getTimeline(ns: AcmiNamespace | string, id: string, limit = 50) {
    const k = key(ns, id, 'timeline', this.tenantPrefix);
    const res = await redisCommand(this.url, this.token, 'ZREVRANGE', k, '0', String(limit - 1));
    return (res.result || []).map((m: string) => JSON.parse(m) as AcmiEvent);
  }

  async appendEvent(ns: AcmiNamespace | string, id: string, event: Omit<AcmiEvent, 'ts'>) {
    const k = key(ns, id, 'timeline', this.tenantPrefix);
    const full = { ...event, ts: Date.now() } as AcmiEvent;
    return redisCommand(this.url, this.token, 'ZADD', k, String(full.ts), JSON.stringify(full));
  }

  async listIds(ns: AcmiNamespace | string): Promise<string[]> {
    const pattern = this.tenantPrefix
      ? `acmi:tenant:${this.tenantPrefix}:${ns}:*:profile`
      : `acmi:${ns}:*:profile`;
    const res = await redisCommand(this.url, this.token, 'SCAN', '0', 'MATCH', pattern, 'COUNT', '100');
    const keys: string[] = res.result?.[1] || [];
    const slotLen = ':profile'.length;
    const prefixLen = this.tenantPrefix
      ? `acmi:tenant:${this.tenantPrefix}:${ns}:`.length
      : `acmi:${ns}:`.length;
    return keys.map((k: string) => k.slice(prefixLen, -slotLen));
  }

  async getEntity(ns: AcmiNamespace | string, id: string, timelineLimit = 10): Promise<AcmiBootstrap> {
    const [profile, signals, timeline] = await Promise.all([
      this.getProfile(ns, id),
      this.getSignals(ns, id),
      this.getTimeline(ns, id, timelineLimit),
    ]);
    return {
      profile,
      signals,
      recentTimeline: timeline,
      activeThreads: [],
    };
  }
}
