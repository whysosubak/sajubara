"use client";

import { useEffect, useRef, useState } from "react";

export default function PrintDocumentActions({
  pdfTitle,
  returnHref,
}: {
  pdfTitle: string;
  returnHref: string;
}) {
  const [printed, setPrinted] = useState(false);
  const didPrintRef = useRef(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = pdfTitle;

    const timer = window.setTimeout(() => {
      if (didPrintRef.current) return;
      didPrintRef.current = true;
      window.print();
      setPrinted(true);
    }, 650);

    return () => {
      window.clearTimeout(timer);
      document.title = previousTitle;
    };
  }, [pdfTitle]);

  return (
    <div className="print-hidden sticky top-0 z-10 border-b border-[#E8DDC5] bg-[#FFFDF5]/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[760px] items-center justify-between gap-3">
        <a
          href={returnHref}
          className="rounded-full border border-[#E1D4BA] bg-white px-3.5 py-2 text-[13px] font-extrabold text-[#5B4A36]"
        >
          리포트로 돌아가기
        </a>
        <button
          type="button"
          onClick={() => {
            didPrintRef.current = true;
            window.print();
            setPrinted(true);
          }}
          className="rounded-full bg-[#5C6E3E] px-4 py-2 text-[13px] font-extrabold text-white"
        >
          {printed ? "PDF 저장 다시 열기" : "PDF 저장 열기"}
        </button>
      </div>
    </div>
  );
}
