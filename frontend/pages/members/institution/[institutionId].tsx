import {Alert, AlertIcon, CloseButton, Container, Heading, Spacer, Stack} from "@chakra-ui/react";
import {NextPage} from "next";
import {useRouter} from "next/router";
import React, {useEffect} from "react";

import {useInstitutionByIdQuery} from "../../../lib/api/generated";
import {EditInstitutionForm} from "../../../lib/components/forms/institution/EditInstitutionForm";
import {Title} from "../../../lib/components/Title";
import {emptyGetServerSideProps} from "../../../lib/util";

export const getServerSideProps = emptyGetServerSideProps;

const Page: NextPage = () => {
	const router = useRouter();
	const institutionId = router.query.institutionId as string;

	const isNew = router.query.isNew === "true";
	const [isNewAlertVisible, setIsNewAlertVisible] = React.useState(isNew);
	useEffect(() => {
		if (!isNew) {
			setIsNewAlertVisible(false);
		}
	}, [isNew, setIsNewAlertVisible]);

	const {data} = useInstitutionByIdQuery({variables: {id: institutionId}});

	if (!data?.institution) {
		return null;
	}

	const institution = data.institution;

	return (
		<Container maxWidth="container.lg" mt={8} as={Stack} gap={8}>
			<Title>{institution.name}</Title>
			<Heading>{institution.name}</Heading>
			{isNewAlertVisible && (
				<Alert status="success" variant="left-accent">
					<AlertIcon />
					&quot;{institution.name}&quot; wurde erfolgreich hinzugefügt und kann jetzt über
					freie-plaetze.de gefunden werden.
					<Spacer />
					<CloseButton
						position="relative"
						right={-1}
						top={-1}
						onClick={() => {
							setIsNewAlertVisible(false);
						}}
					/>
				</Alert>
			)}
			<EditInstitutionForm institutionId={institution.id} />
		</Container>
	);
};

export default Page;
