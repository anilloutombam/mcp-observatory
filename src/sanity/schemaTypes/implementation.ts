import { defineField, defineType } from 'sanity'

export const implementationType = defineType({
  name: 'implementation',
  title: 'Implementation',
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
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        list: [
          { title: 'Client', value: 'client' },
          { title: 'Server', value: 'server' },
          { title: 'Proxy', value: 'proxy' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'repositoryUrl',
      title: 'Repository URL',
      type: 'url',
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
      subtitle: 'kind',
    },
  },
})
