import {Text, TextProps} from "@chakra-ui/react";
import {Link} from "next-chakra-ui";
import React from "react";

export interface LogoProps extends TextProps {}

export const Logo: React.FC<LogoProps> = ({...textProps}) => (
	<Text color="gray.900" fontSize={{base: "xl", md: "2xl"}} fontWeight="bold" {...textProps}>
		<Link href="/">Freie Plätze</Link>
	</Text>
);
