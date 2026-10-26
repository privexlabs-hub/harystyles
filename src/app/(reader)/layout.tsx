import { MobileTabBar, ReaderTopNav } from "@/components/layout/reader-nav";
import { ToastProvider } from "@/components/ui/toast";

export default function ReaderLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <ReaderTopNav />
      <main id="main" className="pb-24 md:pb-0">
        {children}
      </main>
      <MobileTabBar />
    </ToastProvider>
  );
}
