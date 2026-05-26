import type { Metadata } from "next";
import LegalPageShell, { LegalSection } from "@/app/components/LegalPageShell";

export const metadata: Metadata = {
  title: "환불 및 청약철회 정책 | 사주바라",
};

const UPDATED_AT = "2026년 5월 22일";

export default function RefundPage() {
  return (
    <LegalPageShell
      title="환불 및 청약철회 정책"
      description="유료 리포트와 유자 충전 상품의 환불 기준을 안내합니다."
      updatedAt={UPDATED_AT}
    >
      <LegalSection title="1. 기본 원칙">
        사주바라는 결제 화면에서 상품명, 금액, 제공 범위, 잠금 해제 대상을 안내합니다. 결제 전 내용을 확인한 뒤 구매해 주세요. 결제 오류나 중복 결제처럼 이용자에게 책임이 없는 문제는 확인 후 환불 또는 정정 처리합니다.
      </LegalSection>

      <LegalSection title="2. 디지털 콘텐츠 청약철회">
        사주·운세 리포트는 결제 후 즉시 생성되거나 열람 가능한 디지털 콘텐츠입니다. 결제 후 상세 본문 생성, 잠금 해제, 열람이 시작된 경우 단순 변심에 따른 청약철회가 제한될 수 있습니다. 단, 콘텐츠 생성 또는 열람이 시작되기 전에는 환불을 요청할 수 있습니다.
      </LegalSection>

      <LegalSection title="3. 환불 가능한 경우">
        중복 결제, 결제는 되었지만 유자가 충전되지 않거나 리포트가 열리지 않는 경우, 서비스 장애로 상당 시간 콘텐츠 이용이 불가능한 경우, 동일 상품의 중복 구매가 확인되는 경우에는 환불 또는 동일 가치의 이용권 복구를 제공합니다.
      </LegalSection>

      <LegalSection title="4. 환불이 제한될 수 있는 경우">
        이용자가 입력 정보를 최종 확인한 뒤 잘못 입력해 생성된 리포트, 이미 열람한 유료 본문, 사용 완료된 유자, 이벤트·프로모션으로 지급된 무료 유자, 이용자 기기 또는 네트워크 문제로 인한 일시적 이용 불편은 환불이 제한될 수 있습니다.
      </LegalSection>

      <LegalSection title="5. 유자 충전 환불">
        사용하지 않은 유료 유자는 환불 요청이 가능합니다. 일부 사용한 묶음 상품은 사용한 유자와 보너스 지급분을 차감한 뒤 남은 유료 유자에 대해 환불합니다. 무료 또는 보너스 유자는 현금 환불 대상이 아닙니다.
      </LegalSection>

      <LegalSection title="6. 환불 신청 방법">
        환불 신청은 support@sajubara.com 으로 결제일, 결제 금액, 구매 상품, 계정 이메일, 환불 사유를 보내 주세요. 접수 후 결제사 확인이 필요한 경우 처리에 영업일 기준 수 일이 걸릴 수 있습니다.
      </LegalSection>

      <LegalSection title="7. 미성년자 결제">
        미성년자가 법정대리인의 동의 없이 결제한 경우 관련 법령에 따라 취소를 요청할 수 있습니다. 단, 이미 사용한 디지털 콘텐츠 또는 재화가 있는 경우 처리 범위가 제한될 수 있습니다.
      </LegalSection>
    </LegalPageShell>
  );
}
