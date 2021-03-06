/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {createHash} from "node:crypto";

import {graphQLSchemaExtension, list} from "@keystone-6/core";
import {
	checkbox,
	float,
	image,
	integer,
	password,
	relationship,
	select,
	text,
	timestamp,
} from "@keystone-6/core/fields";
import {document} from "@keystone-6/fields-document";

import {isProduction} from "./environment";
import {getPositionByAddress, getPositionFilters} from "./interactions/geo";
import {sendWelcomeEmail} from "./interactions/mail";
import {slugify} from "./util";
import {makeImageFormatField} from "./util/image-formats";

type FilterArgs = {
	session?: {
		data: {id: string; isAdmin: boolean};
	};
} & Record<string, any>;

const isUserLoggedIn = (args: FilterArgs) => Boolean(args.session?.data.id);
const isUserAdmin = (args: FilterArgs) => Boolean(args.session?.data.isAdmin);

const isUserCurrentUserItem = (args: FilterArgs & {item: any}) =>
	args.session?.data.id === args.item.id;
const isUserAdminOrCurrentUserItem = (args: FilterArgs & {item: any}) =>
	isUserAdmin(args) || isUserCurrentUserItem(args);

const filterInstitutionsOwnedByUser = (args: FilterArgs) => {
	if (isUserAdmin(args)) return true;
	return {owner: {id: {equals: args.session?.data.id}}};
};

export const lists = {
	User: list({
		ui: {
			listView: {
				initialColumns: ["name"],
			},
		},
		access: {
			filter: {
				query(args: FilterArgs) {
					if (!isUserLoggedIn(args)) return false;
					if (isUserAdmin(args)) return true;
					return {id: {equals: args.session?.data.id}};
				},
			},
			item: {
				update: isUserAdminOrCurrentUserItem,
				delete: isUserAdminOrCurrentUserItem,
			},
		},
		fields: {
			name: text({validation: {isRequired: true}}),
			email: text({
				isIndexed: "unique",
				isFilterable: true,
				validation: {isRequired: true},
			}),
			password: password({
				validation: {isRequired: true, rejectCommon: isProduction},
				access: {
					read: isUserAdminOrCurrentUserItem,
					update: isUserCurrentUserItem,
				},
			}),
			isAdmin: checkbox({
				access: {
					create: isUserAdmin,
					read: isUserAdminOrCurrentUserItem,
					update: isUserAdmin,
				},
			}),
			institutions: relationship({
				ref: "Institution.owner",
				many: true,
				access: {
					read: isUserAdminOrCurrentUserItem,
					update: isUserAdmin,
				},
			}),
		},
		hooks: {
			async beforeOperation({operation, context, item}) {
				if (operation === "delete") {
					// Delete the user's institutions
					const institutions = await context.db.Institution.findMany({
						where: {owner: {id: {equals: item.id.toString()}}},
					});
					await context.db.Institution.deleteMany({
						where: institutions.map((institution) => ({id: institution.id.toString()})),
					});
				}
			},
			async afterOperation({operation, item}) {
				if (operation === "create") {
					await sendWelcomeEmail((item as any).email, (item as any).name);
				}
			},
		},
	}),

	Institution: list({
		access: {
			operation: {
				create: isUserLoggedIn,
				update: isUserLoggedIn,
				delete: isUserLoggedIn,
			},
			filter: {
				delete: filterInstitutionsOwnedByUser,
				update: filterInstitutionsOwnedByUser,
			},
		},

		fields: {
			name: text({validation: {isRequired: true}, graphql: {read: {isNonNull: true}}}),
			slug: text({
				isIndexed: "unique",
				isFilterable: true,
				graphql: {read: {isNonNull: true}},
				access: {
					create: isUserAdmin,
					update: isUserAdmin,
				},
			}),

			owner: relationship({ref: "User.institutions", many: false}),
			lastUpdated: timestamp({
				db: {updatedAt: true, isNullable: false},
				ui: {itemView: {fieldMode: "read"}},
				graphql: {read: {isNonNull: true}},
			}),

			type: select({
				type: "enum",
				options: [
					// Values are SGB 8 paragraphs, prefixed with a "p" for error-free type generation in
					// frontend code
					{value: "p13", label: "Begleitetes Wohnen"},
					{value: "p34", label: "Heimerziehung"},
					{value: "p35", label: "Einzelbetreuung"},
					{value: "p35a", label: "Eingliederungshilfe"},
					{value: "p41", label: "Hilfe f??r junge Vollj??hrige"},
					{value: "p42", label: "Inobhutnahme"},
				],
				validation: {isRequired: true},
				graphql: {read: {isNonNull: true}},
			}),
			gender: select({
				type: "enum",
				options: [
					{value: "mixed", label: "geschlechtsgemischt"},
					{value: "f", label: "nur M??dchen"},
					{value: "m", label: "nur Jungen"},
				],
				validation: {isRequired: true},
				graphql: {read: {isNonNull: true}},
			}),
			ageFrom: integer({
				validation: {isRequired: true, min: 0},
				graphql: {read: {isNonNull: true}},
			}),
			ageTo: integer({
				validation: {isRequired: true, min: 0},
				graphql: {read: {isNonNull: true}},
			}),

			arePlacesAvailable: checkbox({
				graphql: {read: {isNonNull: true}},
			}),

			street: text({validation: {isRequired: true}, graphql: {read: {isNonNull: true}}}),
			streetNumber: text({
				validation: {isRequired: true},
				graphql: {read: {isNonNull: true}},
			}),
			zip: text({validation: {isRequired: true}, graphql: {read: {isNonNull: true}}}),
			city: text({validation: {isRequired: true}, graphql: {read: {isNonNull: true}}}),
			positionLat: float(),
			positionLng: float(),

			homepage: text(),
			email: text(),
			phone: text(),
			mobilePhone: text(),

			description: document(),
			descriptionPlain: text(),

			logo: image({storage: "images"}),
			logoUrl: makeImageFormatField("Institution", "logo", {
				institutionPage(builder) {
					builder.resize("fit", 600, 200);
				},
			}),

			photo: image({storage: "images"}),
			photoUrl: makeImageFormatField("Institution", "photo", {
				institutionListItem(builder) {
					builder.resize("fill", 600, 400);
				},
				institutionPage(builder) {
					builder.width(800);
				},
			}),
		},
		hooks: {
			async resolveInput({resolvedData, item, context}) {
				// Update position if at least one address field was updated
				if (resolvedData.street || resolvedData.streetNumber || resolvedData.zip) {
					Object.assign(
						resolvedData,
						await getPositionByAddress({
							street: resolvedData.street ?? item?.street,
							streetNumber: resolvedData.streetNumber ?? item?.streetNumber,
							zip: resolvedData.zip ?? item?.zip,
						})
					);
				}

				// Update slug if name was updated
				if (resolvedData.name) {
					resolvedData.slug = `${slugify(resolvedData.name)}-${createHash("md5")
						.update(
							"".concat(
								resolvedData.street ?? item!.street,
								resolvedData.streetNumber ?? item!.streetNumber,
								resolvedData.zip ?? item!.zip
							)
						)
						.digest("hex")
						.slice(0, 8)}`;
				}

				return resolvedData;
			},
		},
	}),
};

