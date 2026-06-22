interface YatraLogoProps {
  size?: number;
  variant?: "full" | "icon";
  className?: string;
}

export function YatraLogo({ size = 32, variant = "full", className = "" }: YatraLogoProps) {
  const iconH = size;
  const iconW = size;

  const icon = (
    <svg
      width={iconW}
      height={iconH}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={variant === "icon" ? className : ""}
      aria-hidden="true"
    >
      {/* Circular background */}
      <circle cx="20" cy="20" r="19" fill="currentColor" fillOpacity="0.12" />
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />

      {/* Sun / compass rose above mountains */}
      <circle cx="20" cy="13" r="3.5" fill="currentColor" fillOpacity="0.9" />

      {/* Mountain range — left peak */}
      <path
        d="M4 30 L13 14 L19 24 L16 20 L22 30 Z"
        fill="currentColor"
        fillOpacity="0.55"
      />
      {/* Mountain range — centre peak (tallest) */}
      <path
        d="M13 30 L20 10 L27 30 Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      {/* Mountain range — right peak */}
      <path
        d="M21 30 L27 18 L33 30 Z"
        fill="currentColor"
        fillOpacity="0.45"
      />

      {/* Snow caps */}
      <path d="M20 10 L22.5 16 L17.5 16 Z" fill="white" fillOpacity="0.9" />

      {/* Ground / horizon */}
      <rect x="4" y="29.5" width="32" height="1.5" rx="0.75" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );

  if (variant === "icon") return icon;

  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`}>
      {icon}
      <span
        style={{ fontSize: size * 0.65, lineHeight: 1, letterSpacing: "-0.02em" }}
        className="font-bold tracking-tight"
      >
        Yatra
      </span>
    </span>
  );
}
