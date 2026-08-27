import { useNavigate } from 'react-router-dom'
import { Check, ChevronsUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useSession } from '@/store/session'
import { personaMeta } from '@/lib/nav'
import { useT } from '@/i18n'
import type { Persona } from '@/lib/types'
import { cn } from '@/lib/utils'

const order: Persona[] = ['member', 'employer', 'pensioner']

/**
 * The move the whole redesign rests on: persona is a switcher, not a login.
 * The dashboard changes; the account does not.
 */
export function PersonaSwitcher({ className }: { className?: string }) {
  const { persona, setPersona } = useSession()
  const navigate = useNavigate()
  const { t } = useT()
  const Icon = personaMeta[persona].icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-10 gap-2 pr-2 pl-3', className)}>
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="flex flex-col items-start leading-none">
            <span className="text-[0.625rem] font-normal text-muted-foreground">
              {t('persona.viewingAs')}
            </span>
            <span className="text-sm font-medium">{t(`persona.${persona}`)}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t('signin.oneAccount')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {order.map((p) => {
          const P = personaMeta[p].icon
          return (
            <DropdownMenuItem
              key={p}
              onSelect={() => {
                setPersona(p)
                navigate(personaMeta[p].home)
              }}
              className="gap-3 py-2.5"
            >
              <P className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex-1">
                <span className="block text-sm font-medium">{t(`persona.${p}`)}</span>
                <span className="block text-xs text-muted-foreground">{t(`persona.${p}.sub`)}</span>
              </span>
              {p === persona ? <Check className="size-4 text-ok" aria-hidden /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
