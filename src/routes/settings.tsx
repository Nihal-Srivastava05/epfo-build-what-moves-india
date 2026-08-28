import { toast } from 'sonner'
import { Gauge, Languages, Palette, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useSession, type ThemePref } from '@/store/session'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'

const themes: { key: ThemePref; label: string }[] = [
  { key: 'system', label: 'Match my device' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
]

export default function Settings() {
  const { lang, setLang, lite, setLite, theme, setTheme, signOut } = useSession()
  const resetDemo = useData((s) => s.resetDemo)
  const { t } = useT()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="space-y-4">
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Languages className="size-4 text-primary" aria-hidden />
            <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">{t('settings.language')}</h2>
          </div>
          <div className="flex gap-2">
            {(['en', 'hi'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn(
                  'rounded-md border-[1.35px] px-4 py-2.5 text-sm font-semibold transition-colors',
                  lang === l
                    ? 'border-brand bg-primary text-primary-foreground'
                    : 'border-border hover:border-brand hover:bg-muted',
                )}
              >
                {l === 'en' ? 'English' : 'हिन्दी'}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Hindi is complete for the public site, your home screen and the withdrawal flow. Other
            screens fall back to English rather than showing a half-translated page.
          </p>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="size-4 text-primary" aria-hidden />
            <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">{t('settings.lite')}</h2>
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox checked={lite} onCheckedChange={(v) => setLite(v === true)} className="mt-0.5" />
            <span className="text-sm leading-relaxed">
              {t('settings.liteSub')} System fonts instead of web fonts, no animation, no shadows.
            </span>
          </label>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Palette className="size-4 text-primary" aria-hidden />
            <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">{t('settings.theme')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {themes.map((th) => (
              <button
                key={th.key}
                type="button"
                onClick={() => setTheme(th.key)}
                className={cn(
                  'rounded-md border-[1.35px] px-4 py-2.5 text-sm font-semibold transition-colors',
                  theme === th.key
                    ? 'border-brand bg-primary text-primary-foreground'
                    : 'border-border hover:border-brand hover:bg-muted',
                )}
              >
                {th.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-dashed p-5">
          <div className="mb-2 flex items-center gap-2">
            <RotateCcw className="size-4 text-muted-foreground" aria-hidden />
            <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">{t('settings.reset')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t('settings.resetSub')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetDemo()
                toast.success('Demo data reset. Every account is back to its starting state.')
              }}
            >
              {t('settings.reset')}
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
