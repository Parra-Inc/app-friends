import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

export const metadata: Metadata = {
  title: { default: "Docs", template: "%s · App Friends Docs" },
  description: "Documentation for the App Friends network and SDKs.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-5 py-10">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-20">
            <DocsSidebar />
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <article className="max-w-2xl">{children}</article>
        </main>
      </div>
      <Footer />
    </>
  );
}
