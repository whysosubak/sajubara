"use client";

import { useEffect } from "react";

const CODEX_COMMENTS_ROOT_ID = "codex-browser-sidebar-comments-root";

export default function CodexBrowserOverlayFix() {
  useEffect(() => {
    if (window.location.hostname !== "localhost") return;

    const unblock = () => {
      const root = document.getElementById(CODEX_COMMENTS_ROOT_ID);
      root?.remove();
    };

    unblock();
    const observer = new MutationObserver(unblock);
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    const intervalId = window.setInterval(unblock, 500);

    return () => {
      observer.disconnect();
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