async function getInstitutionSearchFilters(args: {
	cityOrZip: string;
	radius: number;
	age: number | undefined;
}) {
	const positionFilters = await getPositionFilters(args.cityOrZip, args.radius);
	const ageFilters = args.age ? {ageFrom: {lte: args.age}, ageTo: {gte: args.age}} : null;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return {...positionFilters, ...ageFilters};
}

export const extendGraphqlSchema = graphQLSchemaExtension({
	typeDefs: `
    type Query {
      """
			If \`cityOrZip\` is not empty, return institutions within \`radius\` km distance from
			\`cityOrZip\`. Otherwise, do not filter by location. If \`age\` is not null, only those
			institutions are returned whose age range includes \`age\`.
			"""
      institutionSearchResults(
				radius: Int!
        cityOrZip: String
				age: Int
        where: InstitutionWhereInput! = {}
        orderBy: [InstitutionOrderByInput!]! = []
        limit: Int
        offset: Int! = 0
      ): [Institution!]!

			institutionSearchResultsCount(
				radius: Int!
        cityOrZip: String
				age: Int
        where: InstitutionWhereInput! = {}
      ): Int


			isEmailRegistered(email: String!): Boolean!
    }`,
	resolvers: {
		Query: {
			async institutionSearchResults(root, {where, orderBy, limit, offset, ...args}, context) {
				let institutionSearchFilters: any = {};
				try {
					institutionSearchFilters = await getInstitutionSearchFilters(args);
				} catch {
					return [];
				}

				return context.db.Institution.findMany({
					where: {...institutionSearchFilters, ...where},
					orderBy,
					skip: offset,
					take: limit,
				});
			},
			async institutionSearchResultsCount(root, {where, ...args}, context) {
				let institutionSearchFilters: any = {};
				try {
					institutionSearchFilters = await getInstitutionSearchFilters(args);
				} catch {
					return 0;
				}

				return context.db.Institution.count({
					where: {...institutionSearchFilters, ...where},
				});
			},

			async isEmailRegistered(root, {email}, context) {
				try {
					return (
						(await context.db.User.count({
							where: {email: {equals: email}},
						})) > 0
					);
				} catch {
					return false;
				}
			},
		},
	},
});
