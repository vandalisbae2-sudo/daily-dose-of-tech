import type { ReactNode } from "react"

export function PageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow?: string
  children?: ReactNode
}) {
  return (
    <header className="hero-rise rounded-3xl bg-primary px-5 py-8 text-primary-foreground sm:px-8 sm:py-10">
      {eyebrow ? (
        <p className="text-base font-bold sm:text-xl">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2 text-4xl leading-tight font-bold sm:text-6xl">{title}</h1>
      {children ? <div className="mt-4 grid max-w-3xl gap-3 text-lg">{children}</div> : null}
    </header>
  )
}
