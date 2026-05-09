import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is it free?",
    answer:
      "Yes, you can use Frontpage for free with up to 20 feeds. We'll be introducing a Pro plan soon for power users.",
  },
  {
    question: "How does Guest Mode work?",
    answer:
      "Guest Mode lets you explore the app with a set of curated feeds. Your progress is stored as long as your browser session is valid and won't be saved permanently unless you create an account.",
  },
  {
    question: "What happens if I sign up after trying as a guest?",
    answer:
      "When you create an account, we'll offer to import your current feeds and read history from your guest session so you don't lose any progress.",
  },
  {
    question: "Can I add my own custom feeds?",
    answer:
      "Absolutely. While Guest Mode uses a curated selection, once you sign up you can add any valid RSS or Atom feed from your favorite blogs, newsletters, and changelogs.",
  },
  {
    question: "Can I import my feeds from another app?",
    answer:
      "Not yet, but soon. We're implementing support for OPML import, which is the standard format for feed readers like Feedly or Inoreader.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "Frontpage is built as a responsive web application that works perfectly on any mobile browser. You can even 'Add to Home Screen' for a native-like experience without an app store download.",
  },
  {
    question: "Does it support podcasts or newsletters?",
    answer:
      "If they provide an RSS or Atom feed, yes! Many newsletters now offer secret RSS feeds for easier consumption without the email clutter.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-noise">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-12 text-center">
          Questions?
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              key={i}
              value={`item-${i}`}
              className="border-border/50 px-4"
            >
              <AccordionTrigger className="text-lg font-medium hover:no-underline hover:text-primary transition-colors py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-text-secondary text-base leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
