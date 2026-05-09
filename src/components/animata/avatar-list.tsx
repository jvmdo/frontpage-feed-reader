import Image from "next/image";
import { LANDING_USERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AvatarData {
  name: string;
  position: string;
  image: string;
}

export default function AvatarList({
  size = "md",
  className,
  items,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  items?: AvatarData[];
}) {
  const avatars = items ?? LANDING_USERS;
  const sizes: Record<"sm" | "md" | "lg", string> = {
    lg: "m-3 size-6",
    md: "m-2 size-12",
    sm: "m-1 size-8",
  };

  return (
    <div className={cn("flex py-12", className)}>
      {avatars.map((item, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static list
          key={`${item.name}-${index}`}
          className={cn(
            "group/avatar relative z-0 flex scale-100 items-center transition duration-200 ease-in-out hover:z-10 hover:scale-110",
            index > 0 && "-ml-3",
          )}
        >
          <div className="relative overflow-hidden rounded-full bg-white">
            <div className="bg-size pointer-events-none absolute h-full w-full animate-bg-position from-primary from-30% via-success via-50% to-warning to-80% bg-size-[300%_auto] opacity-15 group-hover/avatar:bg-linear-to-r" />
            <div className="z-1 blur-lg" />
            <Image
              src={item.image}
              alt={item.name}
              className={cn(
                "rounded-full object-cover",
                sizes[size] ?? sizes.md,
              )}
              width={24}
              height={24}
            />
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-2 transform whitespace-nowrap rounded bg-popover p-2 text-popover-foreground opacity-0 transition duration-300 ease-in-out group-hover/avatar:-translate-y-2 group-hover/avatar:opacity-100">
            <div className="text-sm font-semibold">{item.name}</div>
            <div className="text-sm">{item.position}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
