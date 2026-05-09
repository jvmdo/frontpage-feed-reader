import Image from "next/image";
import { ReaderView } from "@/components/reader/reader-view";
import type { ItemWithSource } from "@/types";

export function MediaSection() {
  return (
    <section className="py-24 bg-bg-secondary relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="group/preview relative mx-auto max-w-5xl">
          {/* Desktop Preview */}
          <div className="group/desktop hidden md:block relative z-10 rounded-xl border border-border bg-background shadow-2xl overflow-hidden aspect-video cursor-default">
            <Image
              src="/screenshot.png"
              alt="Frontpage screenshot preview"
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1024px"
            />

            {/* Reader drawer - Only visible on hover-capable devices */}
            <div className="absolute z-20 inset-y-0 right-0 w-4/5 bg-background border-l border-border shadow-2xl group-hover/desktop:translate-x-0 translate-x-full transition-transform duration-500 ease-in-out overflow-hidden [@media(hover:none)]:hidden">
              <div className="scale-75 origin-top-left w-[133%] pt-2">
                <ReaderView data={MOCK_ITEM} className="py-4 px-6" />
              </div>
            </div>

            {/* Drawer shadow */}
            <div className="absolute z-10 inset-0 opacity-0 group-hover/desktop:opacity-15 transition-opacity bg-linear-to-r from-black to-background [@media(hover:none)]:hidden" />
          </div>

          {/* Mobile Preview */}
          <div className="group-hover/preview:opacity-0 transition-opacity relative z-20 mx-auto w-70 rounded-lg border-2 border-border shadow-2xl overflow-hidden aspect-9/19 md:absolute md:-bottom-12 md:right-6 md:mx-0 md:w-40 lg:w-56 xl:w-64 xl:-right-12">
            <Image
              src="/screenshot-mobile.png"
              alt="Frontpage mobile preview"
              fill={true}
              sizes="(max-width: 768px) 280px, (max-width: 1024px) 160px, (max-width: 1280px) 224px, 256px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const MOCK_ITEM: ItemWithSource = {
  item: {
    id: 1,
    title: "Introducing Frontpage",
    content: `
        <p>Keeping up with tech content today is scattered—dozens of blogs, newsletters, and release notes spread across bookmarks, email inboxes, and social threads. There’s no calm, organized home for everything you want to read.</p>
        <p><strong>Frontpage</strong> solves this by giving you a personalized front page for tech content. One place. Clean design. Your sources, your categories, your pace.</p>
        <h3>The Editorial Experience</h3>
        <p>We believe that the way you consume information affects how you process it. That’s why we’ve built a reader view that prioritizes typography and whitespace, transforming cluttered RSS feeds into a cohesive magazine experience.</p>
        <h3>Built for Your Workflow</h3>
        <ul>
          <li><strong>Smart Categories:</strong> Group your feeds by topic—Frontend, AI, DevOps, or Design.</li>
          <li><strong>Fast Triage:</strong> Clear your queue with one-click "Mark All as Read" and Vim-style keyboard shortcuts.</li>
          <li><strong>Zero Friction:</strong> Try the full product as a guest with curated content before even creating an account.</li>
        </ul>
        <p>Welcome to a better way to stay informed. Welcome to Frontpage.</p>
      `,
    url: "#",
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    feedId: 1,
    description: null,
    guid: "1",
    author: "Frontpage Team",
    rawPayload: undefined,
  },
  feed: {
    id: 1,
    title: "Frontpage News",
    url: "https://frontpage.dev/feed",
    iconUrl: "",
    lastFetchedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    description: null,
    language: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    healthStatus: "",
    httpEtag: null,
    httpLastModified: null,
  },
  isExcerpt: false,
  isRead: false,
  categoryName: null,
  categoryColor: null,
};
