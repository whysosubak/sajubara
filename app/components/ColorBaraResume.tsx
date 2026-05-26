"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  buildColorResultHref,
  getSelectedColorRecord,
  loadColorRecords,
  type ColorBaraRecord,
} from "@/lib/color/storage";

export default function ColorBaraResume() {
  const [record, setRecord] = useState<ColorBaraRecord | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const records = loadColorRecords();
    setCount(records.length);
    setRecord(getSelectedColorRecord());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!record) return null;

  return (
    <section
      className="mt-4 rounded-sb-lg bg-sb-paper px-4 py-4"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-extrabold tracking-[0.14em] uppercase text-sb-olive-light">
            Saved Color Report
          </div>
          <h2 className="mt-1 text-[17px] font-extrabold text-sb-ink tracking-tight">
            {record.name}님의 컬러바라 이어보기
          </h2>
          <p className="mt-1.5 text-[12.5px] font-semibold leading-relaxed text-sb-ink-2">
            {record.report.cheat.colorKr} 핵심 컬러 · {record.report.stage.keyword}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-sb-olive-dark"
          style={{ background: "var(--sb-cream)" }}
        >
          {count}개 저장
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <ColorMiniChip label={record.lunarLabel} color={record.report.soul.hex} />
        <ColorMiniChip label={`소울 ${record.report.soul.colorKr}`} color={record.report.soul.hex} />
        <ColorMiniChip label={`무대 ${record.report.stage.colorKr}`} color={record.report.stage.hex} />
      </div>

      <Link
        href={buildColorResultHref(record)}
        className="mt-4 flex items-center justify-center rounded-full bg-sb-olive px-4 py-3 text-[13px] font-extrabold text-white active:scale-[0.99] transition-transform"
      >
        이전 결과 다시 보기
      </Link>
    </section>
  );
}

function ColorMiniChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-sb-ink-2"
      style={{ background: "rgba(255,253,245,0.78)", boxShadow: "inset 0 0 0 1px rgba(91,74,54,0.08)" }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
