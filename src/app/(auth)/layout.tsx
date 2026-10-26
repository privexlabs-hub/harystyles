import { BrandLink } from "@/components/ui/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-[1280px] items-center px-4 md:px-10">
        <BrandLink />
      </header>
      <main id="main" className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-4 pb-16 pt-6">
        {children}
      </main>
    </div>
  );
}
