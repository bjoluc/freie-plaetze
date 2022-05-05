import {Stat, StatHelpText, StatLabel, StatNumber, StatProps} from "@chakra-ui/react";
import React from "react";

import {PlacesStatFragment} from "../../../api/generated";

export interface PlacesStatProps extends StatProps {
	institution: PlacesStatFragment;
	overrideAvailablePlaces?: number;
}

export const PlacesStat: React.FC<PlacesStatProps> = ({
	institution,
	overrideAvailablePlaces,
	...statProps
}) => {
	return (
		<Stat {...statProps}>
			<StatLabel>Freie Plätze</StatLabel>
			<StatNumber>
				{overrideAvailablePlaces ?? institution.placesAvailable} / {institution.placesTotal}
			</StatNumber>
			<StatHelpText>
				Stand{" "}
				{(typeof overrideAvailablePlaces !== undefined &&
				overrideAvailablePlaces !== institution.placesAvailable
					? new Date()
					: new Date(institution.lastUpdated)
				).toLocaleDateString("de-DE")}
			</StatHelpText>
		</Stat>
	);
};
