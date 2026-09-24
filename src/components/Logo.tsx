export function Mark({ className = '' }: { className?: string }) {
  return <img src="/mark.png" alt="" className={`object-contain ${className}`} width={40} height={44} />
}

export function Logo() {
  return (
    <a href="/" className="flex items-center gap-2" aria-label="Found Again home">
      <Mark className="h-10 w-9" />
      <span className="font-display text-2xl font-semibold tracking-tight text-forest">found again</span>
    </a>
  )
}
