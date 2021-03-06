import {Container, Stack} from "@chakra-ui/react";
import {NextPage} from "next";
import React from "react";

import {DeleteUserAccountForm} from "../../lib/components/forms/user/DeleteUserAccountForm";
import {EditUserForm} from "../../lib/components/forms/user/EditUserForm";
import {Title} from "../../lib/components/Title";

const Page: NextPage = () => {
	return (
		<Container pt={8} maxWidth="container.lg">
			<Title>Benutzerdaten</Title>
			<Stack gap={12}>
				<EditUserForm />
				<DeleteUserAccountForm />
			</Stack>
		</Container>
	);
};

export default Page;
