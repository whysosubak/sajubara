import type { Metadata } from "next";
import { LocalizedValue } from "@/app/components/LanguageProvider";
import LegalPageShell, { LegalSection } from "@/app/components/LegalPageShell";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 바라사주",
};

const UPDATED_AT = {
  ko: "2026년 6월 7일",
  en: "June 7, 2026",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title={{ ko: "개인정보처리방침", en: "Privacy Policy" }}
      description={{
        ko: "바라사주가 어떤 정보를 수집하고, 왜 사용하며, 어떻게 보관하는지 설명합니다.",
        en: "This policy explains what information BaraSaju collects, why it is used, and how it is stored.",
      }}
      updatedAt={UPDATED_AT}
    >
      <LegalSection title={{ ko: "1. 수집하는 개인정보", en: "1. Personal Information Collected" }}>
        <LocalizedValue
          ko="바라사주는 회원가입 및 로그인 과정에서 이메일, 소셜 로그인 식별자, 닉네임 또는 프로필 정보를 수집할 수 있습니다. 리포트 생성을 위해 이름, 생년월일, 출생시간, 성별, 양력/음력 여부, 관계, 연애·직업 상태, 저장한 사람 정보, 선택한 날짜와 목적 메모를 처리합니다. 결제 이용 시 결제 식별자, 상품명, 결제 금액, 결제 상태, 환불 처리 기록을 보관할 수 있습니다."
          en="During sign-up and login, BaraSaju may collect email address, social login identifiers, nickname, or profile information. To generate reports, we process name, birth date, birth time, gender, solar/lunar calendar type, relationship, relationship and work status, saved person information, selected dates, and purpose memos. For payments, we may store payment identifiers, product name, payment amount, payment status, and refund records."
        />
      </LegalSection>

      <LegalSection title={{ ko: "2. 이용 목적", en: "2. Purposes of Use" }}>
        <LocalizedValue
          ko="수집 정보는 계정 생성과 인증, 저장된 사람 관리, 사주·운세·컬러수비학 리포트 생성과 재열람, 유료 상품 결제 확인, 환불 및 고객지원, 부정 이용 방지, 서비스 품질 개선과 법령상 의무 이행에 사용됩니다."
          en="Collected information is used for account creation and authentication, saved profile management, saju, fortune, and color numerology report generation and reopening, paid product payment verification, refunds and support, abuse prevention, service quality improvement, and legal compliance."
        />
      </LegalSection>

      <LegalSection title={{ ko: "3. 생성형 AI와 외부 서비스 이용", en: "3. Generative AI and External Services" }}>
        <LocalizedValue
          ko="바라사주는 리포트 본문 생성을 위해 입력 정보와 명식 데이터 일부를 생성형 AI 서비스에 전송할 수 있습니다. 인증, 데이터 저장, 배포, 결제 처리를 위해 Supabase, Vercel, OpenAI, PortOne 및 PG사 등 외부 처리 업체를 이용할 수 있으며, 처리 업체와 처리 목적이 변경되는 경우 본 방침에 반영합니다."
          en="BaraSaju may send parts of input information and chart data to generative AI services to create report text. We may use external processors such as Supabase, Vercel, OpenAI, PortOne, and payment gateway providers for authentication, data storage, deployment, and payments. If processors or processing purposes change, this policy will be updated."
        />
      </LegalSection>

      <LegalSection title={{ ko: "4. 보유 및 파기", en: "4. Retention and Deletion" }}>
        <LocalizedValue
          ko="계정 정보와 저장 리포트는 회원 탈퇴 또는 삭제 요청 시까지 보관합니다. 전자상거래 관련 결제·환불 기록은 관련 법령에서 정한 기간 동안 보관할 수 있습니다. 보관 목적이 끝난 개인정보는 복구가 어렵도록 안전하게 파기합니다."
          en="Account information and saved reports are retained until account withdrawal or deletion request. E-commerce payment and refund records may be retained for the period required by applicable laws. Personal information whose retention purpose has ended is securely destroyed in a way that makes recovery difficult."
        />
      </LegalSection>

      <LegalSection title={{ ko: "5. 쿠키와 로컬 저장소", en: "5. Cookies and Local Storage" }}>
        <LocalizedValue
          ko="바라사주는 로그인 세션 유지, 결제 잠금 해제 상태 확인, 최근 본 사주와 보관함 표시를 위해 쿠키와 브라우저 로컬 저장소를 사용할 수 있습니다. 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 일부 기능이 제한될 수 있습니다."
          en="BaraSaju may use cookies and browser local storage to maintain login sessions, check paid unlock status, and display recently viewed saju and archive data. You may refuse cookie storage in browser settings, but some features may be limited."
        />
      </LegalSection>

      <LegalSection title={{ ko: "6. 이용자의 권리", en: "6. User Rights" }}>
        <LocalizedValue
          ko="이용자는 자신의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다. 다만 결제·분쟁 처리·법령상 보관 의무가 있는 정보는 해당 기간 동안 분리 보관될 수 있습니다."
          en="Users may request access, correction, deletion, or suspension of processing of their personal information. Information that must be retained for payment, dispute handling, or legal obligations may be separately stored for the required period."
        />
      </LegalSection>

      <LegalSection title={{ ko: "7. 안전성 확보 조치", en: "7. Security Measures" }}>
        <LocalizedValue
          ko="바라사주는 접근 권한 관리, 인증 정보 보호, 전송 구간 암호화, 운영 로그 점검 등 개인정보 보호를 위한 기술적·관리적 조치를 적용합니다."
          en="BaraSaju applies technical and administrative measures for personal information protection, including access control, protection of authentication information, encryption in transit, and operational log review."
        />
      </LegalSection>

      <LegalSection title={{ ko: "8. 개인정보 문의", en: "8. Privacy Contact" }}>
        <LocalizedValue
          ko="개인정보 관련 문의, 삭제 요청, 권리 행사는 support@barasaju.com 또는 하단 사업자 정보의 연락처로 접수합니다. 개인정보 보호책임자는 바라사주 운영자이며, 연락처와 사업자 정보가 변경되는 경우 본 방침과 서비스 하단 고지에 반영합니다."
          en="Privacy questions, deletion requests, and rights requests can be sent to support@barasaju.com or the contact information shown below. The privacy officer is the BaraSaju operator, and changes to contact details or business information will be reflected in this policy and the service footer notice."
        />
      </LegalSection>
    </LegalPageShell>
  );
}
