import { defineArrayMember, defineField, defineType } from 'sanity'

export const findingType = defineType({
  name: 'finding',
  title: 'Finding',
  type: 'document',

  groups: [
    { name: 'finding', title: 'Review', default: true },
    { name: 'impact', title: 'Affected implementations' },
    { name: 'upstream', title: 'Upstream reporting' },
  ],

  fields: [
    defineField({
      name: 'sourceKey',
      title: 'Import Source ID',
      type: 'string',
      description: 'Stable source identifier used by idempotent importers.',
      readOnly: true,
      group: 'finding',
    }),

    defineField({
      name: 'testRun',
      title: 'Test Run',
      type: 'reference',
      to: [{ type: 'testRun' }],
      group: 'finding',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'statement',
      title: 'Finding',
      type: 'text',
      rows: 4,
      group: 'finding',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'finding',
      options: {
        list: [
          { title: 'Compatibility', value: 'compatibility' },
          { title: 'Recovery', value: 'recovery' },
          { title: 'Protocol Behavior', value: 'protocol-behavior' },
          { title: 'Transport', value: 'transport' },
          { title: 'Reliability', value: 'reliability' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'confidence',
      title: 'Confidence',
      type: 'number',
      description: 'Confidence score between 0 and 1.',
      group: 'finding',
      validation: (rule) => rule.min(0).max(1),
    }),

    defineField({
      name: 'status',
      title: 'Review Status',
      type: 'string',
      group: 'finding',
      options: {
        list: [
          { title: 'Needs Review', value: 'needs-review' },
          { title: 'Verified', value: 'verified' },
          { title: 'Rejected', value: 'rejected' },
        ],
      },
      initialValue: 'needs-review',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'supportingEvidence',
      title: 'Supporting Evidence',
      type: 'array',
      group: 'finding',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'evidence' }],
        }),
      ],
      validation: (rule) =>
        rule.unique().custom((value, context) => {
          const isVerified = context.document?.status === 'verified'
          return isVerified && (!value || value.length === 0)
            ? 'Verified findings require supporting evidence.'
            : true
        }),
    }),

    defineField({
      name: 'proposedBy',
      title: 'Proposed By',
      type: 'string',
      group: 'finding',
      options: {
        list: [
          { title: 'Agent', value: 'agent' },
          { title: 'Human', value: 'human' },
          { title: 'Importer', value: 'importer' },
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'affectedImplementations',
      title: 'Additional Affected Implementations',
      description:
        'Add implementations beyond the one referenced by the linked Test Run.',
      type: 'array',
      group: 'impact',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'implementation' }],
        }),
      ],
      validation: (rule) => rule.unique(),
    }),

    defineField({
      name: 'affectedVersions',
      title: 'Affected Versions',
      description:
        'Version numbers or ranges confirmed by evidence, for example 1.30.0 or <=2.2.0.',
      type: 'array',
      group: 'impact',
      of: [defineArrayMember({ type: 'string' })],
      validation: (rule) => rule.unique(),
    }),

    defineField({
      name: 'reportingStatus',
      title: 'Upstream Reporting Status',
      type: 'string',
      group: 'upstream',
      description:
        'Distinguishes original reports from evidence contributed to an existing issue.',
      options: {
        layout: 'radio',
        list: [
          { title: 'Not reported', value: 'not-reported' },
          { title: 'Reported by us', value: 'reported' },
          {
            title: 'Evidence added to an existing report',
            value: 'already-reported',
          },
          { title: 'Resolved upstream', value: 'resolved' },
          { title: 'Not actionable', value: 'not-actionable' },
        ],
      },
      initialValue: 'not-reported',
      validation: (rule) => [
        rule.required(),
        rule
          .custom((value, context) => {
            const reviewStatus = context.document?.status
            const hasUpstreamReport = [
              'reported',
              'already-reported',
              'resolved',
            ].includes(value ?? '')
            return reviewStatus === 'rejected' && hasUpstreamReport
              ? 'A rejected finding still points to an upstream report. Confirm this state is intentional.'
              : true
          })
          .warning(),
      ],
    }),

    defineField({
      name: 'upstreamRepository',
      title: 'Upstream Repository',
      description:
        'Repository in owner/name form, for example modelcontextprotocol/typescript-sdk.',
      type: 'string',
      group: 'upstream',
      hidden: ({ parent }) =>
        !['reported', 'already-reported', 'resolved'].includes(
          parent?.reportingStatus,
        ),
      validation: (rule) =>
        rule.custom((value, context) => {
          const reportingStatus = context.document?.reportingStatus
          const needsUpstream = [
            'reported',
            'already-reported',
            'resolved',
          ].some((status) => status === reportingStatus)
          if (needsUpstream && !value)
            return 'Repository is required for an upstream report.'
          if (value && !/^[^/\s]+\/[^/\s]+$/.test(value)) {
            return 'Use owner/repository format.'
          }
          return true
        }),
    }),

    defineField({
      name: 'upstreamIssueUrl',
      title: 'Upstream Issue URL',
      type: 'url',
      group: 'upstream',
      hidden: ({ parent }) =>
        !['reported', 'already-reported', 'resolved'].includes(
          parent?.reportingStatus,
        ),
      validation: (rule) =>
        rule.uri({ scheme: ['http', 'https'] }).custom((value, context) => {
          const reportingStatus = context.document?.reportingStatus
          const needsIssue = ['reported', 'already-reported', 'resolved'].some(
            (status) => status === reportingStatus,
          )
          return needsIssue && !value
            ? 'Issue URL is required for an upstream report.'
            : true
        }),
    }),

    defineField({
      name: 'upstreamIssueNumber',
      title: 'Issue Number',
      type: 'number',
      group: 'upstream',
      hidden: ({ parent }) =>
        !['reported', 'already-reported', 'resolved'].includes(
          parent?.reportingStatus,
        ),
      validation: (rule) =>
        rule
          .integer()
          .positive()
          .custom((value, context) => {
            const reportingStatus = context.document?.reportingStatus
            const needsIssue = [
              'reported',
              'already-reported',
              'resolved',
            ].includes(reportingStatus as string)
            return needsIssue && !value
              ? 'Issue number is required for an upstream report.'
              : true
          }),
    }),

    defineField({
      name: 'upstreamCommentUrl',
      title: 'Evidence Comment URL',
      description:
        'Direct link to the comment where we contributed reproduction details or evidence.',
      type: 'url',
      group: 'upstream',
      hidden: ({ parent }) =>
        !['reported', 'already-reported', 'resolved'].includes(
          parent?.reportingStatus,
        ),
      validation: (rule) =>
        rule.uri({ scheme: ['http', 'https'] }).custom((value, context) => {
          return context.document?.reportingStatus === 'already-reported' &&
            !value
            ? 'A direct evidence-comment URL is required for this status.'
            : true
        }),
    }),

    defineField({
      name: 'reportedAt',
      title: 'Reported or Commented At',
      type: 'datetime',
      group: 'upstream',
      hidden: ({ parent }) =>
        !['reported', 'already-reported', 'resolved'].includes(
          parent?.reportingStatus,
        ),
      validation: (rule) =>
        rule.custom((value, context) => {
          const reportingStatus = context.document?.reportingStatus
          const needsDate = [
            'reported',
            'already-reported',
            'resolved',
          ].includes(reportingStatus as string)
          return needsDate && !value
            ? 'Add the date when the issue was reported or evidence was contributed.'
            : true
        }),
    }),

    defineField({
      name: 'upstreamIssueState',
      title: 'Upstream Issue State',
      type: 'string',
      group: 'upstream',
      hidden: ({ parent }) =>
        !['reported', 'already-reported', 'resolved'].includes(
          parent?.reportingStatus,
        ),
      options: {
        layout: 'radio',
        list: [
          { title: 'Open', value: 'open' },
          { title: 'Closed', value: 'closed' },
        ],
      },
    }),

    defineField({
      name: 'resolutionSummary',
      title: 'Resolution Summary',
      description:
        'Explain how the issue was resolved or why the finding is not actionable.',
      type: 'text',
      rows: 3,
      group: 'upstream',
      hidden: ({ parent }) =>
        !['resolved', 'not-actionable'].includes(parent?.reportingStatus),
      validation: (rule) =>
        rule.custom((value, context) => {
          const reportingStatus = context.document?.reportingStatus
          return ['resolved', 'not-actionable'].some(
            (status) => status === reportingStatus,
          ) && !value
            ? 'Add a resolution summary for this status.'
            : true
        }),
    }),
  ],

  preview: {
    select: {
      statement: 'statement',
      status: 'status',
      reportingStatus: 'reportingStatus',
      implementation: 'testRun.implementation.name',
      category: 'category',
      repository: 'upstreamRepository',
      issueNumber: 'upstreamIssueNumber',
    },

    prepare({
      statement,
      status,
      reportingStatus,
      implementation,
      category,
      repository,
      issueNumber,
    }) {
      const reviewLabels: Record<string, string> = {
        'needs-review': 'Needs review',
        verified: 'Verified',
        rejected: 'Rejected',
      }
      const reportingLabels: Record<string, string> = {
        'not-reported': 'Not reported',
        reported: 'Reported by MCP Failure Lab',
        'already-reported': 'Evidence added to existing issue',
        resolved: 'Resolved upstream',
        'not-actionable': 'Not actionable upstream',
      }
      const issue =
        repository && issueNumber ? `${repository}#${issueNumber}` : repository

      return {
        title: statement ?? 'Untitled finding',
        subtitle: [
          reviewLabels[status] ?? 'Review status unset',
          implementation ?? 'Unknown implementation',
          category,
          issue,
          reportingLabels[reportingStatus] ?? 'Reporting status unset',
        ]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
