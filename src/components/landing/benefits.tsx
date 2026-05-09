import {
  ArrowUpRight,
  BookOpen,
  FolderTree,
  Keyboard,
  Search,
  Smartphone,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "Editorial Reader",
    description:
      "Full-text reading experience with carefully tuned typography and distraction-free layout.",
    icon: BookOpen,
  },
  {
    title: "Instant Guest Access",
    description:
      "Try the full experience instantly. Browse curated tech feeds before even creating an account.",
    icon: Users,
  },
  {
    title: "Fast Triage",
    description:
      "Mark all as read in a single click across feeds or categories using optimized state logic.",
    icon: Zap,
  },
  {
    title: "Smart Categories",
    description:
      "Organize your tech news into custom categories that match your individual workflow.",
    icon: FolderTree,
  },
  {
    title: "Deep Search",
    description:
      "Find that article you read weeks ago with lightning-fast full-text search.",
    icon: Search,
  },
  {
    title: "Mobile Ready",
    description:
      "Read on the go with a fully responsive interface that feels native on any device.",
    icon: Smartphone,
  },
  {
    title: "Seamless Migration",
    description:
      "Bring your library with you. Import your existing subscriptions using standard OPML files.",
    icon: ArrowUpRight,
    isComingSoon: true,
  },
  {
    title: "Power User Tools",
    description:
      "Vim-style keyboard shortcuts and command palette for extreme efficiency.",
    icon: Keyboard,
    isComingSoon: true,
  },
];

export function Benefits() {
  return (
    <section id="features" className="py-24 md:py-32 bg-noise">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col space-y-4 mb-16 text-center">
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
            Built for tech professionals
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed">
            Every feature is designed to help you stay informed without the
            anxiety of a traditional inbox.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              key={i}
              className="group relative p-8 rounded-2xl border border-border bg-background hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon size={24} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-text-secondary leading-relaxed mb-4">
                {feature.description}
              </p>
              {feature.isComingSoon && (
                <div className="absolute right-0 px-8">
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs uppercase tracking-wider bg-warning/20"
                  >
                    Coming Soon
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
