import {Container} from "@chakra-ui/layout";
import {Box, Checkbox, Stack, Text} from "@chakra-ui/react";
import {Form, Formik} from "formik";
import {InputControl, SubmitButton} from "formik-chakra-ui";
import type {NextPage} from "next";
import React from "react";

import {FormBox} from "../lib/components/content/forms/FormBox";
import {Layout} from "../lib/components/Layout";
import {Link} from "../lib/components/next/Link";

const Page: NextPage = () => {
	return (
		<Layout>
			<Box bgColor="gray.50" height="100%">
				<Container maxWidth="container.xl" pt={8} alignItems="center">
					<FormBox
						title="Melden Sie sich an"
						subtitle="um Einrichtungen hinzuzufügen oder zu ändern"
					>
						<Formik
							initialValues={{email: "", password: "40"}}
							onSubmit={async (values) => {
								console.log(values);
							}}
						>
							<Stack as={Form} spacing={4}>
								<InputControl name="email" label="E-Mail-Adresse" />
								<InputControl
									name="password"
									label="Passwort"
									inputProps={{
										type: "password",
									}}
								/>
								<Stack spacing={10}>
									<Stack direction={["column", "row"]} align="start" justify="space-between">
										<Checkbox>Angemeldet bleiben</Checkbox>
										<Link color="blue.400" href="/forgot-pass">
											Passwort vergessen?
										</Link>
									</Stack>
									<SubmitButton colorScheme="blue">Anmelden</SubmitButton>
									<Text textAlign="center">
										Kein Benutzerkonto?{" "}
										<Link color="blue.400" href="/register">
											Hier registrieren
										</Link>
									</Text>
								</Stack>
							</Stack>
						</Formik>
					</FormBox>
				</Container>
			</Box>
		</Layout>
	);
};

export default Page;
