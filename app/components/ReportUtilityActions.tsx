"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ReportUtilityActionsProps = {
  title: string;
  description?: string;
  pdfHref?: string;
  cardImageHref?: string;
  cardDownloadName?: string;
};

export default function ReportUtilityActions({
  title,
  description,
  pdfHref,
  cardImageHref,
  cardDownloadName,
}: ReportUtilityActionsProps) {
  const [notice, setNotice] = useState("");
  const restorePrintRef = useRef<(() => void) | null>(null);
  const safeCardName = useMemo(
    () => sanitizeFileName(cardDownloadName ?? `${title}-카드.png`),
    [cardDownloadName, title],
  );
  const pdfTitle = useMemo(() => buildReportPdfTitle(title), [title]);

  useEffect(() => {
    const prepare = () => {
      restorePrintRef.current?.();
      restorePrintRef.current = prepareReportPrint(pdfTitle);
    };
    const restore = () => {
      restorePrintRef.current?.();
      restorePrintRef.current = null;
    };

    window.addEventListener("beforeprint", prepare);
    window.addEventListener("afterprint", restore);
    return () => {
      window.removeEventListener("beforeprint", prepare);
      window.removeEventListener("afterprint", restore);
      restore();
    };
  }, [pdfTitle]);

  async function handleShare() {
    const url = window.location.href;
    const shareText = description ?? "바라사주 결과를 확인해보세요.";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText, url });
        setNotice("공유창을 열었어요.");
      } else {
        await copyText(url);
        setNotice("결과 링크를 복사했어요.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await copyText(url);
        setNotice("결과 링크를 복사했어요.");
      } catch {
        setNotice("링크 복사에 실패했어요.");
      }
    }
  }

  function handlePdf() {
    if (pdfHref) {
      setNotice("문서형 PDF 저장 화면으로 이동할게요.");
      window.location.assign(pdfHref);
      return;
    }

    setNotice("전체 내용을 펼쳐 PDF 저장 화면을 열게요.");
    restorePrintRef.current?.();
    restorePrintRef.current = prepareReportPrint(pdfTitle);
    window.setTimeout(() => window.print(), 120);
    window.setTimeout(() => {
      restorePrintRef.current?.();
      restorePrintRef.current = null;
    }, 4000);
  }

  return (
    <section
      className="sb-print-hidden rounded-sb-lg bg-sb-paper px-4 py-3"
      style={{
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold text-sb-olive-dark tracking-wider uppercase">
            저장 · 공유
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-sb-ink-3">
            결과를 다시 보기 쉽게 남겨둘 수 있어요.
          </p>
        </div>
        {notice && <span className="text-[10.5px] font-bold text-sb-terra-dark">{notice}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="rounded-full px-3 py-2.5 text-[12px] font-extrabold text-sb-ink"
          style={{
            background: "var(--sb-cream)",
            boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
          }}
        >
          결과 링크 공유
        </button>
        <button
          type="button"
          onClick={handlePdf}
          className="rounded-full px-3 py-2.5 text-[12px] font-extrabold text-sb-ink"
          style={{
            background: "var(--sb-cream)",
            boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
          }}
        >
          PDF로 저장
        </button>
        {cardImageHref && (
          <a
            href={cardImageHref}
            download={safeCardName}
            className="col-span-2 rounded-full px-3 py-2.5 text-center text-[12px] font-extrabold text-white"
            style={{
              background: "var(--sb-olive)",
              boxShadow: "0 3px 10px rgba(92,110,62,0.22)",
            }}
          >
            카피바라 카드 이미지 저장
          </a>
        )}
      </div>
    </section>
  );
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function sanitizeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
}

function buildReportPdfTitle(title: string): string {
  const cleaned = title.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
  const match = cleaned.match(/^(.+?)님의\s*(.+)$/);
  if (!match) return sanitizeFileName(`바라사주 - ${cleaned}`);
  const [, name, reportTitle] = match;
  return sanitizeFileName(`바라사주 - ${name.trim()} - ${reportTitle.trim()}`);
}

function prepareReportPrint(pdfTitle: string): () => void {
  const openedDetails: HTMLDetailsElement[] = [];
  const previousTitle = document.title;
  document.title = pdfTitle;

  document.querySelectorAll<HTMLDetailsElement>("details").forEach((details) => {
    if (!details.open) {
      details.open = true;
      openedDetails.push(details);
    }
  });
  document.documentElement.classList.add("sb-report-printing");
  document.body.classList.add("sb-report-printing");

  return () => {
    document.title = previousTitle;
    openedDetails.forEach((details) => {
      details.open = false;
    });
    document.documentElement.classList.remove("sb-report-printing");
    document.body.classList.remove("sb-report-printing");
  };
}
