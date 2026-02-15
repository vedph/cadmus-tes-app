import { Part } from '@myrmidon/cadmus-core';
import { AssertedHistoricalDate } from '@myrmidon/cadmus-refs-historical-date';
import { AssertedLocation } from '@myrmidon/cadmus-part-geo-asserted-locations';
import { DecoratedCount } from '@myrmidon/cadmus-refs-decorated-counts';

/**
 * A resource related to a site, such as a quarry, a mine, a water source, etc.
 */
export interface SiteResource {
  eid?: string;
  type: string;
  tag?: string;
  features?: string[];
  location?: AssertedLocation;
  date?: AssertedHistoricalDate;
  counts?: DecoratedCount[];
}

/**
 * The SiteResources part model.
 */
export interface SiteResourcesPart extends Part {
  resources?: SiteResource[];
}

/**
 * The type ID used to identify the SiteResourcesPart type.
 */
export const SITE_RESOURCES_PART_TYPEID = 'it.vedph.tes.site-resources';

/**
 * JSON schema for the SiteResources part.
 * You can use the JSON schema tool at https://jsonschema.net/.
 */
export const SITE_RESOURCES_PART_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'www.vedph.it/cadmus/parts/tes/' + SITE_RESOURCES_PART_TYPEID + '.json',
  type: 'object',
  title: 'SiteResourcesPart',
  required: [
    'id',
    'itemId',
    'typeId',
    'timeCreated',
    'creatorId',
    'timeModified',
    'userId',
    'resources',
  ],
  properties: {
    timeCreated: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d+Z$',
    },
    creatorId: {
      type: 'string',
    },
    timeModified: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d+Z$',
    },
    userId: {
      type: 'string',
    },
    id: {
      type: 'string',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    },
    itemId: {
      type: 'string',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    },
    typeId: {
      type: 'string',
      pattern: '^[a-z][-0-9a-z._]*$',
    },
    roleId: {
      type: ['string', 'null'],
      pattern: '^([a-z][-0-9a-z._]*)?$',
    },

    resources: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type'],
        properties: {
          eid: { type: 'string' },
          type: { type: 'string' },
          tag: { type: 'string' },
          features: {
            type: 'array',
            items: { type: 'string' },
          },
          location: {
            type: 'object',
            required: ['value'],
            properties: {
              tag: { type: 'string' },
              value: {
                type: 'object',
                required: ['label', 'latitude', 'longitude'],
                properties: {
                  eid: { type: 'string' },
                  label: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  altitude: { type: 'number' },
                  radius: { type: 'number' },
                  geometry: { type: 'string' },
                  note: { type: 'string' },
                },
              },
              assertion: {
                type: 'object',
                required: ['rank'],
                properties: {
                  tag: { type: 'string' },
                  rank: { type: 'integer' },
                  note: { type: 'string' },
                  references: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['citation'],
                      properties: {
                        type: { type: 'string' },
                        tag: { type: 'string' },
                        citation: { type: 'string' },
                        note: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          date: {
            type: 'object',
            required: ['a'],
            properties: {
              tag: { type: 'string' },
              assertion: {
                type: 'object',
                required: ['rank'],
                properties: {
                  tag: { type: 'string' },
                  rank: { type: 'integer' },
                  note: { type: 'string' },
                  references: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['citation'],
                      properties: {
                        type: { type: 'string' },
                        tag: { type: 'string' },
                        citation: { type: 'string' },
                        note: { type: 'string' },
                      },
                    },
                  },
                },
              },
              a: {
                type: 'object',
                required: ['value'],
                properties: {
                  value: { type: 'integer' },
                  isCentury: { type: 'boolean' },
                  isSpan: { type: 'boolean' },
                  isApproximate: { type: 'boolean' },
                  isDubious: { type: 'boolean' },
                  day: { type: 'integer' },
                  month: { type: 'integer' },
                  hint: { type: 'string' },
                  slide: { type: 'integer' },
                },
              },
              b: {
                type: 'object',
                properties: {
                  value: { type: 'integer' },
                  isCentury: { type: 'boolean' },
                  isSpan: { type: 'boolean' },
                  isApproximate: { type: 'boolean' },
                  isDubious: { type: 'boolean' },
                  day: { type: 'integer' },
                  month: { type: 'integer' },
                  hint: { type: 'string' },
                  slide: { type: 'integer' },
                },
              },
            },
          },
          counts: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'value'],
              properties: {
                id: { type: 'string' },
                value: { type: 'number' },
                tag: { type: 'string' },
                note: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};
