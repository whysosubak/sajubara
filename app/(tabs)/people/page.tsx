"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MOCK_ENTITLEMENT_COOKIE,
  emptyMockEntitlements,
  isScopeUnlocked,
  parseMockEntitlements,
  type MockEntitlements,
} from "@/lib/auth/mock-entitlements";
import {
  getPrimaryChangeStatus,
  loadPeople,
  recordPrimaryChange,
  removePerson,
  RELATION_OPTIONS,
  SECONDARY_RELATION_OPTIONS,
  setPrimaryPerson,
  setSelectedId,
  updateRelation,
  type Person,
  type Relation,
  type SecondaryRelation,
} from "@/lib/bara/people";
import { cardById, isCardWritten } from "@/lib/bara/cards";
import {
  BRANCH_EMOJI,
  BRANCH_LABEL_KR,
  ELEMENT_COLOR_KR,
} from "@/lib/bara/types";
import { currentKstYear } from "@/lib/saju/report-links";
import { sajuPersonKey } from "@/lib/saju/scope";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedId, setSelected] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [entitlements, setEntitlements] = useState<MockEntitlements>(emptyMockEntitlements());
  const [relationTarget, setRelationTarget] = useState<Person | null>(null);
  const [primaryConfirm, setPrimaryConfirm] = useState<{
    target: Person;
    current: Person;
    lockedUntil: number | null;
  } | null>(null);
  const [primaryDemotionBlocked, setPrimaryDemotionBlocked] = useState<Person | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setHydrated(true);
    refresh();
    setEntitlements(parseMockEntitlements(readCookie(MOCK_ENTITLEMENT_COOKIE)));
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = createSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
        setAuthed(!!session?.user),
      );
      return () => sub.subscription.unsubscribe();
    }
    setAuthed(false); // env missing → treat as not logged in (gate active in dev)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function refresh() {
    const list = loadPeople();
    setPeople(list);
    if (typeof window !== "undefined") {
      const sel = localStorage.getItem("sajubara:selectedId");
      setSelected(sel ?? list[0]?.id ?? null);
    }
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setSelected(id);
    // Also sync legacy keys (so result/home pages pick it up)
    const target = people.find((p) => p.id === id);
    if (target && typeof window !== "undefined") {
      localStorage.setItem("sajubara:lastSajuCardId", target.cardId);
      localStorage.setItem("sajubara:lastSajuInput", JSON.stringify(target.input));
    }
  }

  function handleDelete(id: string) {
    if (!confirm("이 사주 정보를 삭제할까요?")) return;
    removePerson(id);
    refresh();
  }

  function handleDeleteAll() {
    if (!confirm("모든 사주 정보를 삭제할까요?")) return;
    if (typeof window !== "undefined") {
      localStorage.removeItem("sajubara:people");
      localStorage.removeItem("sajubara:selectedId");
      localStorage.removeItem("sajubara:lastSajuCardId");
      localStorage.removeItem("sajubara:lastSajuInput");
    }
    refresh();
  }

  function handleRelationChange(person: Person, relation: Relation) {
    if (person.relation === "본인" && relation !== "본인") {
      setRelationTarget(null);
      setPrimaryDemotionBlocked(person);
      return;
    }

    if (relation !== "본인") {
      updateRelation(person.id, relation);
      setRelationTarget(null);
      refresh();
      return;
    }

    const list = loadPeople();
    const currentPrimary = list.find(
      (candidate) => candidate.relation === "본인" && candidate.id !== person.id,
    );

    if (!currentPrimary) {
      setPrimaryPerson(person.id);
      setRelationTarget(null);
      refresh();
      return;
    }

    const changeStatus = getPrimaryChangeStatus();
    setPrimaryConfirm({
      target: person,
      current: currentPrimary,
      lockedUntil: changeStatus.canChange ? null : changeStatus.nextAllowedAt,
    });
  }

  function handleConfirmPrimaryChange(demoteRelation: SecondaryRelation) {
    if (!primaryConfirm || primaryConfirm.lockedUntil) return;
    setPrimaryPerson(primaryConfirm.target.id, demoteRelation);
    recordPrimaryChange();
    setRelationTarget(null);
    setPrimaryConfirm(null);
    refresh();
  }

  return (
    <>
      <header
        className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0"
        style={{
          background: "rgba(255, 248, 232, 0.88)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid var(--sb-hairline)",
        }}
      >
        <Link
          href="/"
          className="h-9 w-9 rounded-full bg-sb-paper flex items-center justify-center"
          style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          aria-label="뒤로"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M8 2L4 6L8 10"
              stroke="var(--sb-ink-2)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <span className="text-[15px] font-extrabold text-sb-olive-dark tracking-tight">
          사주 정보 관리
        </span>
        <Link
          href={people.length > 0 ? "/saju?mode=add-person" : "/saju"}
          className="h-9 w-9 rounded-full bg-sb-paper flex items-center justify-center"
          style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          aria-label="새 사주 추가"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 2v10M2 7h10" stroke="var(--sb-ink-2)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <p className="text-[12px] text-sb-ink-3 leading-relaxed mb-4 px-1">
          추가한 다른 사람 정보는 사주, 궁합, 대운 등에서 활용할 수 있어요.{" "}
          <strong className="text-sb-ink-2">선택된 사람</strong>이 결과 페이지·홈에 반영됩니다.
        </p>

        {!hydrated ? (
          <div
            className="bg-sb-paper rounded-sb-lg px-4 py-6 text-center text-[13px] text-sb-ink-3"
            style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
          >
            불러오는 중…
          </div>
        ) : people.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2.5">
            {people.map((person, idx) => (
              <PersonRow
                key={person.id}
                person={person}
                selected={selectedId === person.id}
                locked={idx > 0 && !hasPaidReportForPerson(person, entitlements)}
                paid={hasPaidReportForPerson(person, entitlements)}
                onSelect={() => handleSelect(person.id)}
                onEditRelation={() => setRelationTarget(person)}
                onDelete={() => handleDelete(person.id)}
              />
            ))}
            <AddPersonCTA peopleCount={people.length} authed={authed} />

            {people.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAll}
                className="text-[12px] text-sb-ink-3 underline mt-4 mx-auto py-2"
              >
                전체 삭제
              </button>
            )}
          </div>
        )}
      </div>

      {relationTarget && (
        <RelationSheet
          person={relationTarget}
          onClose={() => setRelationTarget(null)}
          onSelect={(relation) => handleRelationChange(relationTarget, relation)}
        />
      )}

      {primaryConfirm && (
        <PrimaryChangeDialog
          current={primaryConfirm.current}
          target={primaryConfirm.target}
          lockedUntil={primaryConfirm.lockedUntil}
          onCancel={() => setPrimaryConfirm(null)}
          onConfirm={handleConfirmPrimaryChange}
        />
      )}

      {primaryDemotionBlocked && (
        <PrimaryDemotionBlockedDialog
          person={primaryDemotionBlocked}
          onClose={() => setPrimaryDemotionBlocked(null)}
        />
      )}
    </>
  );
}

