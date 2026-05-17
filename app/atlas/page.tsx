import { getAtlas, listCreators } from '@/lib/data'
import { AtlasView } from '@/components/atlas-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Atlas — Crumb',
}

export default async function AtlasPage() {
  const [restaurants, creators] = await Promise.all([getAtlas(), listCreators()])
  return <AtlasView restaurants={restaurants} creators={creators} />
}
