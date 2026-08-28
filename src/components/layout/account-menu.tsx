import { ChevronDown, LogOut, Settings2, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession } from '@/store/session'
import { useT } from '@/i18n'
import { useIdentity } from '@/hooks/use-identity'
import { cn } from '@/lib/utils'

/** There is no switching between personas without signing out. */
export function AccountMenu({ className }: { className?: string }) {
  const { persona, signOut } = useSession()
  const { t } = useT()
  const identity = useIdentity()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            className,
          )}
          aria-label={`${identity.name} — account menu`}
        >
          <span className="hidden text-right sm:block">
            <span className="block text-[0.8125rem] font-semibold leading-tight">{identity.name}</span>
            <span className="num block text-[0.6875rem] leading-tight text-muted-foreground">
              {identity.sub}
            </span>
          </span>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-[0.6875rem] font-bold text-primary-foreground">
            {identity.initials}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-semibold">{identity.name}</span>
          <span className="ident mt-0.5 block text-xs text-muted-foreground">{identity.sub}</span>
          <span className="mt-1.5 block text-xs text-muted-foreground">{t(`persona.${persona}`)}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2.5 py-2.5">
          <Link to="/profile">
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            {t('nav.profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2.5 py-2.5">
          <Link to="/settings">
            <Settings2 className="size-4 text-muted-foreground" aria-hidden />
            {t('nav.settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className="gap-2.5 py-2.5">
          <LogOut className="size-4 text-muted-foreground" aria-hidden />
          {t('nav.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