function AddPersonCTA({
  peopleCount,
  authed,
}: {
  peopleCount: number;
  authed: boolean | null;
}) {
  // 0명: 본인 등록 (로그인 X)
  // 1명+: 로그인 필요. 로그인 안 됐으면 /login으로, 됐으면 /saju로
  const needsAuth = peopleCount >= 1;
  const showLoginGate = needsAuth && authed === false;

  if (authed === null) {
    return (
      <div
        className="mt-2 rounded-sb-lg bg-sb-paper text-sb-ink-3 text-[13px] py-3.5 text-center"
        style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
      >
        준비 중…
      </div>
    );
  }

  if (showLoginGate) {
    return (
      <Link
        href="/login?next=%2Fsaju%3Fmode%3Dadd-person"
        className="mt-2 rounded-sb-lg text-sb-olive-dark text-[13.5px] font-extrabold py-3.5 text-center flex items-center justify-center gap-1.5"
        style={{
          background:
            "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 60%, var(--sb-yuzu-dark))",
          boxShadow: "var(--shadow-sb-pop)",
        }}
      >
        🔒 로그인하고 다른 사람 추가하기
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path
            d="M3.5 2L6.5 5L3.5 8"
            stroke="var(--sb-olive-dark)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    );
  }

  return (
    <Link
      href={peopleCount === 0 ? "/saju" : "/saju?mode=add-person"}
      className="mt-2 rounded-sb-lg bg-sb-paper text-sb-olive-dark text-[13.5px] font-extrabold py-3.5 text-center flex items-center justify-center gap-1.5"
      style={{
        boxShadow: "inset 0 0 0 1.5px var(--sb-olive)",
        border: "1.5px dashed transparent",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M7 2v10M2 7h10"
          stroke="var(--sb-olive-dark)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      {peopleCount === 0 ? "내 사주 등록하기" : "다른 사람 사주 추가하기"}
    </Link>
  );
}

function PersonRow({
  person,
  selected,
  locked,
  paid,
  onSelect,
  onEditRelation,
  onDelete,
}: {
  person: Person;
  selected: boolean;
  locked: boolean;
  paid: boolean;
  onSelect: () => void;
  onEditRelation: () => void;
  onDelete: () => void;
}) {
  const card = cardById(person.cardId);
  const written = isCardWritten(card);
  const colorWord = ELEMENT_COLOR_KR[card?.element ?? "earth"];
  const branchEmoji = BRANCH_EMOJI[card?.branch ?? "rat"];
  const branchLabel = BRANCH_LABEL_KR[card?.branch ?? "rat"];

  return (
    <article
      className={`relative bg-sb-paper rounded-sb-lg px-3.5 py-3 flex items-center gap-3 ${
        locked ? "opacity-80" : ""
      }`}
      style={{
        boxShadow: selected
          ? "var(--shadow-sb-card), inset 0 0 0 1.5px var(--sb-olive)"
          : "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
        style={{
          border: selected ? "2px solid var(--sb-olive)" : "1.5px solid var(--sb-ink-3)",
        }}
        aria-label="선택"
      >
        {selected && (
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "var(--sb-olive)" }}
          />
        )}
      </button>

      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-[20px] shrink-0 overflow-hidden"
        style={{ background: "var(--sb-cream)" }}
        aria-hidden
      >
        {card?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.image} alt="" className="w-full h-full object-cover" />
        ) : (
          branchEmoji
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-extrabold text-sb-ink tracking-tight">
            {person.input.name}
          </span>
          <span className="text-[11px] font-semibold text-sb-ink-3">
            ({person.input.gender}/{person.relation})
          </span>
          {person.relation === "본인" && (
            <span
              className="rounded-full px-1.5 py-[2px] text-[9px] font-extrabold"
              style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
            >
              대표
            </span>
          )}
        </div>
        <div className="text-[11.5px] text-sb-ink-3 mt-0.5">
          {person.input.birthDate.replace(/-/g, ". ")} · {written ? card?.nickname : `${colorWord} ${branchLabel}`}
        </div>
        <button
          type="button"
          onClick={onEditRelation}
          className="mt-1.5 inline-flex rounded-full px-2 py-1 text-[10.5px] font-extrabold text-sb-olive-dark"
          style={{
            background: "rgba(92,110,62,0.08)",
            boxShadow: "inset 0 0 0 1px rgba(92,110,62,0.12)",
          }}
        >
          관계 수정
        </button>
        {(locked || paid) && (
          <div className="mt-1.5">
            <span
              className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-[2px] rounded-full"
              style={{
                background: paid ? "rgba(92,110,62,0.12)" : "var(--sb-cream)",
                color: paid ? "var(--sb-olive-dark)" : "var(--sb-terra-dark)",
              }}
            >
              {paid ? "🔓 구매완료" : "🔒 990원 잠금 (한 번 결제)"}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ color: "var(--sb-ink-3)" }}
        aria-label="삭제"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="6" stroke="var(--sb-ink-3)" strokeWidth="1.4" fill="none" />
          <path d="M4 7h6" stroke="var(--sb-ink-3)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </article>
  );
}

function RelationSheet({
  person,
  onClose,
  onSelect,
}: {
  person: Person;
  onClose: () => void;
  onSelect: (relation: Relation) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/28 px-3 pb-3">
      <button
        type="button"
        aria-label="관계 수정 닫기"
        className="absolute inset-0"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${person.input.name}님 관계 수정`}
        className="relative w-full max-w-[430px] rounded-sb-xl bg-sb-paper px-4 pt-4 pb-4"
        style={{ boxShadow: "var(--shadow-sb-pop)" }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold tracking-wider text-sb-olive-light uppercase">
              관계 수정
            </div>
            <h2 className="mt-1 text-[18px] font-extrabold tracking-tight text-sb-ink">
              {person.input.name}님은 어떤 관계인가요?
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-sb-ink-3">
              이름·관계·출생시간은 가볍게 수정할 수 있어요. 단, 본인은 대표 사주와 연결됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 shrink-0 rounded-full bg-sb-cream text-[18px] font-bold text-sb-ink-3"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {RELATION_OPTIONS.map((relation) => {
            const active = person.relation === relation;
            const isPrimary = relation === "본인";
            return (
              <button
                key={relation}
                type="button"
                onClick={() => onSelect(relation)}
                className="rounded-sb-md px-3 py-3 text-left"
                style={{
                  background: active ? "var(--sb-olive)" : "rgba(255,255,255,0.72)",
                  color: active ? "white" : "var(--sb-ink)",
                  boxShadow: active
                    ? "0 4px 12px rgba(92,110,62,0.24)"
                    : "inset 0 0 0 1px var(--sb-hairline)",
                }}
              >
                <span className="block text-[14px] font-extrabold">{relation}</span>
                <span
                  className="mt-0.5 block text-[10.5px] font-semibold"
                  style={{ color: active ? "rgba(255,255,255,0.78)" : "var(--sb-ink-3)" }}
                >
                  {isPrimary ? "대표 사주로 사용" : "추가 사주로 관리"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PrimaryChangeDialog({
  current,
  target,
  lockedUntil,
  onCancel,
  onConfirm,
}: {
  current: Person;
  target: Person;
  lockedUntil: number | null;
  onCancel: () => void;
  onConfirm: (demoteRelation: SecondaryRelation) => void;
}) {
  const [demoteRelation, setDemoteRelation] = useState<SecondaryRelation>("기타");
  const locked = lockedUntil !== null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/34 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="대표 사주 변경 확인"
        className="w-full max-w-[390px] rounded-sb-xl bg-sb-paper px-5 py-5"
        style={{ boxShadow: "var(--shadow-sb-pop)" }}
      >
        <div className="text-[11px] font-extrabold tracking-wider text-sb-terra-dark uppercase">
          대표 사주 변경
        </div>
        <h2 className="mt-2 text-[19px] font-extrabold leading-snug tracking-tight text-sb-ink">
          이미 내 사주가 등록되어 있어요
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-sb-ink-2">
          현재 대표 사주는 <strong>{current.input.name}</strong>님입니다.{" "}
          <strong>{target.input.name}</strong>님을 본인으로 바꾸려면 대표 사주 변경이 필요해요.
        </p>

        {locked ? (
          <div
            className="mt-4 rounded-sb-md px-3 py-3 text-[12.5px] font-semibold leading-relaxed text-sb-terra-dark"
            style={{ background: "rgba(184,112,75,0.12)" }}
          >
            대표 사주는 30일에 한 번만 바꿀 수 있어요. 다음 변경 가능일은{" "}
            <strong>{formatKstDate(lockedUntil)}</strong>입니다.
          </div>
        ) : (
          <>
            <div
              className="mt-4 rounded-sb-md px-3 py-3 text-[12.5px] leading-relaxed text-sb-ink-2"
              style={{ background: "var(--sb-cream)" }}
            >
              변경하면 {target.input.name}님이 대표 사주가 되고, 기존 대표였던{" "}
              {current.input.name}님의 관계는 아래 선택값으로 바뀝니다.
            </div>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-[11px] font-extrabold text-sb-olive-light">
                기존 대표의 새 관계
              </span>
              <select
                value={demoteRelation}
                onChange={(event) => setDemoteRelation(event.target.value as SecondaryRelation)}
                className="w-full rounded-sb-md bg-white px-3 py-3 text-[13px] font-bold text-sb-ink outline-none"
                style={{
                  boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%238B7758' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                  appearance: "none",
                  paddingRight: 36,
                }}
              >
                {SECONDARY_RELATION_OPTIONS.map((relation) => (
                  <option key={relation} value={relation}>
                    {relation}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-sb-cream py-3 text-[13px] font-extrabold text-sb-ink-2"
          >
            취소
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => onConfirm(demoteRelation)}
            className="rounded-full py-3 text-[13px] font-extrabold disabled:opacity-45"
            style={{
              background: "var(--sb-olive)",
              color: "white",
              boxShadow: locked ? undefined : "0 4px 12px rgba(92,110,62,0.24)",
            }}
          >
            대표 변경하기
          </button>
        </div>
      </section>
    </div>
  );
}

function PrimaryDemotionBlockedDialog({
  person,
  onClose,
}: {
  person: Person;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/34 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="대표 사주 해제 안내"
        className="w-full max-w-[380px] rounded-sb-xl bg-sb-paper px-5 py-5"
        style={{ boxShadow: "var(--shadow-sb-pop)" }}
      >
        <div className="text-[11px] font-extrabold tracking-wider text-sb-terra-dark uppercase">
          대표 사주 보호
        </div>
        <h2 className="mt-2 text-[19px] font-extrabold leading-snug tracking-tight text-sb-ink">
          대표 사주는 바로 해제할 수 없어요
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-sb-ink-2">
          {person.input.name}님은 현재 본인/대표 사주입니다. 대표 사주가 비면 오늘의 운세와
          보관함 기준이 흔들릴 수 있어서, 다른 사람을 <strong>본인</strong>으로 바꾸는
          대표 변경 절차에서 함께 처리해 주세요.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full py-3 text-[13px] font-extrabold text-white"
          style={{
            background: "var(--sb-olive)",
            boxShadow: "0 4px 12px rgba(92,110,62,0.24)",
          }}
        >
          확인
        </button>
      </section>
    </div>
  );
}

function hasPaidReportForPerson(person: Person, entitlements: MockEntitlements): boolean {
  const personKey = sajuPersonKey(person.input);
  const year = currentKstYear();
  if (
    isScopeUnlocked(entitlements, { product: "saju", personKey }) ||
    isScopeUnlocked(entitlements, { product: "daewoon", period: "current", personKey }) ||
    isScopeUnlocked(entitlements, { product: "yearly", year, personKey })
  ) {
    return true;
  }

  return entitlements.scopes.some(
    (scope) =>
      scope === "all" ||
      scope === `saju:${personKey}` ||
      scope.startsWith(`daewoon:${personKey}:`) ||
      scope.startsWith(`yearly:${personKey}:`),
  );
}

function formatKstDate(value: number): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
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

function EmptyState() {
  return (
    <div
      className="bg-sb-paper rounded-sb-lg px-5 py-7 text-center"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="text-[40px] mb-2">🌿</div>
      <h3 className="text-[15px] font-extrabold text-sb-ink mb-1.5 tracking-tight">
        아직 저장된 사주가 없어요
      </h3>
      <p className="text-[12.5px] text-sb-ink-2 leading-relaxed mb-4">
        본인 사주부터 등록해 보세요.
      </p>
      <Link
        href="/saju"
        className="inline-flex items-center gap-1.5 rounded-full bg-sb-olive text-white text-[12.5px] font-bold px-4 py-2.5"
        style={{ boxShadow: "0 2px 6px rgba(92,110,62,0.3)" }}
      >
        내 사주 등록하기
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
