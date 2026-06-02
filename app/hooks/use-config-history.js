import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 50;

/**
 * @template T
 * @param {T} initial
 */
export function useConfigHistory(initial) {
  const [config, setConfigState] = useState(initial);
  const configRef = useRef(initial);
  const pastRef = useRef([initial]);
  const futureRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 1);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const commitConfig = useCallback(
    (next, { recordHistory = true } = {}) => {
      configRef.current = next;
      setConfigState(next);

      if (!recordHistory) return;

      const past = pastRef.current;
      const last = past[past.length - 1];
      if (JSON.stringify(last) === JSON.stringify(next)) return;

      pastRef.current = [...past.slice(-(MAX_HISTORY - 1)), next];
      futureRef.current = [];
      syncFlags();
    },
    [syncFlags],
  );

  const updateConfig = useCallback(
    (key, value) => {
      commitConfig({ ...configRef.current, [key]: value });
    },
    [commitConfig],
  );

  const patchConfig = useCallback(
    (partial) => {
      commitConfig({ ...configRef.current, ...partial });
    },
    [commitConfig],
  );

  const replaceConfig = useCallback(
    (next) => {
      commitConfig(next);
    },
    [commitConfig],
  );

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length <= 1) return;
    const current = past[past.length - 1];
    futureRef.current = [current, ...futureRef.current];
    pastRef.current = past.slice(0, -1);
    const prev = pastRef.current[pastRef.current.length - 1];
    commitConfig(prev, { recordHistory: false });
    syncFlags();
  }, [commitConfig, syncFlags]);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (!future.length) return;
    const [next, ...rest] = future;
    futureRef.current = rest;
    pastRef.current = [...pastRef.current, next];
    commitConfig(next, { recordHistory: false });
    syncFlags();
  }, [commitConfig, syncFlags]);

  const resetHistory = useCallback(
    (next) => {
      configRef.current = next;
      pastRef.current = [next];
      futureRef.current = [];
      setConfigState(next);
      syncFlags();
    },
    [syncFlags],
  );

  const getConfig = useCallback(() => configRef.current, []);

  return {
    config,
    getConfig,
    updateConfig,
    patchConfig,
    replaceConfig,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
