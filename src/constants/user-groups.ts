export interface KnownUserGroup {
  id: number
  badge: string | null
  name: string
  description: string
}

export const KNOWN_USER_GROUPS: KnownUserGroup[] = [
  {
    id: 4,
    badge: 'GMT',
    name: 'Global Moderation Team',
    description: 'Keeping watch over the forums and in-game chat',
  },
  {
    id: 7,
    badge: 'NAT',
    name: 'Nomination Assessment Team',
    description: 'Managing the Beatmap Nominators',
  },
  {
    id: 11,
    badge: 'DEV',
    name: 'Developers',
    description: 'Making the game awesome by adding new features and fixing the bugs',
  },
  {
    id: 16,
    badge: 'ALM',
    name: 'osu! Alumni',
    description: 'Those known for their contributions who have since moved on',
  },
  {
    id: 22,
    badge: 'SPT',
    name: 'Technical Support Team',
    description: 'Help and assistance',
  },
  {
    id: 26,
    badge: null,
    name: 'Tournament Staff',
    description: 'Users with extended tournament management commands',
  },
  {
    id: 28,
    badge: 'BN',
    name: 'Beatmap Nominators',
    description: 'Users going above and beyond the call to ensure beatmaps get qualified',
  },
  {
    id: 29,
    badge: 'BOT',
    name: 'Chat Bots',
    description: 'Special accounts run by automated services instead of real people',
  },
  {
    id: 31,
    badge: 'LVD',
    name: 'Project Loved',
    description: 'Recognising the beatmaps that the community loves most',
  },
  {
    id: 32,
    badge: 'BN',
    name: 'Beatmap Nominators (Probationary)',
    description:
      'Probationary BN that await a positive evaluation to confirm their presence in the team as a full member.',
  },
  {
    id: 33,
    badge: 'PPY',
    name: 'ppy',
    description: 'Reserved for peppy, the creator of osu!',
  },
  {
    id: 35,
    badge: 'FA',
    name: 'Featured Artist',
    description: 'Musical creators who have partnered with osu!',
  },
  {
    id: 47,
    badge: null,
    name: 'Announce',
    description: 'Users with permission to send announcement chat messages',
  },
  {
    id: 48,
    badge: 'BSC',
    name: 'Beatmap Spotlight Curators',
    description: 'Responsible for selecting high-quality maps for the Beatmap Spotlights',
  },
  {
    id: 50,
    badge: 'TC',
    name: 'Tournament Committee',
    description: 'Helping ensure the tournament and contest scenes remain fair and fun for all',
  },
]

const KNOWN_USER_GROUPS_BY_ID = new Map(
  KNOWN_USER_GROUPS.map((group) => [group.id, group] as const),
)

export const getKnownUserGroupById = (
  groupId: number,
): KnownUserGroup | null => {
  return KNOWN_USER_GROUPS_BY_ID.get(groupId) ?? null
}

