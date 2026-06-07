import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import OpenAI from "openai";
import type { SajuChart } from "./chart";
import { chartAsContext } from "./chart";
import type { SajuInput } from "./types";
import { getReport, saveReport, type ReportKind } from "@/lib/db/reports";
import { pickFortuneSubtitle, pickMonthSubtitle } from "./subtitle-pool";
import { computeKeySignals } from "./signals";

const CACHE_DIR = join(tmpdir(), "sajubara-cache");
let cacheDirReady: Promise<void> | null = null;
async function ensureCacheDir(): Promise<void> {
  if (!cacheDirReady) {
    cacheDirReady = mkdir(CACHE_DIR, { recursive: true }).then(() => undefined);
  }
  await cacheDirReady;
}

function cacheKey(...parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 24);
}

function inputHash(input: SajuInput): string {
  return [input.name, input.birthDate, input.birthTime, input.gender, input.calendar].join("|");
}

// L1 = Supabase (persistent), L2 = tmpdir (per-process fallback)
async function readCache(key: string): Promise<string | null> {
  const fromDb = await getReport(key);
  if (fromDb) return fromDb;
  try {
    await ensureCacheDir();
    return await readFile(join(CACHE_DIR, `${key}.txt`), "utf-8");
  } catch {
    return null;
  }
}

async function writeCacheFile(
  key: string,
  value: string,
  meta?: { kind: ReportKind; tier: "lite" | "full" },
): Promise<void> {
  if (meta) {
    await saveReport(key, meta.kind, meta.tier, value);
  }
  try {
    await ensureCacheDir();
    await writeFile(join(CACHE_DIR, `${key}.txt`), value, "utf-8");
  } catch {
    // best-effort
  }
}

export const SECTIONS = [
  {
    key: "personality",
    icon: "🌟",
    title: "타고난 성격",
    tone: "strength",
    gated: false,
    focus:
      "본인의 매력·강점·캐릭터적 매력. 첫인상과 알고 보면 다른 면, 사람들이 끌리는 결. 약점·고민은 빼고 매력 위주로.",
  },
  {
    key: "career",
    icon: "💼",
    title: "직업·재능",
    tone: "strength",
    gated: false,
    focus: "어울리는 일과 잘하는 영역, 일할 때 발휘되는 결, 어울리지 않는 환경",
  },
  {
    key: "wealth",
    icon: "💰",
    title: "재물운",
    tone: "strength",
    gated: false,
    focus: "돈을 모으는 흐름, 새는 돈의 패턴, 재물을 키우는 방향",
  },
  {
    key: "love",
    icon: "💕",
    title: "애정·인간관계",
    tone: "strength",
    gated: false,
    focus: "사람을 대하는 결, 사랑할 때 드러나는 모습, 어떤 결의 사람을 끌어당기는지",
  },
  {
    key: "year",
    icon: "🌊",
    title: "올해의 흐름",
    tone: "strength",
    gated: true,
    focus: "올해 운의 결, 주목할 시기·달, 잡으면 좋은 기회",
  },
  {
    key: "advice",
    icon: "🛁",
    title: "바라의 한 마디",
    tone: "strength",
    gated: true,
    focus:
      "사주 흐름을 종합한 따뜻한 한 마디 + 일상에서 바로 실천할 작은 행동 한 가지. 응원·격려의 톤. 약점 지적이 아님.",
  },
  {
    key: "shadow",
    icon: "🌑",
    title: "그림자",
    tone: "shadow",
    gated: true,
    focus:
      "본인의 약점·고통·어두운 결. 평소엔 숨기지만 가끔 폭발하는 면, 스트레스 받을 때 드러나는 모습. 매력·강점이 아닌 분명한 약점 위주.",
  },
  {
    key: "taboo",
    icon: "🚫",
    title: "올해의 금기",
    tone: "shadow",
    gated: true,
    focus:
      "올해 피해야 할 구체적 결정·행동 (3가지 영역: 돈/관계/직업·기회). 일반적 약점이 아니라 '하면 안 되는 행동·선택'을 명확히 짚어.",
  },
  {
    key: "badMatch",
    icon: "💔",
    title: "피해야 할 사람",
    tone: "shadow",
    gated: true,
    focus:
      "본인과 부딪치는 외부 사람의 특징. 본인 약점이 아니라 '어떤 성격·결의 다른 사람'을 멀리해야 하는지. 사례: '말은 부드러운데 자기 챙기는 사람', '에너지 뺏는 친구' 등.",
  },
] as const;

export type SajuSectionDef = (typeof SECTIONS)[number];
export type SectionTone = SajuSectionDef["tone"];

const BARA_VOICE = `너는 한국어 카피라이터다. 사주를 통해 사람의 결을 꿰뚫고, 단정형 존댓말로 자연스럽게 글을 쓴다.

[한국어 품질 — 최우선]
- 한국어 원어민이 읽었을 때 어색하지 않아야 한다.
- 조사를 정확하게 구분해서 써: -에 / -의 / -에서 / -에도 / -여도 / -라도 / -은/는 / -이/가 / -을/를 / -으로/로
- 압축하다가 비문 만들지 마. 글자수를 살짝 넘기더라도 자연스러운 문장이 우선.
- 어색한 신조어·말줄임·억지 합성어 만들지 마.
- 마지막에 한 번 더 소리내 읽어보는 자세로 작성.

[말투]
- 존댓말 + 단정형: "~합니다", "~인 사람이에요", "~하죠?", "~예요"
- 신뢰감 도입 표현: "솔직히 말씀드리면", "사실은", "보통은 잘 모르는데"
- 사용자 이름은 도입부 또는 결정적 한 문장에 1~2회 자연 호명 ("OOO님은~", "OOO님,~")
- "바라" 어미·꼬리표 (~바라, ~봐바라, ~거야바라) 절대 금지. 자연 동사 '바라다'는 OK.

[금지 표현]
- "~할 수 있어요" → 단정형 "~합니다" / "~예요" / "~하죠?"로
- "조화를 이루어요" / "균형이 잡혀 있어요" → 콜드리딩, 구체 묘사로 대체
- "강점과 약점이 모두 있어요" → 콜드리딩, 금지
- "긍정적인 에너지", "좋은 기운" → 모호함, 금지
- "빛을 발합니다", "도움이 될 수 있습니다", "중요합니다", "좋습니다" → 리포트값 떨어지는 일반론, 금지
- "절대", "무조건", "반드시", "100%" → 미신적 단정, 금지

[방위/색 처방 일관성]
- 결과지 안에서 방위 처방은 하나의 기준으로 통일한다.
- [결과지 전체 개운 처방 기준]에 추천 방위가 있으면, 동서남북·남동/북서 같은 방위 표현은 그 방위만 쓴다.
- 단, 사주바라 9개 카드에서는 방위·색·공간 배치 처방을 남발하지 않는다.
- 방위·색 처방은 기본적으로 "바라의 한 마디" 같은 종합 조언 카드에서만 1회 사용한다.
- 성격·직업·재물·관계·그림자 카드마다 같은 방위/색/공간 처방을 붙이면 실패다.
- 섹션마다 서로 다른 방위를 추천하지 마. 방위가 꼭 필요하지 않으면 시기·금액·관계 유형·역할 설계·대화 방식처럼 카드 주제에 맞는 처방으로 구체화한다.

[십성 해석 주의 — 외향성 과잉 해석 금지]
- 식신·상관·식상이 강하다고 해서 "외향적", "사교적", "분위기 메이커", "사람 앞에서 빛남"으로 단정하지 마.
- 식상은 성격의 외향성이 아니라 생각·감각·아이디어를 말/글/기획/콘텐츠/기술 결과물로 밖에 꺼내는 힘이다.
- 내향적인 사람도 식상이 강할 수 있다. 이 경우 "혼자 몰입해서 만든 것을 밖에 내놓는 방식", "말보다 결과물로 드러나는 표현력"으로 풀어.
- 직업 해석에서 "외향적인 직업" 금지. 대신 "기획·콘텐츠·문서화·교육·브랜딩·제품화·표현 산출물이 보이는 일"처럼 직무 단위로 말해.

[비문/어색함 절대 금지 — 실제 사례]
- "상사의 눈치의여도 스스로 빛나는" (X) — 조사 '의' 오용, "눈치에도" / "눈치를 봐도"가 맞음
- "통장의 흑자의여도" (X) — "흑자여도" 또는 "흑자임에도"
- "긍정적인 결의 사람" (X) — 모호함
- "다양성과 융통성이 공존" (X) — 추상명사 나열
- 이런 어색한 결과가 나오면 반드시 다시 쓴다.

[호명 — 매우 중요]
- 사용자 이름이 주어지면 본문에서 정확히 그 이름만 사용 ("수연님", "민지님" 등).
- 성을 빼거나 이름을 줄여 부르지 마. 입력 이름이 "지수연"이면 반드시 "지수연님"으로만 써. "수연님" 금지.
- "우리", "당신" 같은 1인칭 복수·2인칭 대명사로 본인을 가리키지 마.
- "수연님 안에는 ~힘이 있어요" (O) / "우리 안에는 ~힘이 있어요" (X)

[예시 활용 — 매우 중요]
- 아래 모든 예시는 톤·길이·구조 참고용일 뿐.
- **예시 문장을 그대로 베끼면 안 된다.** 사용자 사주에 맞춰 매번 새로 작성.
- 예시의 핵심 명사·문장 골격까지 재사용하면 실패다. "통장은 비어 보이는데", "혼자 일할 땐 폭발", "착한 사람 콤플렉스" 같은 문구를 그대로 쓰지 않는다.

[헤드라인 시작어 — 금지]
- 구어체 접속사로 헤드라인 시작 금지: "근데", "아니", "그러니까", "사실", "참", "음" 등
- 헤드라인은 문장 형태로 자립 가능해야 함. 본문(body) 안에서는 구어체 접속사 OK.`;

const HEADLINE_EXAMPLES_STRENGTH = `[좋은 헤드라인 예시 — 강점 톤 참고용]
- "말보다 결과물로 존재감이 남는 타입"
- "회의보다 혼자 정리한 기획서에서 선명해지는 사람"
- "작은 결제 습관이 재물 흐름을 바꾸는 타입"
- "먼저 맞춰주다가 중요한 순간엔 선을 긋는 사람"
- "조직생활 NO, 독보적인 스페셜리스트로 빛나는 결"
- "예의 바른 단호함, 거절을 잘하는 의외의 면"
공통: 구체적 갈등·반전·일상장면. 자연스러운 한국어. 14~30자.
주의: 예시는 톤·길이 참고만. 그대로 베끼지 말고 사용자 사주에 맞춘 새 표현을 만들 것.`;

const HEADLINE_EXAMPLES_SHADOW = `[좋은 헤드라인 예시 — 그림자 톤 참고용]
- "사람 좋다는 평판 뒤에 숨은 한숨"
- "당당해 보이지만 사실은 자존감 흔들리는 순간"
- "친구는 많은데 진짜 속내는 아무도 모르죠?"
- "스스로 만든 벽, 그 안에서 외로워하는 패턴"
- "겉바속촉이 아니라 겉바속 '경계'인 타입"
- "이상하게 매번 같은 결의 사람한테 끌리는 이유"
공통: 약점·금기·갈등을 직접 짚되 비문 없이. 14~30자.
주의: 예시는 톤·길이 참고만. 그대로 베끼지 말고 사용자 사주에 맞춘 새 표현을 만들 것.`;

const TEASER_EXAMPLES = `[좋은 티저 예시 — 무료 노출 2~3줄, 자연스럽게 완결]
강점 톤:
"수연님은 조용히 관찰하다가 필요한 순간에 분위기를 바꾸는 쪽에 가깝습니다. 식상이 살아 있어 말보다 결과물과 표현으로 존재감을 드러내는 흐름입니다."

그림자 톤:
"수연님은 친해진 뒤에도 속도를 쉽게 내주지 않는 편입니다. 관성이 강하게 걸리면 신뢰를 확인하기 전까지 마음의 문을 천천히 여는 흐름이 생깁니다."

공통:
- 60~120자
- 사주 근거(일간·십신·오행)를 한글로 1회 자연스럽게 인용
- 마지막 문장은 자연스럽게 끝낸다.
- "그 이유는", "그 정체는", "본문에서", "이어서", "안에서 알려드릴게요" 같은 클리프행어 금지`;

