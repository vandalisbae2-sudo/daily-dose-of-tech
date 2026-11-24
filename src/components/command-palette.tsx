import { buildSteps } from "@/content/pc-build-steps.ts"
import { insights } from "@/content/insights.ts"
import { navItems, site } from "@/content/site.ts"
import { tips } from "@/content/tips.ts"
import { withBase } from "@/lib/paths.ts"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.tsx"

function visit(href: string) {
  window.location.assign(href)
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search"
    >
      <CommandInput placeholder="Search" aria-label="Search" />
      <CommandList>
        <CommandEmpty>No results</CommandEmpty>
        <CommandGroup heading="Pages">
          {navItems.map((item) => (
            <CommandItem
              key={item.id}
              value={item.label}
              onSelect={() => visit(withBase(item.path))}
            >
              <span aria-hidden="true" data-section-icon="" className="size-2 shrink-0 rounded-full bg-primary" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {tips.length > 0 ? (
          <CommandGroup heading={site.tipsTitle}>
            {tips.map((tip, index) => (
              <CommandItem
                key={`${index}-${tip.title}`}
                value={`${tip.title} ${tip.summary} ${tip.tag ?? ""}`}
                onSelect={() => visit(`${withBase("/daily-tech-tips/")}#tip-${index}`)}
              >
                <span aria-hidden="true" data-section-icon="" className="size-2 shrink-0 rounded-full bg-secondary" />
                {tip.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {buildSteps.length > 0 ? (
          <CommandGroup heading={site.pcTitle}>
            {buildSteps.map((step, index) => (
              <CommandItem
                key={`${index}-${step.title}`}
                value={`${step.title} ${step.body}`}
                onSelect={() => visit(`${withBase("/pc-building/")}#step-${index}`)}
              >
                <span aria-hidden="true" data-section-icon="" className="size-2 shrink-0 rounded-full bg-highlight" />
                {step.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {insights.length > 0 ? (
          <CommandGroup heading={site.insightsTitle}>
            {insights.map((item, index) => (
              <CommandItem
                key={`${index}-${item.title}`}
                value={`${item.title} ${item.summary} ${item.group}`}
                onSelect={() => visit(`${withBase("/insights/")}#insight-${index}`)}
              >
                <span aria-hidden="true" data-section-icon="" className="size-2 shrink-0 rounded-full bg-primary" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  )
}
