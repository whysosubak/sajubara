export type ColorNumerologyInput = {
  name?: string;
  lunarMonth: number;
  lunarDay: number;
};

export type ColorCode = {
  number?: number;
  color: string;
  colorKr: string;
  keyword: string;
  description: string;
  caution: string;
  hex: string;
};

export type ColorNumerologyReport = {
  name: string;
  month: number;
  day: number;
  soul: ColorCode & { season: string; element: string };
  stage: ColorCode & { number: number; room: string };
  cheat: ColorCode & { number: number };
  persona: {
    number: number;
    animal: string;
    keyword: string;
    description: string;
  };
  headline: string;
  therapy: {
    title: string;
    body: string;
    actions: string[];
  };
};

const SOUL_BY_MONTH: Array<ColorNumerologyReport["soul"]> = [
  {
    season: "봄",
    element: "목",
    color: "Green",
    colorKr: "그린",
    keyword: "성장형, 창의, 시작",
    description:
      "새로운 가능성을 먼저 발견하고, 사람과 일에 생기를 불어넣는 시작의 에너지입니다. 머릿속에 씨앗이 많고, 분위기를 부드럽게 살리는 힘이 강합니다.",
    caution: "시작은 빠르지만 마무리가 흐려질 수 있습니다.",
    hex: "#8FBF7A",
  },
  {
    season: "여름",
    element: "화",
    color: "Red",
    colorKr: "레드",
    keyword: "확장형, 열정, 속도",
    description:
      "마음이 움직이면 바로 행동으로 옮기는 확장의 에너지입니다. 존재감이 빠르게 드러나고, 주변을 데우는 추진력이 강합니다.",
    caution: "속도가 빠른 만큼 번아웃을 조심해야 합니다.",
    hex: "#E97866",
  },
  {
    season: "가을",
    element: "금",
    color: "Gold",
    colorKr: "화이트/골드",
    keyword: "결실형, 냉철, 분석",
    description:
      "흩어진 것을 정리하고 결과로 만드는 결실의 에너지입니다. 기준이 분명하고, 필요한 것과 아닌 것을 가르는 감각이 좋습니다.",
    caution: "판단이 빨라 차갑게 보일 수 있습니다.",
    hex: "#D9B75F",
  },
  {
    season: "겨울",
    element: "수",
    color: "Blue",
    colorKr: "블루/네이비",
    keyword: "저장형, 지혜, 본질",
    description:
      "밖으로 드러내기보다 안으로 깊게 저장하는 지혜의 에너지입니다. 본질을 오래 들여다보고, 조용히 쌓아 올릴수록 강해집니다.",
    caution: "생각이 깊어질수록 기분이 가라앉을 수 있습니다.",
    hex: "#6D91C6",
  },
];

const STAGE_BY_NUMBER: Record<number, ColorCode & { number: number; room: string }> = {
  1: {
    number: 1,
    room: "물의 방",
    color: "Blue",
    colorKr: "블루",
    keyword: "고독한 전문가",
    description:
      "혼자 깊게 파고들 때 실력이 쌓이는 무대입니다. 프리랜서, 연구, 상담, 전문직처럼 자기만의 깊이를 증명하는 환경이 잘 맞습니다.",
    caution: "혼자 버티는 시간이 길어질 수 있습니다.",
    hex: "#6D91C6",
  },
  2: {
    number: 2,
    room: "땅의 방",
    color: "Brown",
    colorKr: "브라운",
    keyword: "저축과 돌봄",
    description:
      "작게 모아 크게 만드는 무대입니다. 부동산, 저축, 생활 기반, 가족 돌봄처럼 안정적인 축적에서 힘이 생깁니다.",
    caution: "남을 챙기다 본인 욕구가 뒤로 밀릴 수 있습니다.",
    hex: "#A77A55",
  },
  3: {
    number: 3,
    room: "천둥의 방",
    color: "Magenta",
    colorKr: "마젠타",
    keyword: "권력과 도약",
    description:
      "판을 흔들고 앞으로 치고 나가는 무대입니다. 리더십, 창업, 조직 내 권한처럼 큰 결정을 맡을수록 에너지가 살아납니다.",
    caution: "기복이 커질 때는 대성대패의 폭도 커집니다.",
    hex: "#C35A9B",
  },
  4: {
    number: 4,
    room: "바람의 방",
    color: "Green",
    colorKr: "그린",
    keyword: "이동과 확장",
    description:
      "한곳에 갇히기보다 이동하며 길이 열리는 무대입니다. 여행, 무역, 외국어, 종교, 철학처럼 경계를 넘는 일이 잘 맞습니다.",
    caution: "관심사가 흩어지면 결과가 늦어질 수 있습니다.",
    hex: "#8FBF7A",
  },
  5: {
    number: 5,
    room: "중심의 방",
    color: "Yellow",
    colorKr: "옐로우",
    keyword: "사람을 모으는 허브",
    description:
      "중앙에서 조율하고 사람을 모으는 무대입니다. 중재, 운영, 기획, 커뮤니티처럼 흐름을 한곳에 모을 때 존재감이 커집니다.",
    caution: "자존심이 세지면 고립될 수 있습니다.",
    hex: "#E5C84D",
  },
  6: {
    number: 6,
    room: "하늘의 방",
    color: "Silver",
    colorKr: "실버",
    keyword: "명예와 연구",
    description:
      "쉽게 섞이기보다 수준과 기준으로 인정받는 무대입니다. 학문, 연구, 장인성, 자격과 명예가 쌓일수록 빛납니다.",
    caution: "인덕을 기대하기보다 실력으로 증명해야 편합니다.",
    hex: "#AEB8C2",
  },
  7: {
    number: 7,
    room: "연못의 방",
    color: "Pink",
    colorKr: "핑크",
    keyword: "말과 설득",
    description:
      "말, 표현, 영업, 콘텐츠로 길이 열리는 무대입니다. 즐거움과 매력을 전달할수록 사람의 마음이 움직입니다.",
    caution: "말이 힘인 만큼 구설도 함께 관리해야 합니다.",
    hex: "#F2A7B9",
  },
  8: {
    number: 8,
    room: "산의 방",
    color: "Olive",
    colorKr: "올리브",
    keyword: "축적과 늦은 성공",
    description:
      "장애물을 넘으며 자산을 쌓는 무대입니다. 부동산, 전문성, 신앙, 장기 프로젝트처럼 버티는 시간이 결과가 됩니다.",
    caution: "초반 지연을 실패로 오해하지 않는 것이 중요합니다.",
    hex: "#8D9D60",
  },
  9: {
    number: 9,
    room: "불의 방",
    color: "Violet",
    colorKr: "바이올렛",
    keyword: "명예와 예술",
    description:
      "빛나고 드러나는 무대입니다. 예술, 브랜딩, 인기, 명예, 이동이 얽히며 사람들 앞에서 색이 선명해집니다.",
    caution: "화려함 뒤에 에너지가 흩어질 수 있습니다.",
    hex: "#9C7AC7",
  },
};

