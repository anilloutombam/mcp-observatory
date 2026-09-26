import { defineField, defineType } from 'sanity'

export const scenarioType = defineType({
  name: 'scenario',
  title: 'Scenario',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Baseline', value: 'baseline' },
          { title: 'Timing', value: 'timing' },
          { title: 'Transport', value: 'transport' },
          { title: 'Protocol', value: 'protocol' },
          { title: 'Lifecycle', value: 'lifecycle' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
    },
  },
})
