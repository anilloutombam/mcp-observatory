import { getTestRunsData } from '@/sanity/lib/test-runs'
import { TestRunsView } from './test-runs-view'

export default async function TestRunsPage() {
  let data

  try {
    data = await getTestRunsData()
  } catch (error) {
    console.error('Unable to load test runs', error)
    return (
      <main className="centered-state">
        <div>
          <span>!</span>
          <h1>Test runs are unavailable</h1>
          <p>We couldn’t reach Sanity. Try again shortly.</p>
        </div>
      </main>
    )
  }

  return <TestRunsView data={data} />
}
