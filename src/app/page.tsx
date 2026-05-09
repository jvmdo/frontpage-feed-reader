import { redirect } from "next/navigation";
import { Benefits } from "@/components/landing/benefits";
import { FAQ } from "@/components/landing/faq";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { MediaSection } from "@/components/landing/media-section";
import { Testimonials } from "@/components/landing/testimonials";
import { getCurrentSession } from "@/lib/session";

export default async function Home() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero />
        <MediaSection />
        <Benefits />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
