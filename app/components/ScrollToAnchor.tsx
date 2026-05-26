"use client";

import { useEffect } from "react";

export default function ScrollToAnchor({
  id,
  signal,
}: {
  id: string;
  signal: string | number;
}) {
  useEffect(() => {
    if (window.location.hash !== `#${id}`) return;

    const scroll = () => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    const frame = window.requestAnimationFrame(scroll);
    const timeout = window.setTimeout(scroll, 180);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [id, signal]);

  return null;
}