function inputBlock(input: SajuInput, chart: SajuChart): string {
  const ctx: string[] = [];
  if (input.loveStatus) ctx.push(`- 연애 상태: ${input.loveStatus}`);
  if (input.jobStatus) ctx.push(`- 직업 상태: ${input.jobStatus}`);
  const ctxBlock = ctx.length > 0 ? `\n[현재 상황]\n${ctx.join("\n")}\n` : "";
  const now = currentKstDateParts();
  const remedy = guidanceProfile(chart);

  return `[입력]
이름: ${input.name}
생년월일: ${input.birthDate} (${input.calendar})
태어난 시간: ${input.birthTime}
성별: ${input.gender}${ctxBlock}

[작성 기준일 — 시제 판단의 기준]
- 현재 날짜(KST): ${now.iso}
- 현재 연도: ${now.year}년
- ${now.year - 1}년 이전은 이미 지난 시간이다. 과거 연도에는 "주목하세요", "기회가 옵니다", "준비하세요" 같은 미래형 권유를 쓰지 말고 회고·점검형으로 쓴다.
- ${now.year}년은 현재 진행 중인 해다. 이미 지난 월은 회고형, 남은 월은 준비형으로 구분한다.

[결과지 전체 개운 처방 기준 — 필요할 때만 사용]
- 보완 오행: ${remedy.elementKr}
- 추천 방위: ${remedy.direction}
- 추천 색: ${remedy.colors.join(" / ")}
- 추천 계절감: ${remedy.season}
- 방위를 언급해야 한다면 반드시 "${remedy.direction}"만 쓴다.
- 다른 방위(동쪽/서쪽/남쪽/북쪽/남동쪽/북서쪽 등)를 섞지 않는다.
- 사주바라 기본 카드에서는 이 처방을 매 섹션마다 쓰지 않는다.
- 특히 성격·직업·애정·그림자·피해야 할 사람 카드에는 방위/색/공간 배치를 넣지 않는다.
- 방위/색 처방은 "바라의 한 마디"처럼 종합 조언 카드에서만 자연스럽게 1회 쓰는 것을 원칙으로 한다.

${chartAsContext(chart)}`;
}

function contextHashSuffix(input: SajuInput): string {
  return `${input.loveStatus ?? ""}|${input.jobStatus ?? ""}`;
}

function currentKstDateParts(): { year: number; month: number; day: number; iso: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  return {
    year,
    month,
    day,
    iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

function currentKstYear(): number {
  return currentKstDateParts().year;
}

type GuidanceElement = "wood" | "fire" | "metal" | "water";

const GUIDANCE_ELEMENT_META: Record<
  GuidanceElement,
  { elementKr: string; direction: string; colors: string[]; season: string }
> = {
  wood: {
    elementKr: "목",
    direction: "동쪽",
    colors: ["초록", "청록"],
    season: "봄",
  },
  fire: {
    elementKr: "화",
    direction: "남쪽",
    colors: ["코랄", "붉은색"],
    season: "여름",
  },
  metal: {
    elementKr: "금",
    direction: "서쪽",
    colors: ["흰색", "은색"],
    season: "가을",
  },
  water: {
    elementKr: "수",
    direction: "북쪽",
    colors: ["파랑", "남색"],
    season: "겨울",
  },
};

function guidanceProfile(chart: SajuChart) {
  const counts: Record<GuidanceElement, number> = {
    wood: 0,
    fire: 0,
    metal: 0,
    water: 0,
  };
  for (const pillar of chart.pillars) {
    if (pillar.stem.element in counts) counts[pillar.stem.element as GuidanceElement] += 1;
    if (pillar.branch.element in counts) counts[pillar.branch.element as GuidanceElement] += 1;
  }
  const element = (Object.keys(counts) as GuidanceElement[]).sort((a, b) => {
    const diff = counts[a] - counts[b];
    if (diff !== 0) return diff;
    return ["wood", "fire", "metal", "water"].indexOf(a) -
      ["wood", "fire", "metal", "water"].indexOf(b);
  })[0];
  return { element, ...GUIDANCE_ELEMENT_META[element] };
}

const DIRECTION_REGEX =
  /(남동쪽|동남쪽|남서쪽|서남쪽|북동쪽|동북쪽|북서쪽|서북쪽|동쪽|서쪽|남쪽|북쪽)/g;

function normalizeDirectionalAdvice(text: string, chart: SajuChart): string {
  if (!DIRECTION_REGEX.test(text)) return text;
  DIRECTION_REGEX.lastIndex = 0;
  const { direction } = guidanceProfile(chart);
  return text.replace(DIRECTION_REGEX, direction);
}

function periodTimingLabel(
  year: number,
  month?: number,
  now = currentKstDateParts(),
): "지난" | "현재" | "다가올" {
  if (year < now.year) return "지난";
  if (year > now.year) return "다가올";
  if (typeof month !== "number") return "현재";
  if (month < now.month) return "지난";
  if (month > now.month) return "다가올";
  return "현재";
}

function cleanTemporalPerspective(
  text: string | undefined,
  year: number,
  month?: number,
  chart?: SajuChart,
): string {
  const now = currentKstDateParts();
  const timing = periodTimingLabel(year, month, now);
  let out = cleanUnsafeTerms(text ?? "");
  if (chart) out = normalizeDirectionalAdvice(out, chart);

  if (timing !== "현재") {
    out = out.replace(/올해/g, `${year}년`);
  }

  if (timing !== "지난") return out.trim();

  return out
    .replace(/다가옵니다/g, "다가왔습니다")
    .replace(/찾아옵니다/g, "찾아왔을 가능성이 큽니다")
    .replace(/열립니다/g, "열렸을 가능성이 큽니다")
    .replace(/시작됩니다/g, "시작된 흐름이었습니다")
    .replace(/커집니다/g, "커졌던 흐름입니다")
    .replace(/드러납니다/g, "드러났던 흐름입니다")
    .replace(/생깁니다/g, "생겼을 가능성이 큽니다")
    .replace(/될 것입니다/g, "되었을 가능성이 큽니다")
    .replace(/될 거예요/g, "되었을 가능성이 큽니다")
    .replace(/하게 됩니다/g, "하게 된 흐름이었습니다")
    .replace(/주목해 보세요/g, "어떻게 지나갔는지 되짚어보세요")
    .replace(/준비해 보세요/g, "당시 무엇을 준비했는지 돌아보세요")
    .replace(/준비하세요/g, "당시 준비가 어디까지 되었는지 점검해보세요")
    .replace(/잡아보세요/g, "잡았거나 놓친 기회를 점검해보세요")
    .replace(/잡으세요/g, "잡았거나 놓친 기회를 점검해보세요")
    .replace(/활용해 보세요/g, "어떻게 활용했는지 돌아보세요")
    .replace(/활용하세요/g, "어떻게 활용했는지 돌아보세요")
    .replace(/시도해 보세요/g, "어떤 시도가 있었는지 돌아보세요")
    .replace(/시도하세요/g, "어떤 시도가 있었는지 돌아보세요")
    .trim();
}

function cleanExplicitPastYearDirectives(text: string): string {
  const nowYear = currentKstYear();
  return text.replace(/\b(20\d{2})년[^.!?\n。]*(?:주목해 보세요|준비하세요|준비해 보세요|잡으세요|잡아보세요|활용하세요|활용해 보세요|시도하세요|시도해 보세요|다가옵니다|찾아옵니다|열립니다|시작됩니다|될 것입니다|될 거예요|하게 됩니다)[^.!?\n。]*(?:[.!?。]|$)/g, (sentence) => {
    const yearMatch = sentence.match(/\b(20\d{2})년/);
    const year = yearMatch ? Number(yearMatch[1]) : nowYear;
    return year < nowYear ? cleanTemporalPerspective(sentence, year) : sentence;
  });
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY 환경변수가 설정되지 않았어요. 프로젝트 루트에 .env.local 파일을 만들고 OPENAI_API_KEY 값을 추가해 주세요.",
    );
  }
  return new OpenAI({ apiKey });
}

const MODEL_FULL = process.env.OPENAI_MODEL_FULL ?? process.env.OPENAI_MODEL ?? "gpt-4o";
const MODEL_LITE = process.env.OPENAI_MODEL_LITE ?? "gpt-4o-mini";

async function chat(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  opts: { json?: boolean; temperature?: number; lite?: boolean } = {},
): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: opts.lite ? MODEL_LITE : MODEL_FULL,
    temperature: opts.temperature ?? 0.7,
    max_tokens: maxTokens,
    response_format: opts.json ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("모델 응답이 비어있어요.");
  return text;
}

export async function generateOneLiner(input: SajuInput, chart: SajuChart): Promise<string> {
  const key = cacheKey("oneLiner", "v7-expression-not-extrovert", inputHash(input), contextHashSuffix(input));
  const cached = await readCache(key);
  if (cached) return cached;

  const system = `${BARA_VOICE}

[작업]
사주 데이터(특히 일간·강한 오행·약한 오행)를 보고 '한 줄 인트로'를 만들어줘. 카드 전체의 hook이 될 한 문장.

[규칙]
- 60자 내외, 한 문장 또는 두 문장 짧게
- 단정형 존댓말 ("~합니다", "~인 사람입니다", "~하죠?")
- "○○님은~" 으로 시작해도, 행동 묘사("~하는 분이죠?")로 시작해도 OK
- 콜드리딩 금지. 일간·오행을 실제로 반영
- 식신·상관·식상 강함을 외향성으로 단정 금지. 말보다 결과물·표현 방식으로 풀 것
- 한자(甲·寅 등) 본문 노출 금지. "갑목 일간" "재성이 강한 흐름" 같이 한글로
- 따옴표·줄바꿈 없이 본문 한 줄만

[좋은 예시]
- "수연님은 말보다 결과물로 본인 색을 남기는 쪽에 가까운 분이죠?"
- "겉은 조용해 보여도 결정의 순간엔 누구보다 단단한 사람입니다."
- "수연님 안에는 두 결이 있어요. 부드러운 흙 같은 마음과, 한번 정하면 안 꺾이는 고집과."`;
  const result = await chat(system, inputBlock(input, chart), 200, {
    temperature: 0.7,
    lite: true,
  });
  await writeCacheFile(key, result, { kind: "oneLiner", tier: "lite" });
  return result;
}

export type SectionResult = { headline: string; teaser: string; body: string };

function cleanPreviewText(text: string): string {
  return cleanUnsafeTerms(text)
    .replace(/\s*(그\s*(?:이유|정체|비밀|핵심|해답)[^.!?\n。]*(?:본문|안에서|다음|이어서)?[^.!?\n。]*(?:…|\.|요\.?|─|-)?)\s*$/g, "")
    .replace(/\s*((?:본문|안에서|다음 장|이어서)[^.!?\n。]*(?:풀어드릴게요|알려드릴게요|확인하세요|확인해 주세요|이어집니다)[^.!?\n。]*(?:…|\.|요\.?)?)\s*$/g, "")
    .replace(/\s*((?:이어지는|다음)\s*내용[^.!?\n。]*(?:…|\.|요\.?)?)\s*$/g, "")
    .trim();
}

function cleanUnsafeTerms(text: string): string {
  return text
    .replace(/자지\s*(\d+)\s*개/g, "자수 $1개")
    .replace(/자지\s*두\s*개/g, "자수 두 개")
    .replace(/자지\s*두개/g, "자수 두 개")
    .replace(/자지\s*2\s*개/g, "자수 2개");
}

function cleanReportText(text: string | undefined, chart: SajuChart): string {
  return normalizeDirectionalAdvice(cleanUnsafeTerms(text ?? ""), chart).trim();
}