const CHEAT_BY_NUMBER: Record<number, ColorCode & { number: number }> = {
  1: {
    ...STAGE_BY_NUMBER[1],
    keyword: "고난 후 성공",
    description:
      "인생의 뿌리를 단단히 세울수록 늦게라도 힘이 붙는 흐름입니다. 가족, 효도, 기반 정리가 운을 여는 첫 열쇠입니다.",
  },
  2: {
    ...STAGE_BY_NUMBER[2],
    keyword: "대기만성의 재물",
    description:
      "혼자 앞서가기보다 화합하며 모을 때 운이 커지는 흐름입니다. 재물은 한 번에 터지기보다 생활 기반처럼 천천히 두꺼워집니다.",
  },
  3: {
    ...STAGE_BY_NUMBER[3],
    keyword: "위기마다 레벨업",
    description:
      "파란만장해 보이는 사건이 오히려 권한과 실력을 키우는 흐름입니다. 흔들릴 때마다 판을 다시 잡는 힘이 있습니다.",
  },
  4: {
    ...STAGE_BY_NUMBER[4],
    keyword: "방랑과 철학",
    description:
      "정착보다 탐색에서 답이 나오는 흐름입니다. 종교, 철학, 외국, 새로운 배움이 인생의 방향을 열어줍니다.",
  },
  5: {
    ...STAGE_BY_NUMBER[5],
    keyword: "조직의 중심",
    description:
      "사람과 흐름이 모이는 자리에서 운이 열리는 흐름입니다. 자존심을 부드럽게 쓰면 리더십이 신뢰로 바뀝니다.",
  },
  6: {
    ...STAGE_BY_NUMBER[6],
    keyword: "늦깎이 장인",
    description:
      "빨리 인정받기보다 오래 갈고닦아 명예를 얻는 흐름입니다. 고독한 시간이 쌓여 나만의 이름표가 됩니다.",
  },
  7: {
    ...STAGE_BY_NUMBER[7],
    keyword: "말로 여는 운",
    description:
      "말, 설득, 표현, 매력이 운의 통로가 되는 흐름입니다. 말의 온도를 조절하면 사람과 돈이 함께 움직입니다.",
  },
  8: {
    ...STAGE_BY_NUMBER[8],
    keyword: "장애물 해결력",
    description:
      "막히는 일이 생길수록 해법을 찾는 힘이 선명해지는 흐름입니다. 늦은 수확형이라 오래 버틴 분야에서 크게 거둘 수 있습니다.",
  },
  9: {
    ...STAGE_BY_NUMBER[9],
    keyword: "역전의 불사조",
    description:
      "위기와 기회가 세 번쯤 크게 찾아오는 역전형 흐름입니다. 무너진 뒤 다시 빛나는 힘이 강합니다.",
  },
};

const PERSONA_BY_NUMBER: Record<
  number,
  ColorNumerologyReport["persona"]
