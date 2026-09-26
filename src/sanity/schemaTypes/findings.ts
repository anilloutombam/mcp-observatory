import { defineField, defineType } from 'sanity'

export const findingType = defineType({
  name: 'finding',
  title: 'Finding',
  type: 'document',

  fields: [
    defineField({
      name: 'testRun',
      title: 'Test Run',
      type: 'reference',
      to: [{ type: 'testRun' }],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'statement',
      title: 'Finding',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
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
      validation: (rule) => rule.min(0).max(1),
    }),

    defineField({
      name: 'status',
      title: 'Review Status',
      type: 'string',
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
      of: [
        {
          type: 'reference',
          to: [{ type: 'evidence' }],
        },
      ],
    }),

    defineField({
      name: 'proposedBy',
      title: 'Proposed By',
      type: 'string',
      options: {
        list: [
          { title: 'Agent', value: 'agent' },
          { title: 'Human', value: 'human' },
          { title: 'Importer', value: 'importer' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
  ],

  preview: {
    select: {
      statement: 'statement',
      status: 'status',
      implementation: 'testRun.implementation.name',
    },

    prepare({ statement, status, implementation }) {
      return {
        title: statement ?? 'Untitled finding',
        subtitle: `${implementation ?? 'Unknown implementation'} · ${status ?? 'unknown'}`,
      }
    },
  },
})
