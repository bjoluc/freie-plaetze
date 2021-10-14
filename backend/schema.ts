import { document } from "@keystone-next/fields-document";
import { graphQLSchemaExtension, list } from "@keystone-next/keystone";
import {
  float,
  image,
  integer,
  password,
  relationship,
  select,
  text,
  timestamp,
} from "@keystone-next/keystone/fields";
import { lengthToDegrees } from "@turf/helpers";

import { getPositionByAddress, getPositionByZipOrCity } from "./interactions/geo";

export const lists = {
  User: list({
    ui: {
      listView: {
        initialColumns: ["name"],
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({
        isIndexed: "unique",
        isFilterable: true,
        validation: { isRequired: true },
      }),
      password: password({ validation: { isRequired: true } }),
      institutions: relationship({ ref: "Institution.owner", many: true }),
    },
  }),

  Institution: list({
    fields: {
      owner: relationship({ ref: "User.institutions", many: false }),
      lastUpdated: timestamp({
        db: { updatedAt: true, isNullable: false },
        ui: { itemView: { fieldMode: "read" } },
        graphql: { read: { isNonNull: true } },
      }),

      name: text({ validation: { isRequired: true }, graphql: { read: { isNonNull: true } } }),
      gender: select({
        type: "enum",
        options: [
          { value: "mixed", label: "geschlechtsgemischt" },
          { value: "f", label: "nur Mädchen" },
          { value: "m", label: "nur Jungen" },
        ],
        validation: { isRequired: true },
        graphql: { read: { isNonNull: true } },
      }),
      ageFrom: integer({
        validation: { isRequired: true, min: 0 },
        graphql: { read: { isNonNull: true } },
      }),
      ageTo: integer({
        validation: { isRequired: true, min: 0 },
        graphql: { read: { isNonNull: true } },
      }),

      placesAvailable: integer({
        validation: { isRequired: true, min: 0 },
        graphql: { read: { isNonNull: true } },
      }),
      placesTotal: integer({
        validation: { isRequired: true, min: 0 },
        graphql: { read: { isNonNull: true } },
      }),

      street: text({ validation: { isRequired: true }, graphql: { read: { isNonNull: true } } }),
      streetNumber: text({
        validation: { isRequired: true },
        graphql: { read: { isNonNull: true } },
      }),
      zip: integer({ validation: { isRequired: true }, graphql: { read: { isNonNull: true } } }),
      city: text({ validation: { isRequired: true }, graphql: { read: { isNonNull: true } } }),
      positionLat: float(), // { db: { isNullable: false }, graphql: { read: { isNonNull: true } } } somehow doesn't work with filtering
      positionLng: float(),

      homepage: text(),
      email: text(),
      phone: text(),
      mobilePhone: text(),

      description: document(),

      logo: image(),
      photo: image(),
    },
    hooks: {
      resolveInput: async ({ resolvedData, item }) => {
        // Update position if at least one address field was updated
        if (resolvedData.street || resolvedData.streetNumber || resolvedData.zip) {
          Object.assign(
            resolvedData,
            await getPositionByAddress({
              street: resolvedData.street ?? item.street,
              streetNumber: resolvedData.streetNumber ?? item.streetNumber,
              zip: resolvedData.zip ?? item.zip,
            })
          );
        }

        return resolvedData;
      },
    },
  }),
};

export const extendGraphqlSchema = graphQLSchemaExtension({
  typeDefs: `
    type Query {
      """Return institutions within \`radius\` km distance from \`cityOrZip\`"""
      nearbyInstitutions(
        cityOrZip: String!
        radius: Int!
        where: InstitutionWhereInput! = {}
        orderBy: [InstitutionOrderByInput!]! = []
        take: Int
        skip: Int! = 0
      ): [Institution!]!
    }`,
  resolvers: {
    Query: {
      nearbyInstitutions: async (root, { cityOrZip, radius, where, ...params }, context) => {
        try {
          const pos = await getPositionByZipOrCity(cityOrZip);
          const radiusDeg = lengthToDegrees(radius, "kilometers");

          const result = await context.db.Institution.findMany({
            where: {
              positionLat: { gt: pos.positionLat - radiusDeg, lt: pos.positionLat + radiusDeg },
              positionLng: { gt: pos.positionLng - radiusDeg, lt: pos.positionLng + radiusDeg },
              ...where,
            },
            ...params,
          });
          return result;
        } catch {
          return [];
        }
      },
    },
  },
});
