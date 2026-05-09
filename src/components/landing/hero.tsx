"use client";

import { motion, type Variants } from "motion/react";
import Link from "next/link";
import AvatarList from "@/components/animata/avatar-list";
import { GuestButton } from "@/components/auth/guest-button";
import { Button } from "@/components/ui/button";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-noise py-24 md:py-32 lg:py-40">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center space-y-8"
        >
          <motion.h1
            variants={item}
            className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.1] max-w-4xl"
          >
            Your personalized front page for tech content
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed"
          >
            A calm, organized home for the blogs, newsletters, and changelogs
            you care about. Reading comfort of Instapaper meets the efficiency
            of Linear.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <GuestButton
              size="lg"
              variant="default"
              className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            />
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg rounded-full"
              asChild
            >
              <Link href="/sign-up">Create Account</Link>
            </Button>
          </motion.div>

          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row items-center gap-4 text-sm text-text-tertiary"
          >
            <AvatarList size="sm" className="pb-0 sm:pb-12" />
            <p>Join 1,000+ developers & designers</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-250 h-150 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
    </section>
  );
}
