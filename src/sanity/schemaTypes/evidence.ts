import { defineField, defineType } from 'sanity'

export const evidenceType = defineType({
  name: 'evidence',
  title: 'Evidence',
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
      name: 'testRun',
      title: 'Test Run',
      type: 'reference',
      to: [{ type: 'testRun' }],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Log', value: 'log' },
          { title: 'Request', value: 'request' },
          { title: 'Response', value: 'response' },
          { title: 'Error', value: 'error' },
          { title: 'Recovery', value: 'recovery' },
          { title: 'Observation', value: 'observation' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'raw',
      title: 'Raw Evidence',
      type: 'text',
      rows: 10,
    }),

    defineField({
      name: 'capturedAt',
      title: 'Captured At',
      type: 'datetime',
    }),

    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
    }),
  ],

  preview: {
    select: {
      title: 'summary',
      type: 'type',
      implementation: 'testRun.implementation.name',
    },

    prepare({ title, type, implementation }) {
      return {
        title: title ?? 'Untitled evidence',
        subtitle: `${type ?? 'unknown'} · ${implementation ?? 'Unknown implementation'}`,
      }
    },
  },
})
