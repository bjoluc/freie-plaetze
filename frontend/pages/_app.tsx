import {ApolloProvider} from "@apollo/client";
import {ChakraProvider} from "@chakra-ui/react";
import {Provider as ModalProvider} from "@ebay/nice-modal-react";
import {AppProps} from "next/app";
import React from "react";

import {getApolloClient} from "../lib/api/apollo-client";
import {Layout} from "../lib/components/layout";
import {wrapper} from "../lib/store";
import theme from "../lib/theme";

const MyApp: React.FC<AppProps> = ({Component, pageProps}) => {
	const client = getApolloClient();

	return (
		<ApolloProvider client={client}>
			<ChakraProvider theme={theme}>
				<ModalProvider>
					<Layout>
						<Component {...pageProps} />
					</Layout>
				</ModalProvider>
			</ChakraProvider>
		</ApolloProvider>
	);
};

export default wrapper.withRedux(MyApp);