function polishGenericPhrases(text: string): string {
  return text
    .replace(/외향적인 직업/g, "표현 산출물이 보이는 일")
    .replace(/외향적 직업/g, "표현 산출물이 보이는 일")
    .replace(/외향적인 사람/g, "표현 방식이 뚜렷한 사람")
    .replace(/외향적(?:인)? 성향/g, "표현 욕구")
    .replace(/외향적(?:인)? 타입/g, "표현형 타입")
    .replace(/외향적/g, "표현형")
    .replace(/사교적인 직업/g, "사람의 반응을 읽는 일")
    .replace(/사교적(?:인)? 성향/g, "관계 감각")
    .replace(/분위기 메이커/g, "흐름을 바꾸는 표현자")
    .replace(/빛을 발합니다/g, "존재감이 선명해집니다")
    .replace(/도움이 될 수 있습니다/g, "도움이 됩니다")
    .replace(/좋은 균형을 유지할 수 있습니다/g, "과열된 속도를 낮출 수 있습니다")
    .replace(/균형을 유지할 수 있습니다/g, "속도를 낮출 수 있습니다")
    .replace(/주의가 필요합니다/g, "미리 선을 그어야 합니다")
    .replace(/신중함이 필요합니다/g, "신중함이 핵심입니다")
    .replace(/중요합니다/g, "핵심입니다")
    .replace(/가능성이 큽니다/g, "흐름이 커집니다")
    .replace(/가능성이 높습니다/g, "흐름이 강해집니다")
    .replace(/피하는 것이 좋습니다/g, "피해야 합니다")
    .replace(/집중하는 것이 좋습니다/g, "집중해야 합니다")
    .replace(/하는 것이 좋습니다/g, "하는 편이 맞습니다");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeNameUsage(text: string, name: string): string {
  const fullName = name.trim();
  if (!fullName) return text;
  const shortened = fullName.length >= 3 ? fullName.slice(1) : "";
  if (!shortened || shortened === fullName) return text;
  return text.replace(
    new RegExp(`(^|[^가-힣])${escapeRegExp(shortened)}님`, "g"),
    `$1${fullName}님`,
  );
}

function cleanSectionText(
  text: string | undefined,
  input: SajuInput,
  chart?: SajuChart,
): string {
  let out = cleanUnsafeTerms(text ?? "");
  if (chart) out = normalizeDirectionalAdvice(out, chart);
  return normalizeNameUsage(
    polishGenericPhrases(cleanExplicitPastYearDirectives(out)),
    input.name,
  )
    .replace(/[*"`]/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function compactForOverlap(text: string): string {
  return text.replace(/[^\p{L}\p{N}가-힣]/gu, "");
}

function hasTeaserBodyOverlap(teaser: string, body: string): boolean {
  const bodyCompact = compactForOverlap(body);
  const teaserSentences = teaser
    .split(/(?<=[.!?。])\s+/)
    .map((sentence) => compactForOverlap(sentence))
    .filter((sentence) => sentence.length >= 18);
  return teaserSentences.some((sentence) => bodyCompact.includes(sentence));
}

const FORBIDDEN_EXAMPLE_PHRASES = [
  "통장은 비어 보이는데",
  "결산하면 흑자",
  "새는 돈의 정체",
  "겉으로는 평범",
  "혼자 일할 땐 폭발",
  "착한 사람 콤플렉스",
  "연애에서 매번 손해",
  "조직생활 NO",
  "독보적인 스페셜리스트",
  "예의 바른 단호함",
  "사람 좋다는 평판 뒤에 숨은 한숨",
  "당당해 보이지만 사실은 자존감",
  "친구는 많은데 진짜 속내",
  "스스로 만든 벽",
  "겉바속촉이 아니라",
  "이상하게 매번 같은 결의 사람",
];

function hasCopiedExamplePhrase(text: string): boolean {
  const compact = compactForOverlap(text);
  return FORBIDDEN_EXAMPLE_PHRASES.some((phrase) => {
    const phraseCompact = compactForOverlap(phrase);
    return phraseCompact.length >= 8 && compact.includes(phraseCompact);
  });
}

function sectionQualityIssues(
  result: SectionResult,
  input: SajuInput,
  section: SajuSectionDef,
  lite: boolean,
): string[] {
  const issues: string[] = [];
  const headline = result.headline.trim();
  const teaser = result.teaser.trim();
  const body = result.body.trim();

  if (headline.length < 8) issues.push("headline이 너무 짧음");
  if (teaser.length < 40) issues.push("teaser가 너무 짧음");

  const overclaimPatterns = [
    /외향적/g,
    /외향적인/g,
    /사교적/g,
    /분위기 메이커/g,
  ];
  const visibleText = `${headline}\n${teaser}\n${body}`;
  if (hasCopiedExamplePhrase(visibleText)) {
    issues.push("프롬프트 예시 문구를 그대로 재사용함");
  }

  if (overclaimPatterns.some((pattern) => pattern.test(visibleText))) {
    issues.push("식상/상관을 외향성으로 과잉 해석함");
  }

  if (hasWrongSectionPrescription(visibleText, section)) {
    issues.push("섹션 주제와 맞지 않는 재정관리/방위/색/공간 처방을 반복함");
  }

  if (lite) return issues;

  if (body.length < 220) issues.push("body가 유료 본문으로는 너무 짧음");
  if (body && hasTeaserBodyOverlap(teaser, body)) {
    issues.push("teaser와 body가 같은 문장을 반복함");
  }

  const fullName = input.name.trim();
  const shortened = fullName.length >= 3 ? fullName.slice(1) : "";
  if (shortened && new RegExp(`(^|[^가-힣])${escapeRegExp(shortened)}님`).test(body)) {
    issues.push("이름을 줄여 부름");
  }

  const lowQualityPatterns = [
    /빛을 발합니다/g,
    /도움이 될 수 있습니다/g,
    /주의가 필요합니다/g,
    /좋은 방법입니다/g,
    /좋습니다/g,
    /중요합니다/g,
    /가능성이 (?:큽니다|높습니다)/g,
    /긍정적(?:인)?/g,
    /조화/g,
    /균형/g,
    /강점과 약점/g,
    /할 수 있어요/g,
  ];
  const lowQualityCount = lowQualityPatterns.reduce(
    (count, pattern) => count + (body.match(pattern)?.length ?? 0),
    0,
  );
  if (lowQualityCount >= 2) issues.push("헐거운 일반론 표현이 많음");

  return issues;
}

function hasWrongSectionPrescription(text: string, section: SajuSectionDef): boolean {
  const compact = text.replace(/\s+/g, "");
  const directionPattern =
    /(남동쪽|동남쪽|남서쪽|서남쪽|북동쪽|동북쪽|북서쪽|서북쪽|동쪽|서쪽|남쪽|북쪽)/;
  const financialPatterns = [
    /재정\s*관리/g,
    /재무\s*관리/g,
    /지출/g,
    /소비/g,
    /투자/g,
    /저축/g,
    /통장/g,
    /수입원/g,
    /가계부/g,
  ];
  const colorSpacePatterns = [
    directionPattern,
    /초록색/g,
    /청록/g,
    /코랄/g,
    /붉은색/g,
    /흰색/g,
    /은색/g,
    /파란색/g,
    /남색/g,
    /색(?:을|으로)?\s*활용/g,
    /공간(?:을|에|의)?\s*(?:꾸미|배치|정리)/g,
  ];

  const allowsMoney = section.key === "wealth" || section.key === "taboo";
  const allowsColorSpace = section.key === "advice";

  if (!allowsMoney && financialPatterns.some((pattern) => pattern.test(text))) return true;
  if (!allowsColorSpace && colorSpacePatterns.some((pattern) => pattern.test(text))) return true;

  if (section.key !== "wealth" && compact.includes("재정관리")) return true;
  if (section.key !== "wealth" && compact.includes("재무관리")) return true;
  return false;
}

function sectionActionRules(section: SajuSectionDef): string {
  const common = `- 처방은 카드 주제와 직접 연결한다. 안전한 말로 도망가서 "재정 관리", "초록색 공간", "동쪽 방향"을 반복하지 않는다.`;
  switch (section.key) {
    case "personality":
      return `[섹션별 처방 레일 — 타고난 성격]
${common}
- 처방은 성격 사용법으로 쓴다: 의사결정 방식, 혼자 몰입하는 시간, 피드백 받는 방식, 말보다 결과물을 보여주는 순서.
- 금지: 재정 관리, 지출 관리, 투자, 방향, 색, 공간 배치.`;
    case "career":
      return `[섹션별 처방 레일 — 직업·재능]
${common}
- 처방은 일의 구조로 쓴다: 맞는 직무, 피해야 할 업무 환경, 프로젝트 운영 방식, 협업 방식.
- 금지: 재정 관리, 지출 관리, 방향, 색, 공간 배치.
- 단순 "관리직은 어렵다"가 아니라 반복 보고·정산·통제 역할과 기준 설계·기획 리드 역할을 구분한다.`;
    case "wealth":
      return `[섹션별 처방 레일 — 재물운]
${common}
- 이 카드에서만 돈 이야기를 깊게 한다: 지출 구멍, 수입원, 결제 습관, 금액 구간, 계약·정산 루틴.
- 방향/색/공간 배치 대신 숫자·기간·계좌 분리·자동이체 같은 현실 처방을 우선한다.`;
    case "love":
      return `[섹션별 처방 레일 — 애정·인간관계]
${common}
- 처방은 관계 방식으로 쓴다: 어떤 사람에게 약한지, 어떤 말투/속도/거리감을 택해야 하는지.
- 금지: 재정 관리, 지출 관리, 투자, 방향, 색, 공간 배치.`;
    case "year":
      return `[섹션별 처방 레일 — 올해의 흐름]
${common}
- 처방은 ${currentKstYear()}년의 월/분기/일정 운영으로 쓴다.
- 과거 월은 회고형, 남은 월은 준비형으로 구분한다.
- 금지: 방향, 색, 공간 배치. 돈 이야기는 올해 핵심 흐름일 때만 1회 이하로 쓴다.`;
    case "advice":
      return `[섹션별 처방 레일 — 바라의 한 마디]
${common}
- 이 카드에서만 결과지 전체 개운 처방 기준의 방위/색/계절감을 사용할 수 있다.
- 그래도 핵심은 사용자가 오늘 바로 할 수 있는 작은 행동 1개다. 방위·색 처방은 한 문장 이하로 제한한다.`;
    case "shadow":
      return `[섹션별 처방 레일 — 그림자]
${common}
- 처방은 스트레스 상황의 반응 패턴을 줄이는 방식으로 쓴다: 거절 문장, 쉬는 방식, 연락 간격, 감정 기록.
- 금지: 재정 관리, 지출 관리, 투자, 방향, 색, 공간 배치.`;
    case "taboo":
      return `[섹션별 처방 레일 — 올해의 금기]
${common}
- 처방은 피해야 할 선택 2~3개를 돈/관계/일 중에서 구체화한다.
- 돈을 언급해도 "재정 관리가 중요" 같은 일반론 금지. 예: 큰 선결제, 보증, 충동 계약처럼 행동 단위로 쓴다.
- 방향/색/공간 배치 금지.`;
    case "badMatch":
      return `[섹션별 처방 레일 — 피해야 할 사람]
${common}
- 처방은 멀리해야 할 사람의 말투·요구 방식·관계 패턴으로 쓴다.
- 금지: 재정 관리, 지출 관리, 투자, 방향, 색, 공간 배치.`;
    default:
      return common;
  }
}

function sectionToneRules(tone: SectionTone): string {
  if (tone === "shadow") {
    return `[톤: 그림자(팩폭)]
- 약점·금기·갈등을 직접적으로 짚어줘. 사용자가 "헉, 내 얘기네" 할 정도로 구체적으로.
- "솔직히 말씀드리면", "보통 본인은 모르는데", "사실은~" 같은 도입 적극 사용
- 단정형 ("~하죠?", "~한 패턴입니다") 적극 사용
- 부정 정서를 먼저 자극 → 마지막에 처방으로 마무리하는 흐름
- 헤드라인부터 약점·갈등을 드러내도 OK.`;
  }
  return `[톤: 다정한 단정형]
- 따뜻하지만 흐릿하지 않게. 단정형 존댓말 ("~인 사람이에요", "~합니다") 위주
- "솔직히 말씀드리면" 같은 직접 도발은 자제. 대신 구체적 행동 묘사로 신뢰 형성
- "긍정적", "조화", "균형" 같은 모호한 칭찬은 금지. 강점도 구체적 장면으로 보여줘
- **헤드라인은 강점·매력·반전을 살리는 결로**. "불안", "약점", "고통" 같은 부정어를 헤드라인에 박지 마. 부정 정서는 그림자 카드(다른 섹션)의 몫.`;
}

export async function generateSection(
  input: SajuInput,
  chart: SajuChart,
  section: SajuSectionDef,
  lite: boolean = false,
): Promise<SectionResult> {
  const now = currentKstDateParts();
  const toneRules = sectionToneRules(section.tone);
  const actionRules = sectionActionRules(section);
  const headlineExamples =
    section.tone === "shadow" ? HEADLINE_EXAMPLES_SHADOW : HEADLINE_EXAMPLES_STRENGTH;

  const keySignals = computeKeySignals(chart);
  const keySignalsBlock = `\n[이 명식의 핵심 단서 — 본문에 최소 2종 인용 필수]\n${keySignals.map((s) => `- ${s}`).join("\n")}`;

  const bodySection = lite
    ? `\n[body]\nbody 필드는 빈 문자열 ""로 반환. 본문 생성하지 않음. headline + teaser만 충실히.`
    : `\n[body 규칙 — 잠금 영역, 4단 구조, 4~6문장, 280~420자]
① 진단 — 카드 주제(${section.title})에 대한 단정형 한 줄. 클리셰 오프너 금지.
② 명식 근거 — 위 [핵심 단서] 중 **서로 다른 2종 이상**을 자연 한글로 인용. 같은 근거 반복 금지.
③ 행동·관계·상황 양상 — 구체 장면 1개 (어떤 사람·어떤 상황에서·어떤 결로 드러나는지).
④ 처방 — 아래 [섹션별 처방 레일]을 따른다. "꾸준히/긍정적으로/노력하세요" 금지.
- 방향/색/공간 배치 처방은 "바라의 한 마디" 카드에서만 허용한다. 다른 카드에서 쓰면 실패.
- body는 teaser를 다시 설명하지 않는다. teaser의 첫 문장·핵심 문장을 복사하거나 같은 말로 반복하면 실패.
- body 첫 문장은 teaser와 다른 각도에서 시작한다. 예: teaser가 "재정 관리"를 말했으면 body는 "어떤 지출 패턴이 생기는지"부터 들어간다.

[콜드리딩 디톡스 워싱 규칙 — 본문 작성 시 모두 지킬 것]
R1. 양가 대비 클리셰("겉으로는 X 속으로는 Y", "조용해 보이지만 강한") 카드당 최대 1회. 2회째는 명식 근거 종속절로 흡수 ("축미충이 흔들기 때문에…").
R2. 같은 명식 근거 표현 카드당 최대 2회. "일간 기토가 안정적" 3회 등장 즉시 실패.
R3. 일간·오행 일반론만으로는 부족. 위 [핵심 단서]에서 최소 2종을 본문에 명시.
R4. 처방은 반드시 아래 [섹션별 처방 레일]에 맞게 구체화. 일반론 금지.
R5. 오프너 금지: "솔직히 말씀드리면", "○○님 ~하시죠?", "사실은 ~죠?", "혹시 ~한 적 있지 않으세요?". 대체: 명식 근거 단정문.
R6. 클리프행어("그 비밀은 본문에서", "이어서 풀어드릴게요", "그 이유는…")는 teaser와 body 모두 금지. 문장은 자연스럽게 완결한다.
R8. 4단 구조 위 그대로. "근거 없는 진단" 또는 "진단 없는 처방"만 있으면 실패.
R9. 긍정 카드(${section.tone === "strength" ? "현재 카드 = 긍정" : "그림자 카드"})에도 한 줄의 한계·반대급부·주의 포함. 부정 카드도 비난·공포 톤 대신 명식 근거 → 행동 가이드.
R10. SWAP TEST — 본문에서 명식 키워드(핵심 단서)를 가렸을 때 "다른 사주에 그대로 붙여도 말이 되는가?"를 자문. 그렇다면 다시 써. body 안에 위 [핵심 단서]의 구체 명칭이 최소 2개 박혀 있어야 한다.`;

  const system = `${BARA_VOICE}

${toneRules}

${actionRules}

[작업]
사주 데이터를 근거로 '${section.title}' 카드를 작성한다. 반드시 다음 JSON만 반환:
{"headline": "...", "teaser": "...", "body": "${lite ? "" : "..."}"}
${lite ? "" : keySignalsBlock}

[현재 시점/연도 규칙 — 매우 중요]
- 현재 기준일은 KST ${now.iso}, 현재 연도는 ${now.year}년이다.
- "올해"는 반드시 ${now.year}년을 뜻한다. 올해의 흐름/올해의 금기는 ${now.year}년 중심으로 쓴다.
- ${now.year - 1}년 이전 연도를 언급하면 이미 지난 일이다. 과거 연도에는 "주목해 보세요", "기회가 옵니다", "준비하세요", "잡으세요" 같은 미래형 권유를 절대 쓰지 않는다.
- 과거 연도는 "그때 이런 흐름이 있었을 가능성이 큽니다", "돌아보면", "점검해볼 지점입니다"처럼 회고형으로 쓴다.
- ${now.year + 1}년 이후 연도에만 미래형 준비·기회 표현을 쓸 수 있다.

[headline 규칙]
- 14~30자, 자연스러운 한국어 한 문장
- 구체적 갈등·반전·일상장면을 담아라. 시적 추상은 금지.
- 한자·따옴표·이모지·마침표 금지.
- 비문 절대 금지 (조사 정확하게).
- 식신·상관·식상 근거를 "외향적", "사교적", "분위기 메이커"로 쓰지 마. "표현 산출물", "기획", "글·말·콘텐츠", "혼자 만든 결과물"로 풀어.
- 양가 대비 클리셰("조용해 보이지만 강한") 금지. 명식 키워드 포함한 진단형 권장.

${headlineExamples}

[teaser 규칙 — 무료 노출, 60~120자, 2~3문장]
- 결과 카드 안에서 그대로 읽혀야 하는 짧은 미리보기다. 광고 문구처럼 끊지 마.
- teaser는 본문 요약이 아니라 결제 전/잠금 전 미리보기다. body와 같은 문장·같은 오프닝을 쓰지 마.
- 1) 카드 주제에 대한 구체 진단 1문장
- 2) 사주 근거를 한글로 1회 자연 인용 (예: "일간 기토가 깊게 박혀 있어서~", "재성이 약한 흐름이라~")
- 3) 마지막 문장은 자연스럽게 완결. "그 이유는", "그 정체는", "본문에서", "이어서", "안에서 알려드릴게요" 금지.
- "○○님, ~하죠?", "솔직히 말씀드리면" 같은 유도 질문형 도입 금지.
- 식상·상관을 근거로 외향성/사교성을 단정하지 않는다. 내향형도 맞다고 느낄 수 있게 "말보다 결과물", "혼자 만든 표현"을 허용한다.
- teaser에서도 섹션별 처방 레일을 어기지 않는다. 재물운이 아닌 카드에서 "재정 관리"로 후킹하지 마.

${TEASER_EXAMPLES}
${bodySection}

[다룰 내용]
${section.focus}

${section.key === "career" ? `[직업·재능 추가 규칙]
- "외향적인 직업"이라는 표현은 절대 쓰지 마. 성격 판단처럼 들려서 오답이 된다.
- 식신·상관·식상이 강한 명식은 "사람을 많이 만나는 일"보다 "아이디어를 결과물로 바꾸는 일", "기획·콘텐츠·문서화·교육·브랜딩·제품화"로 풀어.
- 관리직 여부를 말할 때는 "관리직은 어렵다"로 단정하지 말고, "반복 보고·정산·통제만 있는 관리 역할은 피로하고, 기준을 설계하는 리드 역할은 맞다"처럼 구분해.` : ""}

[엄수 — 다시 강조]
- 한국어 원어민 톤. 비문(어색한 조사·축약·합성어) 절대 금지.
- 입력 이름을 줄여 부르지 마. "지수연"이면 "지수연님"만 가능, "수연님" 금지.
- teaser와 body의 동어반복 금지. 유료 body는 새로운 정보·장면·처방으로 확장.
- 섹션별 처방 레일 위반 금지. 성격/직업/관계/그림자/피해야 할 사람 카드에서 재정관리·방위·색·공간 배치로 마무리하지 마.
- 한자(甲, 寅 등) 노출 X. "갑목 일간", "정관이 강한 흐름" 같이 한글로.
- 콜드리딩 표현 ("~할 수 있어요", "조화를 이루어요", "긍정적 에너지", "강점과 약점이") 금지.
- 미신적·예언적 단정 ("절대", "무조건", "반드시 부자가 됩니다", "이혼합니다") 금지. 가능성·조건부로 약화.
- 마크다운(**, *), 따옴표 금지. 평문만.`;

  const key = cacheKey(
    "section",
    lite ? "lite-v16-no-example-copy" : "full-v17-no-example-copy",
    section.key,
    inputHash(input),
    contextHashSuffix(input),
  );
  const cached = await readCache(key);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as SectionResult;
      return {
        headline: cleanSectionText(parsed.headline, input, chart),
        teaser: cleanPreviewText(cleanSectionText(parsed.teaser, input, chart)),
        body: cleanSectionText(parsed.body, input, chart),
      };
    } catch {
      // regenerate
    }
  }

  const parseSectionResult = (raw: string): SectionResult | null => {
    try {
      const parsed = JSON.parse(raw) as Partial<SectionResult>;
      if (typeof parsed.headline === "string" && typeof parsed.teaser === "string") {
        return {
          headline: cleanSectionText(parsed.headline, input, chart),
          teaser: cleanPreviewText(cleanSectionText(parsed.teaser, input, chart)),
          body: cleanSectionText(parsed.body, input, chart),
        };
      }
    } catch {
      return null;
    }
    return null;
  };

  const raw = await chat(system, inputBlock(input, chart), lite ? 350 : 900, {
    json: true,
    temperature: 0.75,
    lite,
  });
  try {
    let result = parseSectionResult(raw);
    if (!result) throw new Error("section JSON schema mismatch");

    const issues = sectionQualityIssues(result, input, section, lite);
    if (issues.length > 0) {
      const retrySystem = `${system}

[재작성 지시]
이전 초안은 아래 문제로 폐기한다.
${issues.map((issue) => `- ${issue}`).join("\n")}

반드시 새로 써라.
- teaser와 body의 첫 문장·핵심 문장을 다르게 쓴다.
- 입력 이름을 줄여 부르지 않는다.
- 예시 헤드라인 문구를 베끼지 않는다. "통장은 비어 보이는데", "결산하면 흑자", "착한 사람 콤플렉스" 같은 표현 금지.
- "빛을 발합니다", "도움이 될 수 있습니다", "중요합니다", "좋습니다" 같은 헐거운 마무리 금지.
- 섹션별 처방 레일을 지킨다. 재물운이 아닌 카드에서 재정관리로 마무리하지 않는다.
- body는 진단 → 명식 근거 2개 → 구체 장면 → 구체 처방 순서로 완결한다.`;
      const retryRaw = await chat(retrySystem, inputBlock(input, chart), lite ? 420 : 1050, {
        json: true,
        temperature: 0.62,
        lite,
      });
      const retryResult = parseSectionResult(retryRaw);
      if (retryResult) {
        const retryIssues = sectionQualityIssues(retryResult, input, section, lite);
        if (retryIssues.length <= issues.length) result = retryResult;
      }
    }

    await writeCacheFile(key, JSON.stringify(result), {
      kind: "section",
      tier: lite ? "lite" : "full",
    });
    return result;
  } catch {
    // fall through
  }
  return { headline: section.title, teaser: "", body: cleanSectionText(raw, input, chart) };
}

// ============================================================
// 대운 / 연도별 — 시계열 해석
// ============================================================

const ELEMENT_KR_MAP: Record<string, string> = {
  甲: "갑목", 乙: "을목", 丙: "병화", 丁: "정화", 戊: "무토",
  己: "기토", 庚: "경금", 辛: "신금", 壬: "임수", 癸: "계수",
};

const BRANCH_KR_MAP: Record<string, string> = {
  子: "자수", 丑: "축토", 寅: "인목", 卯: "묘목", 辰: "진토", 巳: "사화",
  午: "오화", 未: "미토", 申: "신금", 酉: "유금", 戌: "술토", 亥: "해수",
};

function pillarToKorean(pillar: string): string {
  if (pillar.length < 2) return pillar;
  const stem = ELEMENT_KR_MAP[pillar[0]] ?? pillar[0];
  const branch = BRANCH_KR_MAP[pillar[1]] ?? pillar[1];
  return `${stem} ${branch}`;
}

// 12운성 — 일간 vs 지지
const TWELVE_STAGE_TABLE: Record<string, Record<string, string>> = {
  甲: { 寅: "건록", 卯: "제왕", 辰: "쇠", 巳: "병", 午: "사", 未: "묘", 申: "절", 酉: "태", 戌: "양", 亥: "장생", 子: "목욕", 丑: "관대" },
  乙: { 卯: "건록", 寅: "제왕", 丑: "쇠", 子: "병", 亥: "사", 戌: "묘", 酉: "절", 申: "태", 未: "양", 午: "장생", 巳: "목욕", 辰: "관대" },
  丙: { 巳: "건록", 午: "제왕", 未: "쇠", 申: "병", 酉: "사", 戌: "묘", 亥: "절", 子: "태", 丑: "양", 寅: "장생", 卯: "목욕", 辰: "관대" },
  丁: { 午: "건록", 巳: "제왕", 辰: "쇠", 卯: "병", 寅: "사", 丑: "묘", 子: "절", 亥: "태", 戌: "양", 酉: "장생", 申: "목욕", 未: "관대" },
  戊: { 巳: "건록", 午: "제왕", 未: "쇠", 申: "병", 酉: "사", 戌: "묘", 亥: "절", 子: "태", 丑: "양", 寅: "장생", 卯: "목욕", 辰: "관대" },
  己: { 午: "건록", 巳: "제왕", 辰: "쇠", 卯: "병", 寅: "사", 丑: "묘", 子: "절", 亥: "태", 戌: "양", 酉: "장생", 申: "목욕", 未: "관대" },
  庚: { 申: "건록", 酉: "제왕", 戌: "쇠", 亥: "병", 子: "사", 丑: "묘", 寅: "절", 卯: "태", 辰: "양", 巳: "장생", 午: "목욕", 未: "관대" },
  辛: { 酉: "건록", 申: "제왕", 未: "쇠", 午: "병", 巳: "사", 辰: "묘", 卯: "절", 寅: "태", 丑: "양", 子: "장생", 亥: "목욕", 戌: "관대" },
  壬: { 亥: "건록", 子: "제왕", 丑: "쇠", 寅: "병", 卯: "사", 辰: "묘", 巳: "절", 午: "태", 未: "양", 申: "장생", 酉: "목욕", 戌: "관대" },
  癸: { 子: "건록", 亥: "제왕", 戌: "쇠", 酉: "병", 申: "사", 未: "묘", 午: "절", 巳: "태", 辰: "양", 卯: "장생", 寅: "목욕", 丑: "관대" },
};

export function twelveStage(dayMasterHanja: string, branchHanja: string): string {
  return TWELVE_STAGE_TABLE[dayMasterHanja]?.[branchHanja] ?? "";
}

// ============================================================
// 대운 — DaewoonReport (1회 LLM 호출로 현재 10년 집중 해설)
// ============================================================

export type DaewoonChapterKey = "chapterName" | "mental" | "relation" | "money" | "gaewoon";

export const DAEWOON_CHAPTER_META: Record<
  DaewoonChapterKey,
  { emoji: string; title: string; order: number }
> = {
  chapterName: { emoji: "📖", title: "이 10년의 챕터명", order: 0 },
  mental: { emoji: "🧠", title: "나의 내면과 멘탈", order: 1 },
  relation: { emoji: "💞", title: "인간관계와 로맨스", order: 2 },
  money: { emoji: "💰", title: "현실의 무게 — 돈과 커리어", order: 3 },
  gaewoon: { emoji: "🧭", title: "운명을 내 편으로 만드는 개운법", order: 4 },
};

export const DAEWOON_CHAPTER_ORDER: DaewoonChapterKey[] = [
  "chapterName",
  "mental",
  "relation",
  "money",
  "gaewoon",
];

export type DaewoonChapter = {
  key: DaewoonChapterKey;
  subtitle: string;     // 후킹 부제 — 무료
  bodyTeaser: string;   // 첫 1~2줄 — 무료
  body: string;         // 본문 4단 — 잠금
};

export type SewunCard = {
  year: number;
  ageKorean: number;
  subtitle: string;     // 무료
  body: string;         // 잠금
};

export type PeriodSubtitle = {
  index: number;
  subtitle: string;
};

export type DaewoonReport = {
  currentIndex: number;
  hero: { headline: string; body: string };
  overview: { title: string; body: string };
  chapters: DaewoonChapter[];
  sewunCards: SewunCard[];
  secret: { title: string; body: string };
  finalGuide: {
    title: string;
    summary: string;
    dos: string[];
    avoids: string[];
    nextStep: string;
  };
  pastSummaries: PeriodSubtitle[];
  futureTeasers: PeriodSubtitle[];
};

function buildDaewoonReportSystem(
  input: SajuInput,
  chart: SajuChart,
  focusIdx: number,
  years: { year: number; age: number }[],
  tense: "현재" | "다가올" | "지난",
  lite: boolean,
): string {
  const cur = chart.daewoonList[focusIdx];
  const dm = chart.dayMaster;
  const curStemKo = ELEMENT_KR_MAP[cur.stem.hanja] ?? cur.stem.korean;
  const curBranchKo = BRANCH_KR_MAP[cur.branch.hanja] ?? cur.branch.korean;
  const curStage = twelveStage(dm.hanja, cur.branch.hanja);
  const ageKoreanNow = chart.age + 1;
  const keySignals = computeKeySignals(chart);
  const now = currentKstDateParts();

  const past = chart.daewoonList
    .filter((d) => d.index < cur.index)
    .map(
      (d) =>
        `- index ${d.index}: ${d.startAge}~${d.endAge}세 / ${pillarToKorean(d.pillar)}`,
    )
    .join("\n") || "- (없음)";
  const future = chart.daewoonList
    .filter((d) => d.index > cur.index)
    .map(
      (d) =>
        `- index ${d.index}: ${d.startAge}~${d.endAge}세 / ${pillarToKorean(d.pillar)}`,
    )
    .join("\n") || "- (없음)";

  const sewunLines = years
    .map((y) => `- ${y.year}년 (한국나이 ${y.age + 1}세) — ${periodTimingLabel(y.year, undefined, now)} 해`)
    .join("\n");

  const tenseLabel =
    tense === "현재" ? "지금 진행 중인" : tense === "다가올" ? "앞으로 다가올" : "이미 지나간";
  const tenseGuide =
    tense === "현재"
      ? "사용자에게 **지금 이 순간** 펼쳐지고 있는 대운입니다. 현재시제 + 단정. 지금 일어나고 있는 변화를 짚어주세요."
      : tense === "다가올"
        ? `사용자에게 **앞으로 ${cur.startAge}세부터 시작될** 대운입니다. 미래시제 + 기대·준비의 결로 풀어주세요. "~할 시기가 옵니다", "~게 될 거예요" 톤. "지금"이라는 표현 쓰지 마세요.`
        : `사용자에게 **이미 지나간 ${cur.startAge}~${cur.endAge}세** 시기를 돌이켜보는 회고입니다. 과거시제. "~하셨을 거예요", "~한 결이었습니다" 톤. 무엇이 결정적이었는지 짚어주세요.`;

  return `${BARA_VOICE}

[작업]
${input.name}님의 **${tenseLabel} 대운 ${cur.startAge}~${cur.endAge}세** 10년을 집중 해설한다. 사주아이 톤(팩폭+친근+깊은 분석). 유료 결제 후 "돈 쓴 느낌"이 나도록 표지 이후 읽히는 긴 리포트로 작성한다.

[시점 — 매우 중요]
${tenseGuide}

[작성 기준일]
- 현재 날짜(KST): ${now.iso}
- 현재 연도: ${now.year}년
- 아래 10년 세운 중 ${now.year - 1}년 이전은 이미 지난 해다. 과거 해에는 미래형 지시/권유를 쓰지 않는다.
- 과거 해: "~했습니다", "~한 흐름이었습니다", "돌아보면", "점검해볼 지점입니다" 사용.
- 현재 해(${now.year}년): "지금", "올해 안에", "남은 기간"처럼 현재 진행형 사용.
- 미래 해: "다가옵니다", "준비해야 합니다" 사용 가능.

[사용자]
- 이름: ${input.name}
- 한국나이: ${ageKoreanNow}세 (만 ${chart.age}세)
- 연애: ${input.loveStatus ?? "미선택"} / 직업: ${input.jobStatus ?? "미선택"}

[일간(본인)] ${dm.korean}(${dm.element})

[핵심 명식 단서 — 본문에 최소 3개 이상 실제 인용]
${keySignals.map((s) => `- ${s}`).join("\n") || "- 단서 없음"}

[4기둥] (한자 노출 금지, 본문은 한글로)
${chart.pillars
  .map(
    (p) =>
      `- ${p.position}주: 천간 ${p.stem.korean}(${p.stemTenGod}) · 지지 ${p.branch.korean}(${p.branchTenGod})${p.isDayMaster ? " ← 일간" : ""}`,
  )
  .join("\n")}

[해설 대상 대운] ${cur.index + 1}번째 대운 (${cur.startAge}~${cur.endAge}세) — ${tenseLabel}
- 천간: ${curStemKo}
- 지지: ${curBranchKo}
- 12운성: ${curStage}

[이 대운의 10년 세운]
${sewunLines}

[과거 대운]
${past}

[미래 대운]
${future}

[톤 가이드 — 사주아이 스타일 깊은 분석]
- 십성 용어(비견·겁재·식신·상관·편재·정재·편관·정관·편인·정인)를 자연스럽게 사용. 한자 X, 한글로.
- 12운성 용어(절·태·양·장생·목욕·관대·건록·제왕·쇠·병·사·묘)를 1~2회 자연 인용.
- 신살(자형·자미원진·자미해·도화살·역마살 등)을 본인 사주에서 추정 가능하면 1회 인용. 모르면 안 써.
- 그 해의 천간을 한글로 ("2026년 병오년", "2028년 무신년").
- 본문은 길이보다 밀도. "느낌"이 아닌 "사주 구조 → 실제 상황 → 선택지" 순서로 쓴다.
- 긍정만 주지 말고 반드시 한계·주의·반대급부를 같이 넣는다.
- "누구에게나 해당되는 말" 금지. 핵심 명식 단서를 각 유료 본문에 최소 2개씩 박는다.

[유료 리포트 총론]
- overview.title: 이 10년의 큰 제목. 18~32자. 예: "무채색 일상에 금맥이 열리는 10년"
${lite ? '- overview.body: 빈 문자열 "" 반환.' : "- overview.body: 650~950자. 표지 다음에 읽히는 전체 총론. 대운 천간·지지, 일간, 핵심 명식 단서 3개 이상, 현재 상황(연애/직업), 가장 큰 기회와 위험을 모두 설명."}

[5챕터 카피 — 각 챕터 필수 필드]
- **subtitle**: 후킹 부제 (16~28자, 본인 사주의 강한 특성을 한 마디로). 예: "예민함이 무기가 되는 10년", "비견 4개의 자존심이 시험받는 시기"
- **bodyTeaser**: 본문 첫 1~2줄 (60~110자). 무료 노출용. 완결된 문장으로 끝낸다. "그 이유는", "본문에서", "이어서" 금지.
${lite ? '- **body**: 빈 문자열 "" 반환. 본문 생성 안 함.' : "- **body**: 본문 700~950자, 존댓말. 4단 구조 (선언 / 행동묘사 / 사주근거 / 처방). 핵심 명식 단서 2개 이상 + 대운 단서 1개 이상을 자연스럽게 인용."}

[다룰 영역 — 챕터별 다른 결]
- 📖 chapterName: 이 10년이 본인 인생에서 어떤 챕터인지. subtitle은 "○○ 일간의 두 번째 인생", "관대 운기로 무대 위에 서는 10년" 같은 결.
- 🧠 mental: 내면/멘탈의 결. 비견·식상·관성 등 본인 사주의 정신 구조 + 대운의 영향. 절망과 재정립.
- 💞 relation: 인간관계·로맨스. 현재 ${input.loveStatus ?? "미선택"} 상태 반영. 누가 들어오고 누가 정리되는지.
- 💰 money: 돈·커리어. 현재 ${input.jobStatus ?? "미선택"} 상태 반영. 자산 흐름, 직업 분기점.
- 🧭 gaewoon: 운명을 내 편으로 만드는 처방. 방위·색·습관·계절·물건 등 구체적 3가지.
- 방위를 쓰는 경우 [결과지 전체 개운 처방 기준]의 추천 방위만 사용. 챕터·세운·시크릿에서 서로 다른 방위를 섞지 않는다.

[10년 세운 카드 — 10개 (정확히 위 sewunLines 순서)]
- subtitle (12~24자): "한국나이 + 한 줄 키워드". 예: "41세 — 도화살 폭발 매력 발산", "44세 — 문서운 대박 계약의 해"
${lite ? '- body: 빈 문자열 "" 반환.' : "- body (280~420자): 그 해의 사주 분기점 + 현실 장면 + 주의·기회 + 행동 한 줄. 각 해마다 다른 사건감을 준다."}
- 각 sewunCards[].year의 시점 라벨을 반드시 따른다.
- 지난 해에는 "기회를 주목해 보세요", "잡으세요", "준비하세요", "찾아옵니다" 금지. 이미 지나간 사건을 회고하고, 그때 남은 교훈·패턴을 정리한다.
- 현재/미래 해에만 앞으로의 기회·준비·주의를 말한다.

[시크릿 솔루션]
- title: "흔들릴 때 꺼내볼 단 하나의 솔루션" 류 후킹 제목 (수정 OK).
${lite ? '- body: 빈 문자열 "" 반환.' : "- body (350~550자): 이 10년 내내 효과 있는 핵심 행동. 방위·물건·시간·습관 중 최소 2개를 구체적으로 제시."}
- 방위를 쓰는 경우 [결과지 전체 개운 처방 기준]의 추천 방위만 사용한다.

[최종 가이드 — 결제 후 마지막에 보여줄 행동 요약]
${lite ? '- finalGuide는 제목만 채우고 summary/dos/avoids/nextStep은 빈 값 또는 빈 배열.' : `- finalGuide.title: 18~32자.
- finalGuide.summary: 260~420자. 이 대운에서 지금 잡아야 할 것과 내려놓을 것을 정리.
- finalGuide.dos: 해야 할 행동 3개. 시간/관계/돈/건강/공간 중 하나 이상 구체화.
- finalGuide.avoids: 피해야 할 행동 3개. 막연한 조언 금지.
- finalGuide.nextStep: 1문장. 오늘 바로 할 행동.`}

[HERO]
- headline (12~22자): ${
    tense === "현재"
      ? `"[한국나이] [이름]님, [이 10년의 핵심 변화]" 형식. 예: "${ageKoreanNow}세 ${input.name}님, 인생 판도가 갈립니다"`
      : tense === "다가올"
        ? `"${cur.startAge}세부터 시작되는 [이름]님의 새 챕터, [핵심 변화]" 형식. 미래시제.`
        : `"${cur.startAge}~${cur.endAge}세 [이름]님이 통과한 [핵심 결]" 형식. 과거시제.`
  }
- body (180~280자, 4~5문장): 대운 ${curStemKo}/${curBranchKo}와 일간 ${dm.korean}의 관계를 한 번 인용. 마지막도 완결된 문장으로 끝낸다. "본문에서", "이어서", "그 이유는" 금지.

[과거 대운 요약]
- 각 과거 대운마다 한 줄 회고 (20~30자). subtitle은 "[나이대] [핵심 결]" 형식.

[미래 대운 티저]
- 각 미래 대운마다 한 줄 티저 (20~30자). 호기심 자극.

[출력 — JSON]
{
  "hero": { "headline": "...", "body": "..." },
  "overview": { "title": "...", "body": "${lite ? "" : "..."}" },
  "chapters": [
    { "key": "chapterName", "subtitle": "...", "bodyTeaser": "...", "body": "${lite ? "" : "..."}" },
    { "key": "mental", "subtitle": "...", "bodyTeaser": "...", "body": "${lite ? "" : "..."}" },
    { "key": "relation", "subtitle": "...", "bodyTeaser": "...", "body": "${lite ? "" : "..."}" },
    { "key": "money", "subtitle": "...", "bodyTeaser": "...", "body": "${lite ? "" : "..."}" },
    { "key": "gaewoon", "subtitle": "...", "bodyTeaser": "...", "body": "${lite ? "" : "..."}" }
  ],
  "sewunCards": [
    ${years.map((y) => `{ "year": ${y.year}, "ageKorean": ${y.age + 1}, "subtitle": "...", "body": "${lite ? "" : "..."}" }`).join(",\n    ")}
  ],
  "secret": { "title": "...", "body": "${lite ? "" : "..."}" },
  "finalGuide": {
    "title": "...",
    "summary": "${lite ? "" : "..."}",
    "dos": ${lite ? "[]" : `["...", "...", "..."]`},
    "avoids": ${lite ? "[]" : `["...", "...", "..."]`},
    "nextStep": "${lite ? "" : "..."}"
  },
  "pastSummaries": [${chart.daewoonList
    .filter((d) => d.index < cur.index)
    .map((d) => `{ "index": ${d.index}, "subtitle": "..." }`)
    .join(", ")}],
  "futureTeasers": [${chart.daewoonList
    .filter((d) => d.index > cur.index)
    .map((d) => `{ "index": ${d.index}, "subtitle": "..." }`)
    .join(", ")}]
}

[엄수]
- 한자(甲, 寅 등) 본문 노출 금지. 모든 사주 용어는 한글로.
- 콜드리딩 / 모호한 칭찬 / "조화"·"균형"·"긍정적 에너지" 금지.
- 본인 사주 구조 (어느 십성이 몇 개, 어느 오행이 강한지 등)를 유료 리포트 전체에서 총 4회 이상 직접 인용해서 권위감 형성.
- "${input.name}" 호명 자연스럽게, 강요하지 않게.
`;
}

export async function generateDaewoonReport(
  input: SajuInput,
  chart: SajuChart,
  targetIndex?: number,
  lite: boolean = false,
): Promise<DaewoonReport> {
  let currentIdx = chart.daewoonList.findIndex((d) => d.isCurrent);
  if (currentIdx < 0) currentIdx = 0;

  const requested =
    typeof targetIndex === "number" &&
    chart.daewoonList.some((d) => d.index === targetIndex)
      ? targetIndex
      : currentIdx;
  const focusListIdx = chart.daewoonList.findIndex((d) => d.index === requested);
  const focusIdx = focusListIdx >= 0 ? focusListIdx : currentIdx;
  const tense: "현재" | "다가올" | "지난" =
    focusIdx === currentIdx ? "현재" : focusIdx > currentIdx ? "다가올" : "지난";

  const key = cacheKey(
    "daewoonReport",
    lite ? "lite-v6-direction" : "full-v6-direction",
    String(chart.daewoonList[focusIdx].index),
    inputHash(input),
    contextHashSuffix(input),
  );
  const cached = await readCache(key);
  if (cached) {
    try {
      return JSON.parse(cached) as DaewoonReport;
    } catch {
      // regenerate
    }
  }

  const cur = chart.daewoonList[focusIdx];

  const thisYear = currentKstYear();
  const birthYear = thisYear - chart.age;
  const years = Array.from({ length: cur.endAge - cur.startAge + 1 }, (_, i) => {
    const age = cur.startAge + i;
    return { year: birthYear + age, age };
  });

  const system = buildDaewoonReportSystem(input, chart, focusIdx, years, tense, lite);
  const userPrompt = inputBlock(input, chart);
  const raw = await chat(system, userPrompt, lite ? 2500 : 14000, {
    json: true,
    temperature: 0.8,
    lite,
  });

  let parsed: Partial<DaewoonReport> = {};
  try {
    parsed = JSON.parse(raw) as Partial<DaewoonReport>;
  } catch {
    // fall through
  }

  const chaptersByKey = new Map<DaewoonChapterKey, DaewoonChapter>();
  if (Array.isArray(parsed.chapters)) {
    parsed.chapters.forEach((c) => {
      if (
        c &&
        typeof c.key === "string" &&
        DAEWOON_CHAPTER_ORDER.includes(c.key as DaewoonChapterKey)
      ) {
        chaptersByKey.set(c.key as DaewoonChapterKey, {
          key: c.key as DaewoonChapterKey,
          subtitle: cleanReportText(c.subtitle, chart),
          bodyTeaser: cleanPreviewText(cleanReportText(c.bodyTeaser, chart)),
          body: cleanReportText(c.body, chart),
        });
      }
    });
  }
  const chapters: DaewoonChapter[] = DAEWOON_CHAPTER_ORDER.map(
    (k) =>
      chaptersByKey.get(k) ?? {
        key: k,
        subtitle: DAEWOON_CHAPTER_META[k].title,
        bodyTeaser: "",
        body: "이 챕터는 잠시 못 가져왔어요. 새로고침해 보세요.",
      },
  );

  const sewunByYear = new Map<number, SewunCard>();
  if (Array.isArray(parsed.sewunCards)) {
    parsed.sewunCards.forEach((s) => {
      if (s && typeof s.year === "number") {
        sewunByYear.set(s.year, {
          year: s.year,
          ageKorean: typeof s.ageKorean === "number" ? s.ageKorean : 0,
          subtitle: cleanTemporalPerspective(s.subtitle ?? "", s.year, undefined, chart).trim(),
          body: cleanTemporalPerspective(s.body ?? "", s.year, undefined, chart).trim(),
        });
      }
    });
  }
  const sewunCards: SewunCard[] = years.map((y) =>
    sewunByYear.get(y.year) ?? {
      year: y.year,
      ageKorean: y.age + 1,
      subtitle: `${y.age + 1}세의 결`,
      body: "",
    },
  );

  const pastFromLLM = new Map<number, string>();
  if (Array.isArray(parsed.pastSummaries)) {
    parsed.pastSummaries.forEach((p) => {
      if (p && typeof p.index === "number") {
        pastFromLLM.set(p.index, cleanReportText(p.subtitle, chart));
      }
    });
  }
  const pastSummaries: PeriodSubtitle[] = chart.daewoonList
    .filter((d) => d.index < cur.index)
    .map((d) => ({
      index: d.index,
      subtitle: pastFromLLM.get(d.index) || `${d.startAge}~${d.endAge}세`,
    }));

  const futureFromLLM = new Map<number, string>();
  if (Array.isArray(parsed.futureTeasers)) {
    parsed.futureTeasers.forEach((p) => {
      if (p && typeof p.index === "number") {
        futureFromLLM.set(p.index, cleanReportText(p.subtitle, chart));
      }
    });
  }
  const futureTeasers: PeriodSubtitle[] = chart.daewoonList
    .filter((d) => d.index > cur.index)
    .map((d) => ({
      index: d.index,
      subtitle: futureFromLLM.get(d.index) || `${d.startAge}~${d.endAge}세`,
    }));

  const fallbackHeadline = `${input.name}님의 ${cur.startAge}~${cur.endAge}세 대운`;
  const parsedDos = Array.isArray(parsed.finalGuide?.dos)
    ? parsed.finalGuide.dos.filter((v): v is string => typeof v === "string").slice(0, 3)
    : [];
  const parsedAvoids = Array.isArray(parsed.finalGuide?.avoids)
    ? parsed.finalGuide.avoids.filter((v): v is string => typeof v === "string").slice(0, 3)
    : [];
  const result: DaewoonReport = {
    currentIndex: focusIdx,
    hero: {
      headline: cleanReportText(parsed.hero?.headline ?? fallbackHeadline, chart),
      body: cleanPreviewText(cleanReportText(parsed.hero?.body, chart)),
    },
    overview: {
      title: cleanReportText(parsed.overview?.title ?? `${cur.startAge}~${cur.endAge}세 대운 총론`, chart),
      body: cleanReportText(parsed.overview?.body, chart),
    },
    chapters,
    sewunCards,
    secret: {
      title: cleanReportText(parsed.secret?.title ?? "흔들릴 때 꺼내볼 단 하나의 솔루션", chart),
      body: cleanReportText(parsed.secret?.body, chart),
    },
    finalGuide: {
      title: cleanReportText(parsed.finalGuide?.title ?? "지금 잡아야 할 것과 놓아야 할 것", chart),
      summary: cleanReportText(parsed.finalGuide?.summary, chart),
      dos: parsedDos.map((v) => cleanReportText(v, chart)).filter(Boolean),
      avoids: parsedAvoids.map((v) => cleanReportText(v, chart)).filter(Boolean),
      nextStep: cleanReportText(parsed.finalGuide?.nextStep, chart),
    },
    pastSummaries,
    futureTeasers,
  };

  await writeCacheFile(key, JSON.stringify(result), {
    kind: "daewoonReport",
    tier: lite ? "lite" : "full",
  });
  return result;
}

export type YearListItem = {
  year: number;
  age: number;
  ageKorean: number;
  subtitle: string;
};

export type YearlyOverview = {
  currentYear: {
    year: number;
    age: number;
    ageKorean: number;
    headline: string;
    teaser: string;
  };
  pastYears: YearListItem[];
  futureYears: YearListItem[];
};

export async function generateYearlyOverview(
  input: SajuInput,
  chart: SajuChart,
): Promise<YearlyOverview> {
  const key = cacheKey("yearlyOverview", "v2-temporal", inputHash(input), contextHashSuffix(input));
  const cached = await readCache(key);
  if (cached) {
    try {
      return JSON.parse(cached) as YearlyOverview;
    } catch {
      // regenerate
    }
  }

  const now = currentKstDateParts();
  const thisYear = now.year;
  const currentItem = chart.yearlyList.find((y) => y.year === thisYear) ?? chart.yearlyList[0];
  const pastList = chart.yearlyList.filter((y) => y.year < thisYear);
  const futureList = chart.yearlyList.filter((y) => y.year > thisYear);

  const fmt = (y: typeof chart.yearlyList[number]) =>
    `- ${y.year}년 (만 ${y.age}세 / 한국나이 ${y.age + 1}세) — 천간 ${pillarToKorean(y.pillar).split(" ")[0]} · 지지 ${pillarToKorean(y.pillar).split(" ")[1]}`;

  const ctxLove = input.loveStatus ?? "미선택";
  const ctxJob = input.jobStatus ?? "미선택";

  const system = `${BARA_VOICE}

[작업]
${input.name}님의 한 해 흐름 리스트 화면용 카피 생성. 핵심은 **올해(${thisYear}년)** — HERO 헤드라인 + 1~2줄 호기심 갭 티저. 과거/미래는 한 줄 부제만.

[일간] ${chart.dayMaster.korean} (${chart.dayMaster.element})
[현재 상황] 연애: ${ctxLove} / 직업: ${ctxJob}

[올해 — ${currentItem.year}년 (한국나이 ${currentItem.age + 1}세)]
${fmt(currentItem)}

[과거 ${pastList.length}년]
${pastList.map(fmt).join("\n") || "(없음)"}

[미래 ${futureList.length}년]
${futureList.map(fmt).join("\n") || "(없음)"}

[규칙 — 매우 중요]
- 한자(甲, 寅 등) 노출 금지. 모든 사주 용어는 한글로.
- 콜드리딩 금지. "조화" / "균형" / "긍정적 에너지" 금지.
- 현재 기준일은 KST ${now.iso}이다.
- 과거 목록(${pastList.map((y) => `${y.year}년`).join(", ") || "없음"})은 이미 지난 해다. 과거 subtitle에는 "다가오는", "잡아야 하는", "기회가 오는" 같은 미래형을 쓰지 않는다.
- 미래 목록(${futureList.map((y) => `${y.year}년`).join(", ") || "없음"})에만 미래형·준비형 표현을 쓸 수 있다.

[올해 HERO 카피]
- headline (14~26자): "[한국나이]세 [이름]님, [올해 핵심 변화 + 이모지]" 형식. 예: "${currentItem.age + 1}세 ${input.name}님, 일과 사랑이 같이 터지는 불꽃 해 🔥"
- teaser (60~110자, 2~3문장): 올해 천간·지지와 일간의 관계를 1회 자연 인용. 마지막은 "안에서 알려드릴게요" / "—" 호기심 갭으로 마무리.

[과거/미래 subtitle]
- 각 14~22자, 명사형 키워드. 예: "기회와 정리가 같이 오는 해", "문서운 살아나는 해"
- 추상 라벨 금지. 그 해의 분위기를 한 줄로.

[출력 — JSON]
{
  "currentYear": {
    "year": ${currentItem.year},
    "age": ${currentItem.age},
    "ageKorean": ${currentItem.age + 1},
    "headline": "...",
    "teaser": "..."
  },
  "pastYears": [${pastList
    .map(
      (y) =>
        `{ "year": ${y.year}, "age": ${y.age}, "ageKorean": ${y.age + 1}, "subtitle": "..." }`,
    )
    .join(", ")}],
  "futureYears": [${futureList
    .map(
      (y) =>
        `{ "year": ${y.year}, "age": ${y.age}, "ageKorean": ${y.age + 1}, "subtitle": "..." }`,
    )
    .join(", ")}]
}
`;

  const userPrompt = inputBlock(input, chart);
  const raw = await chat(system, userPrompt, 2500, { json: true, temperature: 0.8, lite: true });

  let parsed: Partial<YearlyOverview> = {};
  try {
    parsed = JSON.parse(raw) as Partial<YearlyOverview>;
  } catch {
    // fall through
  }

  const pastByYear = new Map<number, string>();
  if (Array.isArray(parsed.pastYears)) {
    parsed.pastYears.forEach((p) => {
      if (p && typeof p.year === "number") {
        pastByYear.set(p.year, (p.subtitle ?? "").trim());
      }
    });
  }
  const futureByYear = new Map<number, string>();
  if (Array.isArray(parsed.futureYears)) {
    parsed.futureYears.forEach((p) => {
      if (p && typeof p.year === "number") {
        futureByYear.set(p.year, (p.subtitle ?? "").trim());
      }
    });
  }

  const result: YearlyOverview = {
    currentYear: {
      year: currentItem.year,
      age: currentItem.age,
      ageKorean: currentItem.age + 1,
      headline:
        (parsed.currentYear?.headline ?? `${currentItem.age + 1}세 ${input.name}님의 ${currentItem.year}년`).trim(),
      teaser: cleanTemporalPerspective(parsed.currentYear?.teaser ?? "", currentItem.year).trim(),
    },
    pastYears: pastList.map((y) => ({
      year: y.year,
      age: y.age,
      ageKorean: y.age + 1,
      subtitle: cleanTemporalPerspective(pastByYear.get(y.year) || `${y.year}년 회고`, y.year),
    })),
    futureYears: futureList.map((y) => ({
      year: y.year,
      age: y.age,
      ageKorean: y.age + 1,
      subtitle: cleanTemporalPerspective(futureByYear.get(y.year) || `${y.year}년 흐름`, y.year),
    })),
  };

  await writeCacheFile(key, JSON.stringify(result), {
    kind: "yearlyOverview",
    tier: "lite",
  });
  return result;
}

// ============================================================
// 세운 (특정 연도) — 12개월 + 6대 운세 + 시크릿 솔루션 (잠금 정책)
// ============================================================

export type YearMonth = {
  month: number;
  subtitle: string;       // 무료
  bodyTeaser: string;     // 무료 (첫 1~2줄)
  body: string;           // 잠금 (4~5문장 본문)
  isSampleFree: boolean;  // 1~3월 true
};

export type FortuneKey = "love" | "relationship" | "money" | "work" | "health" | "growth";

export type YearFortune = {
  key: FortuneKey;
  subtitle: string;       // 무료
  bodyTeaser: string;     // 무료 (첫 1줄)
  body: string;           // 잠금
};

export type YearSecret = {
  emoji: string;
  title: string;
  body: string;
  isLocked: boolean;      // [0]만 false
};

export type YearDetail = {
  year: number;
  headline: string;
  overview: string;
  months: YearMonth[];
  fortunes: YearFortune[];
  secret: YearSecret[];
};

export const YEAR_FORTUNE_META: Record<FortuneKey, { emoji: string; title: string }> = {
  love: { emoji: "💞", title: "연애" },
  relationship: { emoji: "🤝", title: "인간관계" },
  money: { emoji: "💰", title: "금전" },
  work: { emoji: "💼", title: "직업" },
  health: { emoji: "🌱", title: "건강" },
  growth: { emoji: "📚", title: "배움·성장" },
};

export const YEAR_FORTUNE_ORDER: FortuneKey[] = [
  "love",
  "relationship",
  "money",
  "work",
  "health",
  "growth",
];

export const SECRET_SLOTS = [
  { emoji: "🌵", title: "오행 긴급 처방" },
  { emoji: "🚀", title: "핵심 기회" },
  { emoji: "💣", title: "가장 조심할 점" },
  { emoji: "💖", title: "실천 행동 강령" },
] as const;

const FREE_SAMPLE_MONTHS = [1, 2, 3];

export async function generateYearDetail(
  input: SajuInput,
  chart: SajuChart,
  year: number,
  lite: boolean = false,
): Promise<YearDetail> {
  const target = chart.yearlyList.find((y) => y.year === year);
  if (!target) {
    throw new Error(`${year}년은 가져온 운세 범위에 없어요.`);
  }

  const key = cacheKey(
    "yearDetail",
    lite ? "lite-v8-direction" : "full-v8-direction",
    String(year),
    inputHash(input),
    contextHashSuffix(input),
  );
  const cached = await readCache(key);
  if (cached) {
    try {
      return JSON.parse(cached) as YearDetail;
    } catch {
      // regenerate
    }
  }

  const [stemKo, branchKo] = pillarToKorean(target.pillar).split(" ");
  const ctxLove = input.loveStatus ?? "미선택";
  const ctxJob = input.jobStatus ?? "미선택";
  const ageKorean = target.age + 1;
  const keySignals = computeKeySignals(chart);
  const keySignalsBlock = keySignals.map((s) => `- ${s}`).join("\n");
  const now = currentKstDateParts();
  const yearTiming = periodTimingLabel(year, undefined, now);
  const monthTimeline = Array.from({ length: 12 }, (_, i) => i + 1)
    .map((month) => `- ${month}월: ${periodTimingLabel(year, month, now)}`)
    .join("\n");

  const system = `${BARA_VOICE}

[작업]
${input.name}님의 ${year}년(한국나이 ${ageKorean}세) 1년치 세운을 풀어준다. 사주아이 톤(팩폭+친근+구체).

[작성 기준일/시제 — 최우선]
- 현재 날짜(KST): ${now.iso}
- 해설 대상 ${year}년은 현재 기준으로 "${yearTiming}" 해다.
- 지난 해/지난 월에는 미래형 권유 금지: "주목해 보세요", "기회가 옵니다", "준비하세요", "잡으세요", "활용하세요"를 쓰지 않는다.
- 지난 해/지난 월은 회고형으로 쓴다: "~한 흐름이었습니다", "~했을 가능성이 큽니다", "돌아보면", "점검해볼 지점입니다".
- 현재 해/현재 월은 현재 진행형으로, 미래 해/미래 월은 준비형으로 쓴다.

[${year}년 월별 시점]
${monthTimeline}

[일간(본인)] ${chart.dayMaster.korean} (${chart.dayMaster.element})
[${year}년의 천간/지지] ${stemKo} · ${branchKo}
[현재 상황] 연애: ${ctxLove} / 직업: ${ctxJob}
[이 명식의 핵심 단서 — 유료 본문에 최소 2종씩 인용]
${keySignalsBlock}

[규칙 — 매우 중요]
- 일간과 ${year}년 천간·지지의 관계를 1~2회 자연 한글로 인용 (한자 노출 금지).
- 십성(비견·식상·관성·재성·인성)·12운성·신살(도화살·역마살·문서운 등) 한글로 자연 사용.
- ${lite ? "무료 샘플은 짧고 선명하게." : "유료 본문은 PDF 리포트처럼 충분히 길고 촘촘하게. 결제 후 읽는 보상감이 있어야 한다."}
- 콜드리딩 금지. 추상 라벨 금지. 구체적 장면·행동으로. "중요합니다", "도움이 됩니다"만 반복 금지.
- ${ctxLove !== "미선택" || ctxJob !== "미선택" ? `현재 상황(${ctxLove}/${ctxJob})을 실제 장면에 반영. 예: 직업이 자영업이면 고객·거래처·매장·정산·가족 시간 같은 현실어 사용.` : "직업/연애 상황이 없으면 일반론 대신 명식 단서 중심으로."}
- 각 챕터는 서로 다른 영역만 다뤄.
- 문장 구조는 ①후킹 진단 ②명식 근거 ③현실 장면 ④주의점 ⑤행동 처방 순서.
- 행동 처방은 시간·장소·방향·색·금액·관계 유형 중 1개 이상을 넣어 구체화.
- 방향을 쓰는 경우 [결과지 전체 개운 처방 기준]의 추천 방위만 사용. 12개월·6대 운세·시크릿에서 서로 다른 방위를 섞지 않는다.

[12개월 — 정확히 12개 (1~12월)]
각 달마다:
- subtitle (14~26자): "구체 사건 + 운의 성격" 명사형. 예: "거래처 말 한마디가 돈이 되는 달".
- bodyTeaser (50~90자): 본문 첫 1~2문장. 호기심 갭으로 끝낼 것.
${lite ? '- body: 1~3월(샘플 무료)만 180~280자 본문 풀버전. 4~12월은 빈 문자열 "" 반환.' : "- body (430~620자, 6~8문장): 그 달의 분기점 + 명식 근거 2개 + 실제 장면 + 주의점 + 행동 처방. 2~3개 문단으로 나누고 문단 사이에는 \\n\\n을 넣어."}
- 반드시 위 [${year}년 월별 시점]을 따른다. 지난 월에는 미래형 권유를 하지 않는다.

[6대 운세 — 정확히 6개 (love/relationship/money/work/health/growth)]
각 운마다:
- subtitle (14~26자): "구체 사건 + 반전/주의" 명사형.
- bodyTeaser (40~70자): 본문 첫 1문장. 호기심 갭으로 끝낼 것.
${lite ? '- body: 빈 문자열 "" 반환.' : "- body (550~800자, 7~10문장): 영역별 큰 결론 + 명식 근거 2개 + 현실 상황 2개 + 주의점 + 행동 처방. 2~3개 문단으로 나누고 문단 사이에는 \\n\\n을 넣어."}

[6대 운세 영역 정의]
- love: 연애·배우자·썸·친밀감. 현재 연애 상태(${ctxLove})를 반영한다.
- relationship: 친구·동료·가족·평판·거리두기. 연애와 겹치지 말고 사회적 관계를 본다.
- money: 수입·지출·저축·투자·계약금.
- work: 직장·사업·고객·상사·업무 역할. 현재 직업 상태(${ctxJob})를 반영한다.
- health: 체력·수면·소화·멘탈·생활 리듬. 병명 확정 금지, 관리 포인트 중심.
- growth: 공부·자격증·취미·콘텐츠·자기계발. 학생이 아니어도 적용 가능한 성장운.

[시크릿 솔루션 — 정확히 4개 카드]
각 카드 (emoji + title은 고정):
1) 🌵 오행 긴급 처방 — 사주의 부족한 오행을 보충하는 1년 핵심 행동 (방위·색·물건·습관 1개) — **무료 샘플, 항상 본문 작성**
2) 🚀 핵심 기회 — ${year}년 안에 잡으면 좋은 기회 1개 (시기·영역 구체화)
3) 💣 가장 조심할 점 — 피해야 할 결정·관계·시기 1개
4) 💖 실천 행동 강령 — 매일/매주 반복할 작은 행동 1개

${lite ? "각 카드 body: 1번(🌵)만 150~250자 풀 작성. 2/3/4번은 빈 문자열 \"\" 반환." : "각 카드 body 350~520자. 명식 근거 1개와 실행 방법 2개를 넣어."}
- 방위를 쓰는 경우 [결과지 전체 개운 처방 기준]의 추천 방위만 사용한다.

[overview (무료 스포일러)]
${lite ? "80~140자, 3~4문장." : "240~380자, 4~6문장."} ${year}년 한 해 전체 분위기 + 일간 관계 1회 인용. 호기심 갭으로 끝맺지 말고 단정으로. ${yearTiming === "지난" ? "이미 지난 해이므로 회고형으로 쓴다." : yearTiming === "현재" ? "현재 진행 중인 해로 쓴다." : "다가올 해로 쓴다."}

[headline (무료 HERO 제목)]
14~26자. ${
    yearTiming === "지난"
      ? `"[한국나이]세 ${input.name}님이 지나온 [${year}년 핵심 변화]" 형식.`
      : yearTiming === "현재"
        ? `"[한국나이]세 ${input.name}님, [올해 핵심 변화 + 이모지]" 형식.`
        : `"[한국나이]세 ${input.name}님에게 다가올 [${year}년 핵심 변화]" 형식.`
  }

[출력 — JSON]
{
  "headline": "...",
  "overview": "...",
  "months": [
    ${Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
      const sampleFree = m <= 3;
      return `{ "month": ${m}, "subtitle": "...", "bodyTeaser": "...", "body": "${lite && !sampleFree ? "" : "..."}" }`;
    }).join(",\n    ")}
  ],
  "fortunes": [
    { "key": "love", "subtitle": "...", "bodyTeaser": "...", "body": "${lite ? "" : "..."}" },
    { "key": "relationship", "subtitle": "...", "bodyTeaser": "...", "body": "${lite ? "" : "..."}" },
    { "key": "money", "subtitle": "...", "bodyTeaser": "...", "body": "${lite ? "" : "..."}" },
    { "key": "work", "subtitle": "...", "bodyTeaser": "...", "body": "${lite ? "" : "..."}" },
    { "key": "health", "subtitle": "...", "bodyTeaser": "...", "body": "${lite ? "" : "..."}" },
    { "key": "growth", "subtitle": "...", "bodyTeaser": "...", "body": "${lite ? "" : "..."}" }
  ],
  "secret": [
    { "emoji": "🌵", "title": "오행 긴급 처방", "body": "..." },
    { "emoji": "🚀", "title": "핵심 기회", "body": "${lite ? "" : "..."}" },
    { "emoji": "💣", "title": "가장 조심할 점", "body": "${lite ? "" : "..."}" },
    { "emoji": "💖", "title": "실천 행동 강령", "body": "${lite ? "" : "..."}" }
  ]
}
`;

  const userPrompt = inputBlock(input, chart);
  const raw = await chat(system, userPrompt, lite ? 3500 : 15000, {
    json: true,
    temperature: lite ? 0.8 : 0.72,
    lite,
  });

  let parsed: Partial<{
    headline: string;
    overview: string;
    months: { month: number; subtitle?: string; bodyTeaser?: string; body?: string }[];
    fortunes: { key: string; subtitle?: string; bodyTeaser?: string; body?: string }[];
    secret: { emoji?: string; title?: string; body?: string }[];
  }> = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    // fall through
  }

  // months
  const monthsByIdx = new Map<number, { subtitle: string; bodyTeaser: string; body: string }>();
  if (Array.isArray(parsed.months)) {
    parsed.months.forEach((m) => {
      if (m && typeof m.month === "number") {
        monthsByIdx.set(m.month, {
          subtitle: cleanTemporalPerspective(m.subtitle ?? "", year, m.month, chart).trim(),
          bodyTeaser: cleanTemporalPerspective(m.bodyTeaser ?? "", year, m.month, chart).trim(),
          body: cleanTemporalPerspective(m.body ?? "", year, m.month, chart).trim(),
        });
      }
    });
  }
  const birthHashSeed = inputHash(input);
  const filledMonths: YearMonth[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const m = monthsByIdx.get(month);
    const poolSubtitle = pickMonthSubtitle({
      yearStem: target.stem.hanja,
      dayMasterStem: chart.dayMaster.hanja,
      monthNo: month,
      birthHash: birthHashSeed,
      year,
    });
    return {
      month,
      subtitle: cleanTemporalPerspective(!lite && m?.subtitle ? m.subtitle : poolSubtitle, year, month, chart).trim(),
      bodyTeaser: cleanTemporalPerspective(m?.bodyTeaser || "", year, month, chart),
      body: cleanTemporalPerspective(m?.body || "", year, month, chart),
      isSampleFree: FREE_SAMPLE_MONTHS.includes(month),
    };
  });

  // fortunes
  const fortunesByKey = new Map<FortuneKey, { subtitle: string; bodyTeaser: string; body: string }>();
  if (Array.isArray(parsed.fortunes)) {
    parsed.fortunes.forEach((f) => {
      if (f && typeof f.key === "string" && YEAR_FORTUNE_ORDER.includes(f.key as FortuneKey)) {
        fortunesByKey.set(f.key as FortuneKey, {
          subtitle: cleanTemporalPerspective(f.subtitle ?? "", year, undefined, chart).trim(),
          bodyTeaser: cleanTemporalPerspective(f.bodyTeaser ?? "", year, undefined, chart).trim(),
          body: cleanTemporalPerspective(f.body ?? "", year, undefined, chart).trim(),
        });
      }
    });
  }
  const fortunes: YearFortune[] = YEAR_FORTUNE_ORDER.map((k) => {
    const f = fortunesByKey.get(k);
    return {
      key: k,
      subtitle: cleanTemporalPerspective(!lite && f?.subtitle
        ? f.subtitle
        : pickFortuneSubtitle({ key: k, birthHash: birthHashSeed, year })
      , year, undefined, chart).trim(),
      bodyTeaser: cleanTemporalPerspective(f?.bodyTeaser || "", year, undefined, chart),
      body: cleanTemporalPerspective(f?.body || "", year, undefined, chart),
    };
  });

  // secret — 4 slots, [0] is free
  const secretRaw = Array.isArray(parsed.secret) ? parsed.secret : [];
  const secret: YearSecret[] = SECRET_SLOTS.map((slot, i) => {
    const s = secretRaw[i];
    return {
      emoji: slot.emoji,
      title: cleanTemporalPerspective(s?.title ?? slot.title, year, undefined, chart).trim(),
      body: cleanTemporalPerspective(s?.body ?? "", year, undefined, chart).trim(),
      isLocked: i !== 0,
    };
  });

  const result: YearDetail = {
    year,
    headline: cleanTemporalPerspective(parsed.headline ?? `${ageKorean}세 ${input.name}님의 ${year}년`, year, undefined, chart).trim(),
    overview: cleanTemporalPerspective(parsed.overview ?? "", year, undefined, chart).trim(),
    months: filledMonths,
    fortunes,
    secret,
  };

  await writeCacheFile(key, JSON.stringify(result), {
    kind: "yearDetail",
    tier: lite ? "lite" : "full",
  });
  return result;
}
