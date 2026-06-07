import { NextRequest, NextResponse } from "next/server";
import {
  MOCK_ENTITLEMENT_COOKIE,
  mergeMockPurchase,
  parseMockEntitlements,
  serializeMockEntitlements,
  type MockPlanId,
} from "@/lib/auth/mock-entitlements";
import { appendPaidParamsToReturnTo, sanitizeReturnTo } from "@/lib/payments/checkout";
import { recordVerifiedPaymentLedger } from "@/lib/payments/server-ledger";
import { currentKstYear } from "@/lib/saju/report-links";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CompletePaymentBody = {
  amount?: unknown;
  paymentId?: unknown;
  plan?: unknown;
  product?: unknown;
  returnTo?: unknown;
};

type PortOnePayment = {
  status?: string;
  amount?: {
    total?: number;
    paid?: number;
  };
  paidAmount?: number;
  totalAmount?: number;
};

const VALID_PLANS = new Set<MockPlanId>(["single", "today-pack", "life-pack"]);

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  let user;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return NextResponse.json(
      { error: "인증 서버 연결에 실패했습니다. Supabase 설정을 확인해주세요." },
      { status: 503 },
    );
  }

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const apiSecret = process.env.PORTONE_API_SECRET;
  if (!apiSecret) {
    return NextResponse.json(
      { error: "PORTONE_API_SECRET 환경변수가 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  let body: CompletePaymentBody;
  try {
    body = (await request.json()) as CompletePaymentBody;
  } catch {
    return NextResponse.json({ error: "결제 검증 요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const amount = Number(body.amount);
  const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
  const plan = typeof body.plan === "string" ? body.plan : "";
  const product = typeof body.product === "string" ? body.product : "";
  const returnTo = sanitizeReturnTo(typeof body.returnTo === "string" ? body.returnTo : undefined);

  if (!paymentId || !product || !VALID_PLANS.has(plan as MockPlanId) || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "결제 검증에 필요한 값이 부족합니다." }, { status: 400 });
  }

  const verified = await verifyPortOnePayment(paymentId, apiSecret);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: verified.status });
  }

  const paidAmount = readPaidAmount(verified.payment);
  if (verified.payment.status !== "PAID") {
    return NextResponse.json({ error: "아직 결제 완료 상태가 아닙니다." }, { status: 409 });
  }
  if (paidAmount === undefined || paidAmount < amount) {
    return NextResponse.json({ error: "승인 금액이 요청 금액과 일치하지 않습니다." }, { status: 409 });
  }

  const nowYear = currentKstYear();
  const ledgerResult = await recordVerifiedPaymentLedger({
    amount,
    metadata: { portoneStatus: verified.payment.status },
    nowYear,
    paymentId,
    plan: plan as MockPlanId,
    product,
    returnTo,
    userId: user.id,
  });

  if (!ledgerResult.ok && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "결제는 확인했지만 권한 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 503 },
    );
  }

  const current = parseMockEntitlements(request.cookies.get(MOCK_ENTITLEMENT_COOKIE)?.value);
  const entitlements = mergeMockPurchase({
    amount,
    current,
    nowYear,
    plan: plan as MockPlanId,
    product,
    returnTo,
  });
  const redirectTo = appendPaidParamsToReturnTo({
    amount,
    plan,
    returnTo,
  });

  const response = NextResponse.json({ ok: true, redirectTo });
  response.cookies.set(MOCK_ENTITLEMENT_COOKIE, serializeMockEntitlements(entitlements), {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

async function verifyPortOnePayment(
  paymentId: string,
  apiSecret: string,
): Promise<
  | { ok: true; payment: PortOnePayment }
  | { ok: false; error: string; status: number }
> {
  const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    cache: "no-store",
    headers: {
      Authorization: `PortOne ${apiSecret}`,
    },
  });

  if (!response.ok) {
    return {
      ok: false,
      error: "포트원 결제 내역을 확인하지 못했습니다.",
      status: response.status >= 500 ? 502 : 400,
    };
  }

  return { ok: true, payment: (await response.json()) as PortOnePayment };
}

function readPaidAmount(payment: PortOnePayment): number | undefined {
  if (typeof payment.amount?.paid === "number") return payment.amount.paid;
  if (typeof payment.amount?.total === "number") return payment.amount.total;
  if (typeof payment.paidAmount === "number") return payment.paidAmount;
  if (typeof payment.totalAmount === "number") return payment.totalAmount;
  return undefined;
}
