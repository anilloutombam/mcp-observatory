import type { StructureBuilder, StructureResolver } from 'sanity/structure'

const newestFirst = [{ field: '_createdAt', direction: 'desc' }] as const

function findingQueue(S: StructureBuilder, title: string, filter: string) {
  return S.documentList()
    .title(title)
    .schemaType('finding')
    .filter(filter)
    .defaultOrdering([...newestFirst])
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('MCP Failure Observatory')
    .items([
      S.listItem()
        .id('review-desk')
        .title('Review Desk')
        .child(
          S.list()
            .title('Review Desk')
            .items([
              S.listItem()
                .id('findings-needs-review')
                .title('Needs Review')
                .child(
                  findingQueue(
                    S,
                    'Needs Review',
                    '_type == "finding" && coalesce(status, "needs-review") == "needs-review"',
                  ),
                ),
              S.listItem()
                .id('findings-verified')
                .title('Verified')
                .child(
                  findingQueue(
                    S,
                    'Verified Findings',
                    '_type == "finding" && status == "verified"',
                  ),
                ),
              S.listItem()
                .id('findings-rejected')
                .title('Rejected')
                .child(
                  findingQueue(
                    S,
                    'Rejected Findings',
                    '_type == "finding" && status == "rejected"',
                  ),
                ),
              S.divider(),
              S.documentTypeListItem('finding').title('All Findings'),
            ]),
        ),
      S.listItem()
        .id('upstream-tracking')
        .title('Upstream Tracking')
        .child(
          S.list()
            .title('Upstream Tracking')
            .items([
              S.listItem()
                .id('upstream-not-reported')
                .title('Not Reported')
                .child(
                  findingQueue(
                    S,
                    'Verified · Not Reported',
                    '_type == "finding" && status == "verified" && reportingStatus == "not-reported"',
                  ),
                ),
              S.listItem()
                .id('upstream-reported')
                .title('Reported by MCP Failure Lab')
                .child(
                  findingQueue(
                    S,
                    'Reported by MCP Failure Lab',
                    '_type == "finding" && reportingStatus == "reported"',
                  ),
                ),
              S.listItem()
                .id('upstream-existing-report')
                .title('Evidence Added to Existing Issue')
                .child(
                  findingQueue(
                    S,
                    'Evidence Added to Existing Issue',
                    '_type == "finding" && reportingStatus == "already-reported"',
                  ),
                ),
              S.listItem()
                .id('upstream-resolved')
                .title('Resolved Upstream')
                .child(
                  findingQueue(
                    S,
                    'Resolved Upstream',
                    '_type == "finding" && reportingStatus == "resolved"',
                  ),
                ),
              S.listItem()
                .id('upstream-not-actionable')
                .title('Not Actionable')
                .child(
                  findingQueue(
                    S,
                    'Not Actionable Upstream',
                    '_type == "finding" && reportingStatus == "not-actionable"',
                  ),
                ),
            ]),
        ),
      S.divider(),
      S.listItem()
        .id('compatibility-data')
        .title('Compatibility Data')
        .child(
          S.list()
            .title('Compatibility Data')
            .items([
              S.documentTypeListItem('implementation').title('Implementations'),
              S.documentTypeListItem('scenario').title('Scenarios'),
              S.documentTypeListItem('testRun').title('Test Runs'),
              S.documentTypeListItem('evidence').title('Evidence'),
            ]),
        ),
      S.listItem()
        .id('data-operations')
        .title('Data Operations')
        .child(
          S.list()
            .title('Data Operations')
            .items([
              S.listItem()
                .id('recent-data-syncs')
                .title('Recent Data Syncs')
                .child(
                  S.documentTypeList('dataSync')
                    .title('Recent Data Syncs')
                    .defaultOrdering([
                      { field: 'completedAt', direction: 'desc' },
                    ]),
                ),
            ]),
        ),
    ])
