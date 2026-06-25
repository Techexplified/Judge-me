import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 50;

/**
 * @template T
 * @param {T} initial
 */
export function useConfigHistory(initial) {
  const [config, setConfigState] = useState(initial);
  const configRef = useRef(initial);
  const historyRef = useRef([initial]);
  const indexRef = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < historyRef.current.length - 1);
  }, []);

  const applyConfig = useCallback(
    (next) => {
      configRef.current = next;
      setConfigState(next);
    },
    [],
  );

  const pushHistory = useCallback(
    (next) => {
      const current = historyRef.current[indexRef.current];
      if (JSON.stringify(current) === JSON.stringify(next)) return;

      const truncated = historyRef.current.slice(0, indexRef.current + 1);
      truncated.push(next);
      if (truncated.length > MAX_HISTORY) {
        historyRef.current = truncated.slice(truncated.length - MAX_HISTORY);
        indexRef.current = historyRef.current.length - 1;
      } else {
        historyRef.current = truncated;
        indexRef.current = truncated.length - 1;
      }

      applyConfig(next);
      syncFlags();
    },
    [applyConfig, syncFlags],
  );

  const updateConfig = useCallback(
    (key, value) => {
      pushHistory({ ...configRef.current, [key]: value });
    },
    [pushHistory],
  );

  const patchConfig = useCallback(
    (partial) => {
      pushHistory({ ...configRef.current, ...partial });
    },
    [pushHistory],
  );

  const replaceConfig = useCallback(
    (next) => {
      pushHistory(next);
    },
    [pushHistory],
  );

  const undo = useCallback(() => {
    if (indexRef.current <= 0) return;
    indexRef.current -= 1;
    applyConfig(historyRef.current[indexRef.current]);
    syncFlags();
  }, [applyConfig, syncFlags]);

  const redo = useCallback(() => {
    if (indexRef.current >= historyRef.current.length - 1) return;
    indexRef.current += 1;
    applyConfig(historyRef.current[indexRef.current]);
    syncFlags();
  }, [applyConfig, syncFlags]);

  const resetHistory = useCallback(
    (next) => {
      configRef.current = next;
      historyRef.current = [next];
      indexRef.current = 0;
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
