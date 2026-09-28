import { defineField, defineType } from 'sanity'

export const dataSyncType = defineType({
  name: 'dataSync',
  title: 'Data Sync',
  type: 'document',
  fields: [
    defineField({
      name: 'sourceKey',
      title: 'Source Key',
      type: 'string',
      description: 'Stable identifier for this source revision.',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sourceRevision',
      title: 'Source Revision',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
      readOnly: true,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Succeeded', value: 'succeeded' },
          { title: 'Failed', value: 'failed' },
        ],
      },
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'completedAt',
      title: 'Completed At',
      type: 'datetime',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'reportCount',
      title: 'Reports Processed',
      type: 'number',
      readOnly: true,
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'runCount',
      title: 'Test Runs Processed',
      type: 'number',
      readOnly: true,
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'findingCount',
      title: 'Findings Processed',
      type: 'number',
      readOnly: true,
      validation: (rule) => rule.integer().min(0),
    }),
  ],
  preview: {
    select: {
      source: 'source',
      revision: 'sourceRevision',
      completedAt: 'completedAt',
    },
    prepare({ source, revision, completedAt }) {
      return {
        title: source ?? 'Data sync',
        subtitle: [revision, completedAt].filter(Boolean).join(' · '),
      }
    },
  },
})
