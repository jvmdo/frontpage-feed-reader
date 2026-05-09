import { Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LANDING_USERS } from "@/lib/constants";

const testimonials = [
  {
    quote:
      "The only feed reader that actually looks like it was designed in this decade. It's the Linear of RSS.",
    user: LANDING_USERS[4],
  },
  {
    quote:
      "I've tried every RSS app out there. Frontpage is the first one that feels calm and professional, not addictive.",
    user: LANDING_USERS[3],
  },
  {
    quote:
      "The guest experience is a game changer. Trying the full product with curated feeds before signing up sold me instantly.",
    user: LANDING_USERS[2],
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
            Loved by readers
          </h2>
          <p className="text-lg text-text-secondary">
            Join hundreds of tech pros who switched to Frontpage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              key={i}
              className="p-8 rounded-2xl bg-background border border-border shadow-sm flex flex-col space-y-6 relative overflow-hidden group"
            >
              <Quote className="absolute -top-4 -right-4 h-24 w-24 text-primary/5 rotate-12 group-hover:text-primary/10 transition-colors" />
              <p className="text-lg leading-relaxed relative z-10 italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 mt-auto">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={t.user.image} alt={t.user.name} />
                  <AvatarFallback>
                    {t.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{t.user.name}</p>
                  <p className="text-xs text-text-tertiary">
                    {t.user.position}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
