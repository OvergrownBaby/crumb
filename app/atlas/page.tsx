import { getAtlas, listCreators } from '@/lib/data'
import { MOCK_MENTIONS } from '@/lib/mock-data'
import { AtlasView } from '@/components/atlas-view'

export const metadata = {
  title: 'Atlas — Crumb',
}

export default async function AtlasPage() {
  const [restaurants, creators] = await Promise.all([getAtlas(), listCreators()])
  // For v1 with mock data, ship all mentions; backend will eventually scope this.
  return (
    <AtlasView restaurants={restaurants} mentions={MOCK_MENTIONS} creators={creators} />
  )
}
