import {QuestionOutlineIcon} from "@chakra-ui/icons";
import {Box, Flex, Grid, Heading, Img, LinkBox, LinkOverlay, Stack, Text} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";

import {BasicInstitutionInfoFragment} from "../../../api/generated";
import {Gist} from "./Gist";
import {PlacesStat} from "./PlacesStat";

export type InstitutionListItemProps = {
	institution: BasicInstitutionInfoFragment;
	href: string;
};

export const InstitutionListItem: React.FC<InstitutionListItemProps> = ({institution, href}) => {
	return (
		<LinkBox>
			<Grid
				templateColumns={{md: "1fr auto auto"}}
				gap={{base: 6, md: 8}}
				bgColor="white"
				borderRadius="lg"
				borderWidth="1px"
				borderColor="gray.200"
				shadow="md"
				overflow="hidden"
				textAlign={{base: "center", md: "left"}}
			>
				<Stack
					direction="column"
					order={0}
					m={{base: 6, md: 8}}
					mb={{base: 0, md: 8}}
					spacing={{base: 2, md: 4}}
				>
					<NextLink passHref href={href}>
						<LinkOverlay>
							<Heading as="h3" size="lg" fontWeight="medium">
								{institution.name}
							</Heading>
						</LinkOverlay>
					</NextLink>
					<Text fontSize="lg" fontWeight="bold" display={{base: "none", md: "block"}}>
						<Gist hasInstitutionType institution={institution} />
					</Text>
				</Stack>

				<PlacesStat
					order={{base: 4, md: 1}}
					institution={institution}
					alignSelf="center"
					textAlign="center"
				/>

				<Text
					order={3}
					display={{base: "block", md: "none"}}
					fontSize="lg"
					fontWeight="bold"
					mx={2}
				>
					<Gist hasInstitutionType institution={institution} />
				</Text>

				<Box order={2} position="relative" width={{base: "100%", md: 64}}>
					{(institution.photoListItemUrl && (
						<Img
							src={institution.photoListItemUrl}
							objectFit="cover"
							position={{md: "absolute"}}
							width="100%"
							height="100%"
						/>
					)) || (
						<Flex
							display={{base: "none", md: "flex"}}
							height="100%"
							justify="center"
							align="center"
							bgColor="gray.100"
						>
							<QuestionOutlineIcon boxSize={10} color="gray.300" />
						</Flex>
					)}
				</Box>
			</Grid>
		</LinkBox>
	);
};
