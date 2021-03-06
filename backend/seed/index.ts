/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {KeystoneContext} from "@keystone-6/core/types";

import {getInstitutions, users} from "./data";

export async function insertSeedData(context: KeystoneContext) {
	console.log(`🌱 Inserting seed data`);

	const createUser = async (userData: any) => {
		let user = null;
		try {
			user = await context.query.User.findOne({
				where: {email: userData.email},
				query: "id",
			});
		} catch {}

		if (!user) {
			user = await context.query.User.createOne({
				data: userData,
				query: "id",
			});
		}

		return user;
	};

	const createInstitution = async (institutionData: any) => {
		let users;
		try {
			users = await context.query.User.findMany({
				where: {name: {equals: institutionData.owner}},
				query: "id",
			});
		} catch {
			users = [];
		}

		institutionData.owner = {connect: {id: users[0].id}};
		const post = await context.query.Institution.createOne({
			data: institutionData,
			query: "id",
		});
		return post;
	};

	await Promise.all(
		users.map(async (user) => {
			console.log(`👩 Adding user: ${user.name}`);
			await createUser(user);
		})
	);

	const institutions = await getInstitutions();
	await Promise.all(
		institutions.map(async (institution) => {
			console.log(`📝 Adding institution: ${institution.name}`);
			await createInstitution(institution);
		})
	);

	console.log(`✅ Seed data inserted`);
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit();
}
