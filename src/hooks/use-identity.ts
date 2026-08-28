import { useSession } from '@/store/session'
import { useData } from '@/store/data'
import { fmtUan } from '@/lib/format'
import { establishments, personById } from '@/lib/mock/db'

/**
 * Who is signed in, in one shape, for the rail, the top bar and the account
 * menu alike. Each persona is a different real person with a different
 * identifier — an employee is not their own employer.
 */
export function useIdentity() {
  const persona = useSession((s) => s.persona)
  const ppo = useData((s) => s.pensioner.ppo)

  if (persona === 'member') {
    const me = personById('p-priya')
    return { name: me.name, sub: `UAN ${fmtUan(me.uan)}`, initials: initialsOf(me.name) }
  }
  if (persona === 'employer') {
    const hr = personById('p-hr')
    return { name: hr.name, sub: establishments[0].name, initials: initialsOf(hr.name) }
  }
  const ram = personById('p-ram')
  return { name: ram.name, sub: `PPO ${ppo}`, initials: initialsOf(ram.name) }
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
