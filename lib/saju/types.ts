export type Gender = "남" | "여";
export type CalendarType = "양력" | "음력";
export type LoveStatus = "솔로" | "연애 중" | "기혼";
export type JobStatus = "직장인" | "프리랜서" | "학생" | "자영업" | "무직";

export type SajuInput = {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: Gender;
  calendar: CalendarType;
  loveStatus?: LoveStatus;
  jobStatus?: JobStatus;
};

export const LOVE_STATUSES: LoveStatus[] = ["솔로", "연애 중", "기혼"];
export const JOB_STATUSES: JobStatus[] = ["직장인", "프리랜서", "학생", "자영업", "무직"];

export const BIRTH_TIMES = [
  { value: "모름", label: "시간 모름" },
  { value: "자시", label: "자시 (23:30 ~ 01:29)" },
  { value: "축시", label: "축시 (01:30 ~ 03:29)" },
  { value: "인시", label: "인시 (03:30 ~ 05:29)" },
  { value: "묘시", label: "묘시 (05:30 ~ 07:29)" },
  { value: "진시", label: "진시 (07:30 ~ 09:29)" },
  { value: "사시", label: "사시 (09:30 ~ 11:29)" },
  { value: "오시", label: "오시 (11:30 ~ 13:29)" },
  { value: "미시", label: "미시 (13:30 ~ 15:29)" },
  { value: "신시", label: "신시 (15:30 ~ 17:29)" },
  { value: "유시", label: "유시 (17:30 ~ 19:29)" },
  { value: "술시", label: "술시 (19:30 ~ 21:29)" },
  { value: "해시", label: "해시 (21:30 ~ 23:29)" },
] as const;
