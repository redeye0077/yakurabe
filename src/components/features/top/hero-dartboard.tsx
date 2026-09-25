import { cn } from "@/lib/utils";

type HeroDartboardProps = {
  className?: string;
};

// 的に矢が1本刺さっている装飾イラスト。色は currentColor、濃淡は opacity で出す
export function HeroDartboard({ className }: HeroDartboardProps) {
  return (
    <svg
      viewBox="0 0 440 320"
      aria-hidden="true"
      className={cn("text-brand-brass", className)}
    >
      <g stroke="currentColor" strokeWidth="1.4" fill="none">
        <circle cx="330" cy="150" r="120" opacity="0.4" />
        <circle cx="330" cy="150" r="82" opacity="0.55" />
        <circle cx="330" cy="150" r="44" opacity="0.75" />
      </g>
      <circle cx="330" cy="150" r="6" fill="currentColor" opacity="0.9" />
      <g
        transform="translate(330 150) rotate(20) scale(6)"
        fill="currentColor"
      >
        <polygon points="-25,-5 -17,0 -25,5" />
        <rect x="-17" y="-0.6" width="6" height="1.2" />
        <rect x="-11" y="-1.5" width="5" height="3" rx="1" />
        <polygon points="-6,-2 -6,2 0,0" />
      </g>
    </svg>
  );
}
