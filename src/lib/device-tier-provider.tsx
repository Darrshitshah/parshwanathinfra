"use client";

/**
 * React context for device tiers. Owner: Director.
 *
 *   const { tier, ready, reducedMotion } = useDeviceTier();
 *   if (!ready || tier === "C") return <StaticVersion />;
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { readTierOverride, readTierSignals, SERVER_DEVICE, toDeviceInfo, type DeviceInfo } from "./device-tier";

const DeviceTierContext = createContext<DeviceInfo>(SERVER_DEVICE);

export function DeviceTierProvider({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<DeviceInfo>(SERVER_DEVICE);

  useEffect(() => {
    const override = readTierOverride();
    const update = () => {
      const next = toDeviceInfo(readTierSignals(), override);
      document.documentElement.dataset.tier = next.tier;
      setDevice(next);
    };
    update();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.addEventListener("change", update);
    return () => reduced.removeEventListener("change", update);
  }, []);

  return <DeviceTierContext.Provider value={device}>{children}</DeviceTierContext.Provider>;
}

export function useDeviceTier(): DeviceInfo {
  return useContext(DeviceTierContext);
}
