import { useState } from "react"
import type { Tip } from "@/content/tips.ts"
import { Badge } from "@/components/ui/badge.tsx"
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"

export function TipList({ tips }: { tips: readonly { tip: Tip; index: number }[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  return (
    <ul className="grid gap-4" data-tip-list="">
      {tips.map(({ tip, index }) => {
        const expanded = open[index] === true
        return (
          <li key={`${index}-${tip.title}`} id={`tip-${index}`} className="scroll-mt-28">
            <Card className="lift-card">
              <CardHeader>
                {tip.tag ? (
                  <Badge variant="secondary" className="bg-highlight text-highlight-foreground">
                    {tip.tag}
                  </Badge>
                ) : null}
                <CardTitle className="text-xl text-card-foreground">{tip.title}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className={expanded ? "text-base text-muted-foreground" : "line-clamp-2 text-base text-muted-foreground"}>
                  {tip.summary}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  aria-expanded={expanded}
                  onClick={() => setOpen((current) => ({ ...current, [index]: !expanded }))}
                >
                  {expanded ? "Hide summary" : "Show summary"}
                </Button>
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
