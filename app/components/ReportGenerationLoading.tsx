import Image from "next/image";

type ReportGenerationLoadingProps = {
  icon?: string;
  visual?: "saju" | "daewoon" | "yearly";
  eyebrow: string;
  title: string;
  description: string;
  steps: string[];
};

const LOADER_IMAGES: Record<
  NonNullable<ReportGenerationLoadingProps["visual"]>,
  { src: string; label: string }
> = {
  saju: {
    src: "/images/loaders/saju-cutout.png",
    label: "사주바라 리포트를 정리하는 카피바라",
  },
  daewoon: {
    src: "/images/loaders/daewoon-cutout.png",
    label: "대운 흐름을 살피는 카피바라",
  },
  yearly: {
    src: "/images/loaders/yearly-cutout.png",
    label: "연도별 운세를 쓰는 카피바라",
  },
};

export default function ReportGenerationLoading({
  visual = "saju",
  eyebrow,
  title,
  description,
  steps,
}: ReportGenerationLoadingProps) {
  return (
    <section className="rounded-sb-xl bg-sb-paper px-5 py-6 text-center shadow-[0_14px_36px_rgba(91,74,54,0.08)]">
      <div
        className="mx-auto mb-4 flex h-[132px] w-[156px] items-center justify-center sb-loader-bob"
        aria-hidden="true"
      >
        <CapybaraLoaderVisual variant={visual} />
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sb-olive">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[clamp(22px,6vw,32px)] font-bold leading-tight text-sb-ink">
        {title}
      </h2>
      <p className="mt-5 break-keep text-[15px] font-semibold leading-relaxed text-sb-ink-2">
        {description}
      </p>

      <div className="mt-7 flex flex-col gap-3 text-left">
        {steps.map((step) => (
          <div
            key={step}
            className="flex items-center gap-3 rounded-full bg-[#F6EEDB] px-4 py-3 text-[14px] font-semibold text-sb-ink-2"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sb-gold" />
            <span>{step}</span>
          </div>
        ))}
      </div>

      <p className="mt-7 text-[13px] font-semibold text-sb-muted">
        보통 잠시 후 자동으로 결과가 이어서 표시됩니다.
      </p>
    </section>
  );
}

function CapybaraLoaderVisual({
  variant,
}: {
  variant: NonNullable<ReportGenerationLoadingProps["visual"]>;
}) {
  const image = LOADER_IMAGES[variant];

  return (
    <div className="relative h-[132px] w-[156px]" title={image.label}>
      <Image
        src={image.src}
        alt=""
        fill
        sizes="156px"
        className="object-contain drop-shadow-[0_12px_20px_rgba(91,74,54,0.12)]"
      />
    </div>
  );
}
