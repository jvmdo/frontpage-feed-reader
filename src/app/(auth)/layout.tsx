import { RssIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-secondary">
      <div className="relative hidden bg-muted lg:block">
        <Image
          alt=""
          src="/auth-layout-cover.jpg"
          className="object-cover"
          sizes="(max-width: 1024px) 0vw, 50vw"
          fill={true}
          priority={true}
          aria-hidden={true}
        />
      </div>
      <div className="relative flex flex-col gap-4 p-6 md:p-10 overflow-hidden">
        {/* Subtle Background Pattern: abstract feed lines */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 20h40M10 30h30M10 40h50M60 70h30M60 80h20M10 70h40M10 80h30' stroke='%23000' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: "150px 150px",
          }}
        />
        <Link href="/" className="flex">
          <span className="font-serif font-bold tracking-tight">Frontpage</span>
          <RssIcon size={12} className="text-primary" />
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm bg-background/30 backdrop-blur-lg p-4 rounded-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
