import type { Metadata } from "next";
import LegalPageShell, { LegalSection } from "@/app/components/LegalPageShell";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 사주바라",
};

const UPDATED_AT = "2026년 5월 22일";

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="개인정보처리방침"
      description="사주바라가 어떤 정보를 수집하고, 왜 사용하며, 어떻게 보관하는지 설명합니다."
      updatedAt={UPDATED_AT}
    >
      <LegalSection title="1. 수집하는 개인정보">
        사주바라는 회원가입 및 로그인 과정에서 이메일, 소셜 로그인 식별자, 닉네임 또는 프로필 정보를 수집할 수 있습니다. 리포트 생성을 위해 이름, 생년월일, 출생시간, 성별, 양력/음력 여부, 관계, 연애·직업 상태, 저장한 사람 정보, 선택한 날짜와 목적 메모를 처리합니다. 결제 이용 시 결제 식별자, 상품명, 결제 금액, 결제 상태, 환불 처리 기록을 보관할 수 있습니다.
      </LegalSection>

      <LegalSection title="2. 이용 목적">
        수집 정보는 계정 생성과 인증, 저장된 사람 관리, 사주·운세·컬러수비학 리포트 생성과 재열람, 유료 상품 결제 확인, 환불 및 고객지원, 부정 이용 방지, 서비스 품질 개선과 법령상 의무 이행에 사용됩니다.
      </LegalSection>

      <LegalSection title="3. 생성형 AI와 외부 서비스 이용">
        사주바라는 리포트 본문 생성을 위해 입력 정보와 명식 데이터 일부를 생성형 AI 서비스에 전송할 수 있습니다. 인증, 데이터 저장, 배포, 결제 처리를 위해 Supabase, Vercel, OpenAI, PortOne 및 PG사 등 외부 처리 업체를 이용할 수 있으며, 실제 출시 시 확정된 업체명과 처리 목적을 최신 방침에 반영합니다.
      </LegalSection>

      <LegalSection title="4. 보유 및 파기">
        계정 정보와 저장 리포트는 회원 탈퇴 또는 삭제 요청 시까지 보관합니다. 전자상거래 관련 결제·환불 기록은 관련 법령에서 정한 기간 동안 보관할 수 있습니다. 보관 목적이 끝난 개인정보는 복구가 어렵도록 안전하게 파기합니다.
      </LegalSection>

      <LegalSection title="5. 쿠키와 로컬 저장소">
        사주바라는 로그인 세션 유지, 결제 잠금 해제 상태 확인, 최근 본 사주와 보관함 표시를 위해 쿠키와 브라우저 로컬 저장소를 사용할 수 있습니다. 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 일부 기능이 제한될 수 있습니다.
      </LegalSection>

      <LegalSection title="6. 이용자의 권리">
        이용자는 자신의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다. 다만 결제·분쟁 처리·법령상 보관 의무가 있는 정보는 해당 기간 동안 분리 보관될 수 있습니다.
      </LegalSection>

      <LegalSection title="7. 안전성 확보 조치">
        사주바라는 접근 권한 관리, 인증 정보 보호, 전송 구간 암호화, 운영 로그 점검 등 개인정보 보호를 위한 기술적·관리적 조치를 적용합니다.
      </LegalSection>

      <LegalSection title="8. 개인정보 문의">
        개인정보 관련 문의, 삭제 요청, 권리 행사는 support@sajubara.com 으로 접수합니다. 실제 출시 전 개인정보 보호책임자명, 연락처, 사업자 정보를 확정해 본 방침에 반영합니다.
      </LegalSection>
    </LegalPageShell>
  );
}
