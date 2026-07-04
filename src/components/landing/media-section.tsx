import { RssIcon, XIcon } from "lucide-react";
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
            {/* Light Mode Desktop */}
            <Image
              src="/screenshot.png"
              alt="Frontpage desktop screenshot preview"
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1024px"
              className="dark:hidden block object-cover"
            />
            {/* Dark Mode Desktop */}
            <Image
              src="/screenshot-dark.png"
              alt="Frontpage desktop screenshot preview (dark mode)"
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1024px"
              className="hidden dark:block object-cover"
            />

            {/* Lightbox Backdrop */}
            <div className="absolute z-10 inset-0 bg-black/20 opacity-0 group-hover/desktop:opacity-100 transition-opacity duration-300 [@media(hover:none)]:hidden pointer-events-none" />

            {/* Lightbox Modal */}
            <div className="absolute z-20 inset-y-8 inset-x-30 bg-background rounded-xl shadow-2xl border border-border opacity-0 scale-95 group-hover/desktop:opacity-100 group-hover/desktop:scale-100 transition-all duration-300 ease-out flex flex-col overflow-hidden [@media(hover:none)]:hidden">
              {/* Mock Toolbar */}
              <div className="shrink-0 h-10 border-b border-border flex items-center px-3 gap-2">
                <div className="size-6 rounded-md hover:bg-muted flex items-center justify-center text-text-tertiary">
                  <XIcon size={18} />
                </div>
                <div className="h-5 w-px bg-border mx-1" />
                <div className="size-4 rounded-sm bg-primary/20 flex items-center justify-center text-primary">
                  <RssIcon size={12} />
                </div>
                <span className="text-xs text-text-secondary">
                  Frontpage Blog
                </span>
              </div>

              {/* Content Container2 */}
              <div className="overflow-y-auto">
                <div className="scale-[0.8] origin-top mx-[-10%]">
                  <ReaderView data={MOCK_ITEM} />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Preview */}
          <div className="group-hover/preview:opacity-0 transition-opacity relative z-20 mx-auto w-70 rounded-lg border-2 border-border shadow-2xl overflow-hidden aspect-9/19 md:absolute md:-bottom-12 md:right-6 md:mx-0 md:w-40 lg:w-56 xl:w-64 xl:-right-12">
            {/* Light Mode Mobile */}
            <Image
              src="/screenshot-mobile.png"
              alt="Frontpage mobile preview"
              fill={true}
              sizes="(max-width: 768px) 280px, (max-width: 1024px) 160px, (max-width: 1280px) 224px, 256px"
              className="dark:hidden block object-cover"
            />
            {/* Dark Mode Mobile */}
            <Image
              src="/screenshot-mobile-dark.png"
              alt="Frontpage mobile preview (dark mode)"
              fill={true}
              sizes="(max-width: 768px) 280px, (max-width: 1024px) 160px, (max-width: 1280px) 224px, 256px"
              className="hidden dark:block object-cover"
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
    textContent: "Keeping up with tech content today is scattered...",
    guid: "1",
    author: "Frontpage Team",
  },
  feed: {
    id: 1,
    title: "Frontpage Blog",
    url: "https://frontpage.com/feed.xml",
    iconUrl: "/favicon.ico",
    lastFetchedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    description: null,
    language: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    healthStatus: "ok",
    httpEtag: null,
    httpLastModified: null,
    isCurated: true,
  },
  isExcerpt: false,
  isRead: false,
  isBookmarked: false,
  bookmarkedAt: null,
  categoryName: null,
  categoryColor: null,
  isWatermarked: false,
};
