import { getComparisonsData } from '@/sanity/lib/comparisons'
import { ComparisonsView } from './comparisons-view'

export default async function ComparisonsPage() {
  const data = await getComparisonsData()
  return <ComparisonsView data={data} />
}
