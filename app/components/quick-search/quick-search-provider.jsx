/* eslint-disable react/prop-types */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { QuickSearchButton } from "./quick-search-button.jsx";
import { QuickSearchModal } from "./quick-search-modal.jsx";
import { GettingStartedGuideModal } from "./getting-started-guide-modal.jsx";
import { isQuickSearchShortcut, isTypingTarget } from "./quick-search-shortcut.js";

const QuickSearchContext = createContext(null);

export function useQuickSearch() {
  const ctx = useContext(QuickSearchContext);
  if (!ctx) {
    throw new Error("useQuickSearch must be used within a QuickSearchProvider");
  }
  return ctx;
}

export function QuickSearchProvider({ children }) {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isGuideOpen, setGuideOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openGuide = useCallback(() => setGuideOpen(true), []);
  const closeGuide = useCallback(() => setGuideOpen(false), []);

  useEffect(() => {
    function onKeyDown(event) {
      if (isQuickSearchShortcut(event) && !isTypingTarget(event.target)) {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }
      if (event.key === "Escape") {
        setGuideOpen((guideOpen) => {
          if (guideOpen) return false;
          setSearchOpen(false);
          return guideOpen;
        });
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(
    () => ({
      isSearchOpen,
      isGuideOpen,
      openSearch,
      closeSearch,
      openGuide,
      closeGuide,
    }),
    [isSearchOpen, isGuideOpen, openSearch, closeSearch, openGuide, closeGuide],
  );

  return (
    <QuickSearchContext.Provider value={value}>
      {children}
      <QuickSearchButton />
      {isSearchOpen ? (
        <QuickSearchModal onClose={closeSearch} onOpenGuide={openGuide} />
      ) : null}
      {isGuideOpen ? (
        <GettingStartedGuideModal onClose={closeGuide} onCloseAll={() => {
          closeGuide();
          closeSearch();
        }} />
      ) : null}
    </QuickSearchContext.Provider>
  );
}
