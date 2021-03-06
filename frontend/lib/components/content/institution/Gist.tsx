import React from "react";

import {GistFragment} from "../../../api/generated";
import {
	institutionGenderNames,
	institutionTypeParagraphNumbers,
	institutionTypeShortNames,
} from "../../../constants";
import {GistBullet} from "./GistBullet";
import {InstitutionAgeRange} from "./InstitutionAgeRange";

export type GistProps = {
	institution: GistFragment;
	hasInstitutionType?: boolean;
};

export const Gist: React.FC<GistProps> = ({institution, hasInstitutionType}) => {
	return (
		<>
			{institution.city}
			<GistBullet />
			{hasInstitutionType && (
				<>
					{institutionTypeShortNames[institution.type]} (§&nbsp;
					{institutionTypeParagraphNumbers[institution.type]})
					<GistBullet />
				</>
			)}
			{institutionGenderNames[institution.gender]}
			<GistBullet />
			<InstitutionAgeRange institution={institution} />
		</>
	);
};
