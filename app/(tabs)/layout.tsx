import TabBar from "@/app/components/TabBar";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sb-app-shell sb-tab-shell h-dvh flex flex-col w-full max-w-[420px] mx-auto">
      <style>{`
        .sb-tab-shell {
          --sb-tabbar-clearance: calc(112px + env(safe-area-inset-bottom));
        }

        .sb-tab-shell > .flex-1.overflow-y-auto {
          scroll-padding-bottom: var(--sb-tabbar-clearance);
        }

        .sb-tab-shell > .flex-1.overflow-y-auto::after {
          content: "";
          display: block;
          flex: 0 0 auto;
          height: var(--sb-tabbar-clearance);
          pointer-events: none;
        }

        @media print {
          .sb-tab-shell > .flex-1.overflow-y-auto::after {
            display: none !important;
          }
        }
      `}</style>
      {children}
      <TabBar />
    </div>
  );
}
