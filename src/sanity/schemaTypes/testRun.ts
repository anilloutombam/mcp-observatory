import { defineField, defineType } from 'sanity'

export const testRunType = defineType({
  name: 'testRun',
  title: 'Test Run',
  type: 'document',

  fields: [
    defineField({
      name: 'sourceKey',
      title: 'Import Source ID',
      type: 'string',
      description: 'Stable source identifier used by idempotent importers.',
      readOnly: true,
    }),

    defineField({
      name: 'sourceReportUrl',
      title: 'Source Report',
      type: 'url',
    }),

    defineField({
      name: 'testedOn',
      title: 'Tested On',
      type: 'date',
      description:
        'Report date when an exact execution timestamp is unavailable.',
    }),

    defineField({
      name: 'implementation',
      title: 'Implementation',
      type: 'reference',
      to: [{ type: 'implementation' }],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'version',
      title: 'Version',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'scenario',
      title: 'Scenario',
      type: 'reference',
      to: [{ type: 'scenario' }],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'transport',
      title: 'Transport',
      type: 'string',
      options: {
        list: [
          { title: 'stdio', value: 'stdio' },
          { title: 'Streamable HTTP', value: 'streamable-http' },
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Passed', value: 'passed' },
          { title: 'Failed', value: 'failed' },
          { title: 'Needs Review', value: 'needs-review' },
          { title: 'Unsupported', value: 'unsupported' },
          { title: 'Not Run', value: 'not-run' },
          { title: 'Not Applicable', value: 'not-applicable' },
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'startedAt',
      title: 'Started At',
      type: 'datetime',
      description: 'Exact execution time when available.',
    }),

    defineField({
      name: 'durationMs',
      title: 'Duration (ms)',
      type: 'number',
      validation: (rule) => rule.min(0),
    }),

    defineField({
      name: 'observations',
      title: 'Observations',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],

  preview: {
    select: {
      implementation: 'implementation.name',
      version: 'version',
      scenario: 'scenario.name',
      status: 'status',
    },

    prepare({ implementation, version, scenario, status }) {
      return {
        title: `${implementation ?? 'Unknown'} ${version ?? ''}`,
        subtitle: `${scenario ?? 'No scenario'} · ${status ?? 'unknown'}`,
      }
    },
  },
})
