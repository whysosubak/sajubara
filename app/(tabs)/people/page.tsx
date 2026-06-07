"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/app/components/LanguageProvider";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import type { TranslationKey } from "@/app/i18n";
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
  BRANCH_LABEL_EN,
  BRANCH_LABEL_KR,
  ELEMENT_COLOR_EN,
  ELEMENT_COLOR_KR,
} from "@/lib/bara/types";
import { currentKstYear } from "@/lib/saju/report-links";
import { sajuPersonKey } from "@/lib/saju/scope";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const RELATION_LABEL_KEYS: Record<Relation, TranslationKey> = {
  본인: "saju.relation.self",
  배우자: "saju.relation.spouse",
  연인: "saju.relation.partner",
  가족: "saju.relation.family",
  친구: "saju.relation.friend",
  지인: "saju.relation.acquaintance",
  기타: "saju.relation.other",
};

const GENDER_LABEL_KEYS = {
  여: "saju.gender.female",
  남: "saju.gender.male",
} satisfies Record<string, TranslationKey>;

export default function PeoplePage() {
  const { t } = useI18n();
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
      supabase.auth
        .getUser()
        .then(({ data }) => setAuthed(!!data.user))
        .catch(() => setAuthed(false));
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
    if (!confirm(t("people.deleteConfirm"))) return;
    removePerson(id);
    refresh();
  }

  function handleDeleteAll() {
    if (!confirm(t("people.deleteAllConfirm"))) return;
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
          aria-label={t("common.back")}
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
          {t("people.title")}
        </span>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher compact />
          <Link
            href={people.length > 0 ? "/saju?mode=add-person" : "/saju"}
            className="h-9 w-9 rounded-full bg-sb-paper flex items-center justify-center"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
            aria-label={t("people.addAria")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 2v10M2 7h10"
                stroke="var(--sb-ink-2)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <p className="text-[12px] text-sb-ink-3 leading-relaxed mb-4 px-1">
          {t("people.descriptionPrefix")}{" "}
          <strong className="text-sb-ink-2">{t("people.descriptionStrong")}</strong>
          {t("people.descriptionSuffix")}
        </p>

        {!hydrated ? (
          <div
            className="bg-sb-paper rounded-sb-lg px-4 py-6 text-center text-[13px] text-sb-ink-3"
            style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
          >
            {t("common.loading")}
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
                {t("people.deleteAll")}
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
  const { t } = useI18n();
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
        {t("people.ready")}
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
        🔒 {t("people.addAfterLogin")}
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
      {peopleCount === 0 ? t("people.addMine") : t("people.addOther")}
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
  const { locale, t } = useI18n();
  const card = cardById(person.cardId);
  const written = isCardWritten(card);
  const colorWord = locale === "ko"
    ? ELEMENT_COLOR_KR[card?.element ?? "earth"]
    : ELEMENT_COLOR_EN[card?.element ?? "earth"];
  const branchEmoji = BRANCH_EMOJI[card?.branch ?? "rat"];
  const branchLabel = locale === "ko"
    ? BRANCH_LABEL_KR[card?.branch ?? "rat"]
    : BRANCH_LABEL_EN[card?.branch ?? "rat"];
  const cardLabel = locale === "ko" && written
    ? card?.nickname
    : `${colorWord} ${branchLabel}`;

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
        aria-label={t("people.selectAria")}
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
            ({t(GENDER_LABEL_KEYS[person.input.gender])}/{t(RELATION_LABEL_KEYS[person.relation])})
          </span>
          {person.relation === "본인" && (
            <span
              className="rounded-full px-1.5 py-[2px] text-[9px] font-extrabold"
              style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
            >
              {t("people.primaryBadge")}
            </span>
          )}
        </div>
        <div className="text-[11.5px] text-sb-ink-3 mt-0.5">
          {person.input.birthDate.replace(/-/g, ". ")} · {cardLabel}
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
          {t("people.editRelation")}
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
              {paid ? `🔓 ${t("people.purchased")}` : `🔒 ${t("people.lockedOnce")}`}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ color: "var(--sb-ink-3)" }}
        aria-label={t("people.deleteAria")}
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
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/28 px-3 pb-3">
      <button
        type="button"
        aria-label={t("people.close")}
        className="absolute inset-0"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("people.sheetQuestion", { name: person.input.name })}
        className="relative w-full max-w-[430px] rounded-sb-xl bg-sb-paper px-4 pt-4 pb-4"
        style={{ boxShadow: "var(--shadow-sb-pop)" }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold tracking-wider text-sb-olive-light uppercase">
              {t("people.sheetTitle")}
            </div>
            <h2 className="mt-1 text-[18px] font-extrabold tracking-tight text-sb-ink">
              {t("people.sheetQuestion", { name: person.input.name })}
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-sb-ink-3">
              {t("people.sheetBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 shrink-0 rounded-full bg-sb-cream text-[18px] font-bold text-sb-ink-3"
            aria-label={t("people.close")}
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
                <span className="block text-[14px] font-extrabold">
                  {t(RELATION_LABEL_KEYS[relation])}
                </span>
                <span
                  className="mt-0.5 block text-[10.5px] font-semibold"
                  style={{ color: active ? "rgba(255,255,255,0.78)" : "var(--sb-ink-3)" }}
                >
                  {isPrimary ? t("people.sheetPrimaryHint") : t("people.sheetSecondaryHint")}
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
  const { locale, t } = useI18n();
  const [demoteRelation, setDemoteRelation] = useState<SecondaryRelation>("기타");
  const locked = lockedUntil !== null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/34 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("people.primaryChange")}
        className="w-full max-w-[390px] rounded-sb-xl bg-sb-paper px-5 py-5"
        style={{ boxShadow: "var(--shadow-sb-pop)" }}
      >
        <div className="text-[11px] font-extrabold tracking-wider text-sb-terra-dark uppercase">
          {t("people.primaryChange")}
        </div>
        <h2 className="mt-2 text-[19px] font-extrabold leading-snug tracking-tight text-sb-ink">
          {t("people.primaryChangeTitle")}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-sb-ink-2">
          {t("people.primaryChangeBody", {
            current: current.input.name,
            target: target.input.name,
          })}
        </p>

        {locked ? (
          <div
            className="mt-4 rounded-sb-md px-3 py-3 text-[12.5px] font-semibold leading-relaxed text-sb-terra-dark"
            style={{ background: "rgba(184,112,75,0.12)" }}
          >
            {t("people.primaryLocked", { date: formatKstDate(lockedUntil, locale) })}
          </div>
        ) : (
          <>
            <div
              className="mt-4 rounded-sb-md px-3 py-3 text-[12.5px] leading-relaxed text-sb-ink-2"
              style={{ background: "var(--sb-cream)" }}
            >
              {t("people.primaryChangeNotice", {
                target: target.input.name,
                current: current.input.name,
              })}
            </div>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-[11px] font-extrabold text-sb-olive-light">
                {t("people.demoteLabel")}
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
                    {t(RELATION_LABEL_KEYS[relation])}
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
            {t("people.cancel")}
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
            {t("people.confirmPrimary")}
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
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/34 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("people.primaryProtected")}
        className="w-full max-w-[380px] rounded-sb-xl bg-sb-paper px-5 py-5"
        style={{ boxShadow: "var(--shadow-sb-pop)" }}
      >
        <div className="text-[11px] font-extrabold tracking-wider text-sb-terra-dark uppercase">
          {t("people.primaryProtected")}
        </div>
        <h2 className="mt-2 text-[19px] font-extrabold leading-snug tracking-tight text-sb-ink">
          {t("people.primaryProtectedTitle")}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-sb-ink-2">
          {t("people.primaryProtectedBody", { name: person.input.name })}
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
          {t("people.ok")}
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

function formatKstDate(value: number, locale: "ko" | "en"): string {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
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
  const { t } = useI18n();

  return (
    <div
      className="bg-sb-paper rounded-sb-lg px-5 py-7 text-center"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="text-[40px] mb-2">🌿</div>
      <h3 className="text-[15px] font-extrabold text-sb-ink mb-1.5 tracking-tight">
        {t("people.emptyTitle")}
      </h3>
      <p className="text-[12.5px] text-sb-ink-2 leading-relaxed mb-4">
        {t("people.emptyBody")}
      </p>
      <Link
        href="/saju"
        className="inline-flex items-center gap-1.5 rounded-full bg-sb-olive text-white text-[12.5px] font-bold px-4 py-2.5"
        style={{ boxShadow: "0 2px 6px rgba(92,110,62,0.3)" }}
      >
        {t("people.addMine")}
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
