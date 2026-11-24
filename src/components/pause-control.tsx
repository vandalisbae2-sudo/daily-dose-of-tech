const labels = {
  tagline: { pause: "Pause tagline", play: "Play tagline" },
  background: { pause: "Pause background", play: "Play background" },
  marquee: { pause: "Pause marquee", play: "Play marquee" },
} as const

export function PauseControl({
  paused,
  onToggle,
  name,
}: {
  paused: boolean
  onToggle: () => void
  name: keyof typeof labels
}) {
  const label = paused ? labels[name].play : labels[name].pause
  return (
    <button
      type="button"
      data-pause-control=""
      aria-pressed={paused}
      aria-label={label}
      onClick={onToggle}
      className="relative z-20 shrink-0 rounded-full border-2 border-current bg-background px-3 py-1 text-sm font-semibold text-foreground"
    >
      {label}
    </button>
  )
}
