"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BaraCardView from "@/app/components/BaraCard";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  MOCK_ENTITLEMENT_COOKIE,
  emptyMockEntitlements,
  isScopeUnlocked,
  parseMockEntitlements,
  type MockEntitlements,
} from "@/lib/auth/mock-entitlements";
import { cardById, isCardWritten } from "@/lib/bara/cards";
import { getSelectedId, loadPeople, setSelectedId, type Person } from "@/lib/bara/people";
import { buildColorResultHref, loadColorRecords, type ColorBaraRecord } from "@/lib/color/storage";
import { checkoutHref } from "@/lib/payments/checkout";
import { currentKstYear } from "@/lib/saju/report-links";
import { sajuPersonKey, sajuPersonProduct } from "@/lib/saju/scope";
import type { SajuInput } from "@/lib/saju/types";

type ReportItem = {
  key: string;
  title: string;
  desc: string;
  unlocked: boolean;
  href: string;
  checkoutHref: string;
};

export default function MyPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [colorRecords, setColorRecords] = useState<ColorBaraRecord[]>([]);
  const [selectedId, setSelected] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<MockEntitlements>(emptyMockEntitlements());
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setHydrated(true);
    const list = loadPeople();
    setPeople(list);
    setColorRecords(loadColorRecords());
    setSelected(getSelectedId() ?? list[0]?.id ?? null);
    setEntitlements(parseMockEntitlements(readCookie(MOCK_ENTITLEMENT_COOKIE)));
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = createSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setEmail(session?.user.email ?? null);
      });
      return () => sub.subscription.unsubscribe();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const selectedPerson = useMemo(() => {
    if (people.length === 0) return null;
    return people.find((p) => p.id === selectedId) ?? people[0];
  }, [people, selectedId]);

  const reports = useMemo(
    () =>
      selectedPerson
        ? buildReportItems(selectedPerson.input, entitlements).filter((report) => report.unlocked)
        : [],
    [entitlements, selectedPerson],
  );
  const visibleColorRecords = useMemo(
    () =>
      selectedPerson
        ? colorRecords.filter((record) => isColorRecordForPerson(record, selectedPerson))
        : colorRecords,
    [colorRecords, selectedPerson],
  );

  function selectPerson(person: Person) {
    setSelectedId(person.id);
    setSelected(person.id);
  }

  async function handleSignOut() {
    if (
      signingOut ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.assign("/");
    } catch (error) {
      console.error("[sajubara] sign out failed", error);
      setSigningOut(false);
    }
  }

  const card = selectedPerson ? cardById(selectedPerson.cardId) : undefined;

  return (
    <>
      <header
        className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0"
        style={{
          background: "rgba(255, 248, 232, 0.88)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid var(--sb-hairline)",
        }}
      >
        <div className="flex flex-col leading-none">
          <span className="text-[19px] font-bold text-sb-olive-dark tracking-tight">보관함</span>
          <span className="text-[10px] font-semibold text-sb-ink-3 mt-[3px] tracking-tight">
            사람별 카드 · 구매한 리포트
          </span>
        </div>
        <div className="flex items-center gap-2">
          {email && (
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="h-9 rounded-full bg-sb-paper px-3 text-[12.5px] font-bold text-sb-ink-2 disabled:opacity-60"
              style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
            >
              {signingOut ? "나가는 중" : "로그아웃"}
            </button>
          )}
          <Link
            href="/people"
            className="h-9 px-3 rounded-full bg-sb-paper flex items-center text-[12.5px] font-bold text-sb-ink-2"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          >
            사주 관리
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {!hydrated ? (
          <LoadingState />
        ) : people.length === 0 && colorRecords.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {selectedPerson && card && (
              <>
                {people.length > 1 && (
                  <section>
                    <h2 className="text-[12px] font-extrabold text-sb-olive-light tracking-wider uppercase mb-2 px-1">
                      저장된 사람
                    </h2>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {people.map((person) => {
                        const active = person.id === selectedPerson.id;
                        return (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => selectPerson(person)}
                            className="shrink-0 rounded-full px-3 py-2 text-[12.5px] font-extrabold"
                            style={{
                              background: active ? "var(--sb-olive)" : "var(--sb-paper)",
                              color: active ? "white" : "var(--sb-ink-2)",
                              boxShadow: active
                                ? "0 3px 10px rgba(92,110,62,0.22)"
                                : "inset 0 0 0 1px var(--sb-hairline)",
                            }}
                          >
                            {person.input.name}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section>
                  <h2 className="text-[12px] font-extrabold text-sb-olive-light tracking-wider uppercase mb-2 px-1">
                    {selectedPerson.input.name}님의 사주바라 카드
                  </h2>
                  <Link
                    href={buildSajuResultHref(selectedPerson.input)}
                    className="block active:scale-[0.99] transition-transform"
                    aria-label={`${selectedPerson.input.name}님 사주 결과 다시 보기`}
                  >
                    <BaraCardView
                      card={card}
                      variant="wide"
                      subjectName={selectedPerson.input.name}
                    />
                  </Link>
                  {!isCardWritten(card) && (
                    <p className="text-[11px] text-sb-ink-3 px-1 pt-2 leading-relaxed">
                      카드 본문이 아직 비어 있어요. 60카드 본문을 채우면 여기에도 반영됩니다.
                    </p>
                  )}
                </section>

                {reports.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center justify-between px-1">
                      <h2 className="text-[12px] font-extrabold text-sb-olive-light tracking-wider uppercase">
                        구매한 리포트
                      </h2>
                      <span className="text-[11px] font-bold text-sb-ink-3">
                        테스트 결제 기준
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {reports.map((report) => (
                        <ReportRow key={report.key} report={report} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {visibleColorRecords.length > 0 && (
              <ColorRecordsSection
                records={visibleColorRecords}
                ownerName={selectedPerson?.input.name}
              />
            )}

            {selectedPerson && card ? (
              <section>
                <Link
                  href="/saju?mode=add-person"
                  className="rounded-full bg-sb-paper text-sb-ink-2 text-[12.5px] font-bold px-4 py-2.5 text-center flex items-center justify-center"
                  style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
                >
                  다른 사람 사주 추가하기
                </Link>
              </section>
            ) : (
              <section>
                <Link
                  href="/saju"
                  className="rounded-full bg-sb-paper text-sb-ink-2 text-[12.5px] font-bold px-4 py-2.5 text-center flex items-center justify-center"
                  style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
                >
                  사주바라 카드도 받아보기
                </Link>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

function ReportRow({ report }: { report: ReportItem }) {
  return (
    <Link
      href={report.unlocked ? report.href : report.checkoutHref}
      className="rounded-sb-lg bg-sb-paper px-4 py-3.5 flex items-center gap-3 active:scale-[0.99] transition-transform"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-[18px]"
        style={{ background: report.unlocked ? "var(--sb-cream)" : "rgba(91,74,54,0.08)" }}
      >
        {report.unlocked ? "🔓" : "🔒"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[14px] font-extrabold text-sb-ink tracking-tight">
            {report.title}
          </h3>
          <span
            className="rounded-full px-1.5 py-[2px] text-[9px] font-extrabold"
            style={{
              background: report.unlocked ? "var(--sb-olive)" : "var(--sb-yuzu)",
              color: report.unlocked ? "white" : "var(--sb-olive-dark)",
            }}
          >
            {report.unlocked ? "구매완료" : "잠금"}
          </span>
        </div>
        <p className="mt-1 text-[11.5px] font-semibold text-sb-ink-3 leading-snug">
          {report.desc}
        </p>
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M4.5 2.5L7.8 6L4.5 9.5"
          stroke="var(--sb-ink-3)"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

function ColorRecordsSection({
  records,
  ownerName,
}: {
  records: ColorBaraRecord[];
  ownerName?: string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[12px] font-extrabold text-sb-olive-light tracking-wider uppercase">
          {ownerName ? `${ownerName}님의 컬러바라` : "컬러바라"}
        </h2>
        <span className="text-[11px] font-bold text-sb-ink-3">
          무료 리포트 {records.length}개
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {records.map((record) => (
          <Link
            key={record.id}
            href={buildColorResultHref(record)}
            className="rounded-sb-lg bg-sb-paper px-4 py-3.5 flex items-center gap-3 active:scale-[0.99] transition-transform"
            style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
          >
            <div
              className="h-11 w-11 rounded-full shrink-0"
              style={{
                background:
                  `radial-gradient(circle at 35% 30%, ${record.report.soul.hex}, transparent 38%), radial-gradient(circle at 72% 72%, ${record.report.cheat.hex}, transparent 42%), var(--sb-cream)`,
                boxShadow: "inset 0 0 0 1px rgba(91,74,54,0.08)",
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-[14px] font-extrabold text-sb-ink tracking-tight">
                  {record.name}님의 운명 컬러
                </h3>
                <span
                  className="shrink-0 rounded-full px-1.5 py-[2px] text-[9px] font-extrabold text-sb-olive-dark"
                  style={{ background: "var(--sb-cream)" }}
                >
                  저장됨
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11.5px] font-semibold text-sb-ink-3 leading-snug">
                {record.report.cheat.colorKr} 핵심 컬러 · {record.lunarLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <ColorRecordChip label={`소울 ${record.report.soul.colorKr}`} color={record.report.soul.hex} />
                <ColorRecordChip label={`무대 ${record.report.stage.colorKr}`} color={record.report.stage.hex} />
              </div>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M4.5 2.5L7.8 6L4.5 9.5"
                stroke="var(--sb-ink-3)"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}

function isColorRecordForPerson(record: ColorBaraRecord, person: Person): boolean {
  const recordName = normalizePersonName(record.name);
  const personName = normalizePersonName(person.input.name);
  if (!recordName || recordName !== personName) return false;

  if (record.solarDate) {
    return record.solarDate === person.input.birthDate;
  }

  return true;
}

function normalizePersonName(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

function ColorRecordChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold text-sb-ink-2"
      style={{ background: "rgba(91,74,54,0.06)" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function LoadingState() {
  return (
    <div
      className="bg-sb-paper rounded-sb-lg px-4 py-6 text-center text-[13px] text-sb-ink-3"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      불러오는 중…
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="bg-sb-paper rounded-sb-lg px-5 py-6 text-center"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="text-[40px] mb-2">🌿</div>
      <h3 className="text-[15px] font-extrabold text-sb-ink mb-1.5 tracking-tight">
        아직 받은 바라 카드가 없어요
      </h3>
      <p className="text-[12.5px] text-sb-ink-2 leading-relaxed mb-4">
        사주바라부터 시작해볼까요?
      </p>
      <Link
        href="/saju"
        className="inline-flex items-center gap-1.5 rounded-full bg-sb-olive text-white text-[12.5px] font-bold px-4 py-2.5"
        style={{ boxShadow: "0 2px 6px rgba(92,110,62,0.3)" }}
      >
        사주바라 시작하기
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path
            d="M3.5 2L6.5 5L3.5 8"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  );
}

function buildReportItems(input: SajuInput, entitlements: MockEntitlements): ReportItem[] {
  const year = currentKstYear();
  const personKey = sajuPersonKey(input);
  const sajuHref = buildSajuResultHref(input, true);
  const daewoonHref = buildDaewoonHref(input, true);
  const yearlyHref = buildYearlyHref(input, year, true);

  return [
    {
      key: "saju",
      title: "사주바라 전체 해설",
      desc: "성격·재물·관계·그림자 카드",
      unlocked: isScopeUnlocked(entitlements, { product: "saju", personKey }),
      href: sajuHref,
      checkoutHref: buildCheckoutHref({
        product: sajuPersonProduct(input),
        title: `${input.name}님 사주바라 전체 해설`,
        returnTo: sajuHref,
      }),
    },
    {
      key: "daewoon",
      title: "현재 10년 대운",
      desc: "5챕터·10년 세운·시크릿 솔루션",
      unlocked: isScopeUnlocked(entitlements, { product: "daewoon", period: "current", personKey }),
      href: daewoonHref,
      checkoutHref: buildCheckoutHref({
        product: `daewoon:${personKey}:current`,
        title: `${input.name}님 현재 대운 상세`,
        returnTo: daewoonHref,
      }),
    },
    {
      key: "yearly",
      title: `${year}년 연도별 운세`,
      desc: "12개월·6대 운세·시크릿 솔루션",
      unlocked: isScopeUnlocked(entitlements, { product: "yearly", year, personKey }),
      href: yearlyHref,
      checkoutHref: buildCheckoutHref({
        product: `yearly:${personKey}:${year}`,
        title: `${input.name}님 ${year}년 전체 해설`,
        returnTo: yearlyHref,
      }),
    },
  ];
}

function buildInputParams(input: SajuInput): URLSearchParams {
  const params = new URLSearchParams({
    name: input.name,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    gender: input.gender,
    calendar: input.calendar,
  });
  if (input.loveStatus) params.set("loveStatus", input.loveStatus);
  if (input.jobStatus) params.set("jobStatus", input.jobStatus);
  return params;
}

function buildSajuResultHref(input: SajuInput, paid = false): string {
  const params = buildInputParams(input);
  if (paid) params.set("paid", "1");
  return `/saju/result?${params.toString()}`;
}

function buildDaewoonHref(input: SajuInput, paid = false): string {
  const params = buildInputParams(input);
  if (paid) params.set("paid", "1");
  return `/daewoon?${params.toString()}`;
}

function buildYearlyHref(input: SajuInput, year: number, paid = false): string {
  const params = buildInputParams(input);
  if (paid) params.set("paid", "1");
  return `/yearly/${year}?${params.toString()}`;
}

function buildCheckoutHref({
  product,
  title,
  returnTo,
}: {
  product: string;
  title: string;
  returnTo: string;
}): string {
  return checkoutHref({
    amount: 990,
    product,
    returnTo,
    title,
  });
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
}
