import type { Tip } from "@/content/tips.ts"
import { Badge } from "@/components/ui/badge.tsx"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"

export function TipList({ tips }: { tips: readonly Tip[] }) {
  return (
    <ul className="grid gap-4">
      {tips.map((tip, index) => (
        <li key={`${index}-${tip.title}`}>
          <Card>
            <CardHeader>
              {tip.tag ? (
                <Badge variant="secondary" className="bg-highlight text-highlight-foreground">
                  {tip.tag}
                </Badge>
              ) : null}
              <CardTitle className="text-xl text-card-foreground">
                {tip.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground">{tip.summary}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
