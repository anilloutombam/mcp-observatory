import { type SchemaTypeDefinition } from 'sanity'
import { implementationType } from './implementation'
import { scenarioType } from './scenario'
import { testRunType } from './testRun'
import { evidenceType } from './evidence'
import { findingType } from './findings'
import { dataSyncType } from './dataSync'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    implementationType,
    scenarioType,
    testRunType,
    evidenceType,
    findingType,
    dataSyncType,
  ],
}
