import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-12 border-t border-border bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <span className="font-serif text-xl font-medium mb-4 block">
              Frontpage
            </span>
            <p className="text-text-secondary text-sm max-w-xs leading-relaxed">
              The high-performance feed reader for developers and designers who
              care about their reading environment.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-text-tertiary">
              <li>
                <Link
                  href="#features"
                  className="hover:text-primary transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/jvmdo/frontpage-feed-reader"
                  className="hover:text-primary transition-colors"
                >
                  Changelog
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/jvmdo/frontpage-feed-reader"
                  className="hover:text-primary transition-colors"
                >
                  Roadmap
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Developers</h4>
            <ul className="space-y-2 text-sm text-text-tertiary">
              <li>
                <a
                  href="https://jvmdo.vercel.app"
                  className="hover:text-primary transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="https://jvmdo.vercel.app"
                  className="hover:text-primary transition-colors"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="https://jvmdo.vercel.app"
                  className="hover:text-primary transition-colors"
                >
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-tertiary">
          <p>🄯 {new Date().getFullYear()} Frontpage. All lefts reserved.</p>
          <div className="flex gap-6">
            <a
              href="https://x.com/M3OWMENTUM/status/2053064646593044858?s=20"
              className="hover:text-primary transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://github.com/jvmdo/frontpage-feed-reader"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
