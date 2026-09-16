import { Link } from "@tanstack/react-router";

import dragonMark from "@/assets/dragon-mark.png";

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="border-b border-border/70 bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={dragonMark}
            alt="Brasão do dragão MAGIC BAR"
            width={816}
            height={816}
            className="h-11 w-11 object-contain"
          />
          <span className="leading-none">
            <span className="block text-[0.6rem] tracking-[0.42em] text-muted-foreground uppercase">
              Open Bar
            </span>
            <span className="font-display block text-xl font-bold tracking-tight">MAGIC BAR</span>
            <span className="block text-[0.6rem] tracking-[0.42em] text-muted-foreground uppercase">
              Eventos
            </span>
          </span>
        </Link>
        {subtitle ? (
          <span className="hidden text-xs tracking-[0.3em] text-muted-foreground uppercase sm:block">
            {subtitle}
          </span>
        ) : null}
      </div>
    </header>
  );
}