> = {
  1: { number: 1, animal: "쥐", keyword: "신중", description: "작은 신호를 놓치지 않고 먼저 살피는 타입입니다." },
  2: { number: 2, animal: "소", keyword: "끈기", description: "느려 보여도 한 번 마음먹은 일은 끝까지 밀고 갑니다." },
  3: { number: 3, animal: "호랑이", keyword: "독립", description: "남의 기준보다 자기 판단으로 움직일 때 힘이 납니다." },
  4: { number: 4, animal: "토끼", keyword: "사교", description: "부드럽게 다가가 관계의 긴장을 풀어주는 모습이 있습니다." },
  5: { number: 5, animal: "용", keyword: "이상", description: "현실보다 한 단계 큰 그림을 먼저 보는 타입입니다." },
  6: { number: 6, animal: "뱀", keyword: "냉철", description: "감정보다 맥락과 계산을 먼저 읽는 관찰력이 있습니다." },
  7: { number: 7, animal: "말", keyword: "열정", description: "가슴이 움직이는 일에는 속도가 붙고 표현이 선명해집니다." },
  8: { number: 8, animal: "양", keyword: "희생", description: "내 몫을 조금 덜어 주변을 편하게 만드는 배려가 있습니다." },
  9: { number: 9, animal: "원숭이", keyword: "재치", description: "상황을 빠르게 읽고 유연하게 빠져나가는 순발력이 좋습니다." },
  10: { number: 10, animal: "닭", keyword: "완벽", description: "디테일과 기준을 챙기며 흐트러진 것을 정리합니다." },
  11: { number: 11, animal: "개", keyword: "신의", description: "한 번 마음을 준 사람에게 오래 책임감을 느낍니다." },
  12: { number: 12, animal: "돼지", keyword: "포용", description: "넓게 받아들이고 사람을 편안하게 만드는 그릇이 있습니다." },
};

export function analyzeColorNumerology(input: ColorNumerologyInput): ColorNumerologyReport {
  assertValidDate(input.lunarMonth, input.lunarDay);
  const name = input.name?.trim() || "당신";
  const soul = SOUL_BY_MONTH[Math.floor((input.lunarMonth - 1) / 3)];
  const stageNo = ((input.lunarDay - 1) % 9) + 1;
  const cheatNo = digitalRoot(input.lunarMonth + input.lunarDay);
  const personaNo = ((input.lunarDay - 1) % 12) + 1;
  const stage = STAGE_BY_NUMBER[stageNo];
  const cheat = CHEAT_BY_NUMBER[cheatNo];
  const persona = PERSONA_BY_NUMBER[personaNo];

  return {
    name,
    month: input.lunarMonth,
    day: input.lunarDay,
    soul,
    stage,
    cheat,
    persona,
    headline: `${name}님의 핵심 컬러는 ${cheat.colorKr}, ${headlineKeyword(cheat)}예요`,
    therapy: buildTherapy({ name, soul, stage, cheat, persona }),
  };
}

function headlineKeyword(cheat: ColorNumerologyReport["cheat"]): string {
  if (cheat.number === 8) return "막힌 일을 풀어내는 힘";
  return cheat.keyword;
}

function buildTherapy({
  name,
  soul,
  stage,
  cheat,
  persona,
}: {
  name: string;
  soul: ColorNumerologyReport["soul"];
  stage: ColorNumerologyReport["stage"];
  cheat: ColorNumerologyReport["cheat"];
  persona: ColorNumerologyReport["persona"];
}): ColorNumerologyReport["therapy"] {
  const supportColor =
    soul.color === "Red" ? "그린" :
    soul.color === "Blue" ? "옐로우" :
    soul.color === "Gold" ? "핑크" :
    "네이비";
  return {
    title: `${name}님에게 필요한 보완 컬러는 ${supportColor}예요`,
    body:
      `${soul.colorKr} 본질은 ${soul.keyword}의 장점이 있지만, ${soul.caution} ` +
      `이때 ${cheat.colorKr} 핵심 컬러를 억지로 밀어붙이기보다 ${stage.colorKr} 무대에 맞게 쓰면 운이 편해집니다. ` +
      `${persona.animal}의 ${persona.keyword} 가면은 관계에서 드러나는 습관이니, 너무 감추기보다 좋은 방식으로 꺼내 쓰는 것이 좋아요.`,
    actions: [
      `중요한 결정이 있는 날에는 ${cheat.colorKr} 계열 소품을 하나만 가까이 두세요.`,
      `${supportColor} 계열 공간이나 사람을 주 1회 이상 만나 에너지 균형을 맞추세요.`,
      `${stage.keyword}와 연결된 일을 한 달에 하나만 정해 작게 실행하세요.`,
    ],
  };
}

function digitalRoot(value: number): number {
  let n = Math.abs(value);
  while (n > 9) {
    n = String(n)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return n === 0 ? 9 : n;
}

function assertValidDate(month: number, day: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("음력 월은 1월부터 12월까지 입력해 주세요.");
  }
  if (!Number.isInteger(day) || day < 1 || day > 30) {
    throw new Error("음력 일은 1일부터 30일까지 입력해 주세요.");
  }
}
