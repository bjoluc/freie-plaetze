import {getInstitutions, users} from "./data";
import {Context, InstitutionCreateInput, UserCreateInput} from ".keystone/types";

export async function insertSeedData(context: Context) {
	context = context.sudo();
	console.log(`🌱 Inserting seed data`);

	const createUser = async (userData: UserCreateInput) => {
		let user = await context.db.User.findOne({where: {email: userData.email}});

		if (!user) {
			user = await context.db.User.createOne({data: userData});
		}
	};

	const createInstitution = async (institutionData: InstitutionCreateInput) => {
		return context.db.Institution.createOne({data: institutionData});
	};

	await Promise.all(
		users.map(async (user) => {
			console.log(`👩 Adding user: ${user.name ?? ""}`);
			await createUser(user);
		})
	);

	const institutions = await getInstitutions();
	await Promise.all(
		institutions.map(async (institution) => {
			console.log(`📝 Adding institution: ${institution.name ?? ""}`);
			await createInstitution(institution);
		})
	);

	console.log(`✅ Seed data inserted`);
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit();
}
