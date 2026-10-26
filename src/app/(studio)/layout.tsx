import { ToastProvider } from "@/components/ui/toast";

export default function StudioGroupLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <main id="main">{children}</main>
    </ToastProvider>
  );
}
