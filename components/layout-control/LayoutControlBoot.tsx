'use client';

import { type ComponentType, useEffect, useState } from 'react';

/** Loads the right-side editor only after a server-authenticated admin session check. */
export function LayoutControlBoot() {
  const [Panel, setPanel] = useState<ComponentType | null>(null);

  useEffect(() => {
    let alive = true;
    void fetch('/api/admin/session')
      .then((response) => response.json())
      .then(async (data) => {
        if (!alive || data?.ok !== true) return;
        const module = await import('./LayoutControlPanel');
        if (alive) setPanel(() => module.LayoutControlPanel);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return Panel ? <Panel /> : null;
}
