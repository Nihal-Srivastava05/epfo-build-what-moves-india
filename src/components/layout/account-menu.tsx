import { ChevronDown, LogOut } from 'lucide-react'
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
import { useData } from '@/store/data'
import { personaMeta } from '@/lib/nav'
import { useT } from '@/i18n'
import { fmtUan } from '@/lib/format'
import { establishments, personById } from '@/lib/mock/db'
import { cn } from '@/lib/utils'

/**
 * Who is signed in, and the way out. Each persona is a different real person
 * with a different identifier — an employee is not their own employer — so
 * there is no switching between them without signing out.
 */
export function AccountMenu({ className }: { className?: string }) {
  const { persona, signOut } = useSession()
  const pensioner = useData((s) => s.pensioner)
  const { t } = useT()
  const Icon = personaMeta[persona].icon

  const identity =
    persona === 'member'
      ? { name: personById('p-priya').name, sub: `UAN ${fmtUan(personById('p-priya').uan)}` }
      : persona === 'employer'
        ? { name: personById('p-hr').name, sub: establishments[0].name }
        : { name: personById('p-ram').name, sub: `PPO ${pensioner.ppo}` }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-10 gap-2 pr-2 pl-3', className)}
          aria-label={`${identity.name} — account menu`}
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
            {identity.name}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">{identity.name}</span>
          <span className="ident mt-0.5 block text-xs text-muted-foreground">{identity.sub}</span>
          <span className="mt-1.5 block text-xs text-muted-foreground">{t(`persona.${persona}`)}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className="gap-2.5 py-2.5">
          <LogOut className="size-4 text-muted-foreground" aria-hidden />
          {t('nav.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
