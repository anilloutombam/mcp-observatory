import { getFindingsData } from '@/sanity/lib/findings'
import { FindingsView } from './findings-view'

export default async function FindingsPage() {
  let data

  try {
    data = await getFindingsData()
  } catch (error) {
    console.error('Unable to load findings', error)
    return (
      <main className="centered-state">
        <div>
          <span>!</span>
          <h1>Findings are unavailable</h1>
          <p>We couldn’t reach Sanity. Try again shortly.</p>
        </div>
      </main>
    )
  }

  return <FindingsView data={data} />
}
