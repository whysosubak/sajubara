"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPrimaryPerson, loadPeople } from "@/lib/bara/people";
import { reportInputParams } from "@/lib/saju/report-links";
import { LS_SAJU_INPUT } from "./SaveLastSajuCard";

export default function MenuCardLink({
  baseHref,
  requiresSaju = false,
  fallbackHref = "/saju",
  className,
  style,
  children,
}: {
  baseHref: string;
  requiresSaju?: boolean;
  fallbackHref?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const [params, setParams] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setHydrated(true);
    if (!requiresSaju) return;
    try {
      const people = loadPeople();
      const target = getPrimaryPerson(people) ?? people[0] ?? null;
      if (target) {
        setParams(reportInputParams(target.input).toString());
        return;
      }
      const raw = localStorage.getItem(LS_SAJU_INPUT);
      if (!raw) return;
      const obj = JSON.parse(raw) as Record<string, string>;
      setParams(new URLSearchParams(obj).toString());
    } catch {
      // ignore
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [requiresSaju]);

  let href = baseHref;
  if (requiresSaju && hydrated) {
    href = params ? `${baseHref}?${params}` : fallbackHref;
  }

  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}
