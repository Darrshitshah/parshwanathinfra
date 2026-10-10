"use client";

/**
 * Enquiry context: `useEnquiry().open({ project?, interest?, plot?, unit? })` opens the drawer from anywhere
 * (a CTA, the plan's plot picker, the building explorer) with the context pre-filled. The drawer itself is a
 * lazily loaded chunk: nothing heavy ships until the first open (or a hover/focus on a call to action).
 * Owner: pages-lead.
 */
import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { FormValues } from "./form-state";
import type { EnquiryConfig, EnquiryContextValue, EnquiryPrefill } from "./types";

const loadDrawer = () => import("./EnquiryDrawer");
const EnquiryDrawer = dynamic(() => loadDrawer().then((module) => module.EnquiryDrawer), { ssr: false });

const noop = () => undefined;

const EnquiryContext = createContext<EnquiryContextValue>({
  open: noop,
  close: noop,
  isOpen: false,
  prefetch: noop,
});

interface DrawerState {
  open: boolean;
  /** True once the drawer has been opened (or prefetched into use): from then on it stays mounted for its exit. */
  loaded: boolean;
  prefill: EnquiryPrefill;
  openedAt: number;
  session: number;
  draft: Partial<FormValues>;
}

const INITIAL_STATE: DrawerState = { open: false, loaded: false, prefill: {}, openedAt: 0, session: 0, draft: {} };

export function EnquiryProvider({ config, children }: { config: EnquiryConfig; children: ReactNode }) {
  const [state, setState] = useState<DrawerState>(INITIAL_STATE);
  const draftRef = useRef<Partial<FormValues>>({});

  const open = useCallback((prefill?: EnquiryPrefill) => {
    const openedAt = Date.now();
    const draft = draftRef.current;
    setState((previous) => ({
      open: true,
      loaded: true,
      prefill: prefill ?? {},
      openedAt,
      session: previous.session + 1,
      draft,
    }));
  }, []);

  const close = useCallback(() => {
    setState((previous) => ({ ...previous, open: false }));
  }, []);

  const prefetch = useCallback(() => {
    void loadDrawer();
  }, []);

  const handleDraftChange = useCallback((values: FormValues) => {
    draftRef.current = values;
  }, []);

  const handleSuccess = useCallback(() => {
    draftRef.current = {};
  }, []);

  const value = useMemo<EnquiryContextValue>(
    () => ({ open, close, isOpen: state.open, prefetch }),
    [open, close, state.open, prefetch],
  );

  return (
    <EnquiryContext.Provider value={value}>
      {children}
      {state.loaded ? (
        <EnquiryDrawer
          config={config}
          open={state.open}
          prefill={state.prefill}
          openedAt={state.openedAt}
          session={state.session}
          initialDraft={state.draft}
          onClose={close}
          onDraftChange={handleDraftChange}
          onSuccess={handleSuccess}
        />
      ) : null}
    </EnquiryContext.Provider>
  );
}

export function useEnquiry(): EnquiryContextValue {
  return useContext(EnquiryContext);
}
