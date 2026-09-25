type DartMarkProps = {
  className?: string;
};

// faviconと同じダーツの矢のシルエット。色は currentColor で親から受け取る
export function DartMark({ className }: DartMarkProps) {
  return (
    <svg
      viewBox="0 0 26 26"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <g transform="translate(13 13) rotate(-40)">
        <polygon points="-10,-4 -3,0 -10,4" />
        <rect x="-3" y="-0.5" width="5" height="1" />
        <rect x="2" y="-1.3" width="4" height="2.6" rx="0.8" />
        <polygon points="6,-1.7 6,1.7 11,0" />
      </g>
    </svg>
  );
}
