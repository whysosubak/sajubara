import type { Metadata } from "next";
import { LocalizedValue } from "@/app/components/LanguageProvider";
import LegalPageShell, { LegalSection } from "@/app/components/LegalPageShell";

export const metadata: Metadata = {
  title: "이용약관 | 바라사주",
};

const UPDATED_AT = {
  ko: "2026년 5월 22일",
  en: "May 22, 2026",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title={{ ko: "이용약관", en: "Terms of Service" }}
      description={{
        ko: "바라사주 서비스 이용, 유료 리포트 구매, 보관함 이용에 관한 기본 약속입니다.",
        en: "These terms explain the basic rules for using BaraSaju, purchasing paid reports, and using the archive.",
      }}
      updatedAt={UPDATED_AT}
    >
      <LegalSection title={{ ko: "1. 목적", en: "1. Purpose" }}>
        <LocalizedValue
          ko="본 약관은 바라사주가 제공하는 사주·운세·컬러수비학 콘텐츠, 유료 리포트, 유자 충전 및 보관함 서비스의 이용 조건과 절차를 정합니다."
          en="These terms set out the conditions and procedures for using BaraSaju’s saju, fortune, color numerology content, paid reports, yuzu top-ups, and archive services."
        />
      </LegalSection>

      <LegalSection title={{ ko: "2. 서비스 내용", en: "2. Service Details" }}>
        <LocalizedValue
          ko="바라사주는 입력한 이름, 생년월일, 출생시간, 성별, 양력/음력 여부, 현재 상황 등을 바탕으로 바라사주, 오늘의 운세, 대운해설, 연도별운세, 컬러바라 리포트를 제공합니다. 일부 영역은 무료로 제공되며, 상세 본문·특정 날짜 해석·저장 및 다운로드 기능은 유료 상품 또는 충전 재화 사용 후 제공될 수 있습니다."
          en="BaraSaju provides BaraSaju, Today’s Fortune, daewoon, yearly fortune, and Color Bara reports based on details such as name, birth date, birth time, gender, solar/lunar calendar type, and current context. Some areas are free, while full text, date-specific readings, saving, and download features may require a paid product or charged balance."
        />
      </LegalSection>

      <LegalSection title={{ ko: "3. 계정과 저장 정보", en: "3. Accounts and Saved Information" }}>
        <LocalizedValue
          ko="이용자는 정확한 정보를 입력해야 하며, 잘못 입력한 정보로 생성된 결과에 대한 책임은 이용자에게 있습니다. 이름, 관계, 출생시간 등 일부 정보는 수정할 수 있으나, 생년월일·성별·양력/음력 등 결과 산정의 핵심 정보는 구매 이력과 연결될 수 있어 변경이 제한될 수 있습니다. 대표 사주는 계정의 주요 무료 운세 기준으로 사용되며, 변경 정책은 서비스 화면에서 별도로 안내합니다."
          en="Users are responsible for entering accurate information and for results generated from incorrect inputs. Some details such as name, relationship, and birth time may be editable, but core calculation details such as birth date, gender, and solar/lunar calendar type may be restricted because they can be linked to purchase history. The primary saju is used as the basis for key free fortunes, and change rules are shown separately in the service."
        />
      </LegalSection>

      <LegalSection title={{ ko: "4. 유료 상품과 유자", en: "4. Paid Products and Yuzu" }}>
        <LocalizedValue
          ko="유료 리포트와 유자 충전 상품의 가격, 제공 범위, 차감 기준은 결제 화면에 표시됩니다. 현재 기준 최소 충전 단위는 1유자이며 1유자는 990원 상당의 서비스 이용권으로 설계됩니다. 이벤트 또는 운영 정책에 따라 무료 유자, 보너스 유자, 묶음 상품이 제공될 수 있습니다."
          en="Prices, included scope, and deduction rules for paid reports and yuzu top-ups are displayed on the payment screen. The current minimum top-up unit is 1 yuzu, designed as a service credit worth 990 won. Free yuzu, bonus yuzu, or bundles may be provided depending on events or operating policies."
        />
      </LegalSection>

      <LegalSection title={{ ko: "5. 참고용 콘텐츠 고지", en: "5. Reference-only Content Notice" }}>
        <LocalizedValue
          ko="바라사주의 모든 사주·운세·컬러수비학 결과는 오락, 자기이해, 의사결정 참고를 위한 콘텐츠입니다. 의학적 진단, 법률 판단, 재무·투자 조언, 심리상담 등 전문 서비스의 대체물이 아니며, 중요한 결정은 관련 전문가와 상담하시기 바랍니다."
          en="All saju, fortune, and color numerology results in BaraSaju are for entertainment, self-understanding, and decision-reference purposes. They do not replace professional services such as medical diagnosis, legal judgment, financial or investment advice, or counseling. Please consult qualified professionals for important decisions."
        />
      </LegalSection>

      <LegalSection title={{ ko: "6. 금지 행위", en: "6. Prohibited Conduct" }}>
        <LocalizedValue
          ko="타인의 개인정보를 무단 입력하거나, 생성 결과를 타인을 비방·위협·차별하는 목적으로 사용하는 행위, 서비스의 정상 운영을 방해하는 자동화 요청·무단 복제·역설계·대량 수집 행위는 금지됩니다."
          en="Users must not enter another person’s personal information without permission, use generated results to defame, threaten, or discriminate against others, or interfere with normal service operation through automated requests, unauthorized copying, reverse engineering, or bulk collection."
        />
      </LegalSection>

      <LegalSection title={{ ko: "7. 서비스 변경과 중단", en: "7. Changes and Suspension" }}>
        <LocalizedValue
          ko="바라사주는 운영, 보안, 제휴사 정책, 법령 변경, 시스템 점검 등의 사유로 서비스 일부를 변경하거나 일시 중단할 수 있습니다. 유료 이용 권리에 중대한 영향이 있는 경우 가능한 범위에서 사전 또는 사후 안내합니다."
          en="BaraSaju may change or temporarily suspend parts of the service for reasons such as operation, security, partner policies, legal changes, or system maintenance. If paid usage rights are materially affected, we will provide notice before or after the change where reasonably possible."
        />
      </LegalSection>

      <LegalSection title={{ ko: "8. 책임 제한", en: "8. Limitation of Liability" }}>
        <LocalizedValue
          ko="바라사주는 입력 정보와 시스템 상태에 따라 합리적으로 콘텐츠를 생성하지만, 결과의 특정 효과나 미래 사건을 보장하지 않습니다. 이용자가 콘텐츠를 참고해 내린 결정과 그 결과에 대해서는 이용자 본인의 판단과 책임이 우선합니다."
          en="BaraSaju reasonably generates content based on input information and system conditions, but does not guarantee any specific effect or future event. Users remain responsible for decisions made with reference to the content and for their outcomes."
        />
      </LegalSection>

      <LegalSection title={{ ko: "9. 문의", en: "9. Contact" }}>
        <LocalizedValue
          ko="서비스, 결제, 환불, 개인정보 관련 문의는 고객센터 이메일 support@barasaju.com 으로 접수합니다. 사업자 정보, 통신판매업 신고번호, 대표자명, 주소, 고객센터 운영시간 등 운영 정보는 서비스 하단과 정책 문서에 고지하며 변경 시 최신 내용으로 반영합니다."
          en="Questions about service, payment, refunds, or personal information can be sent to support@barasaju.com. Business information, e-commerce registration number, representative name, address, support hours, and other operating information are provided in the service footer and policy documents and will be updated when changed."
        />
      </LegalSection>
    </LegalPageShell>
  );
}
