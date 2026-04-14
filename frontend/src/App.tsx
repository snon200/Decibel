import { useState } from "react";
import styled from "styled-components";
import AccountList from "./components/AccountList";
import ATMInterface from "./components/ATMInterface";
import CreateAccountForm from "./components/CreateAccountForm";

export default function App() {
	document.title = "Bond ATM";

	// States
	const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
		null,
	);
	const [isCreateFormVisible, setIsCreateFormVisible] = useState(true);

	// Handlers
	const handleSelectAccount = (accountId: string) => {
		setSelectedAccountId(accountId);
		setIsCreateFormVisible(false);
	};
	const handleShowCreateAccount = () => {
		setSelectedAccountId(null);
		setIsCreateFormVisible(true);
	};

	return (
		<AppShell>
			<Container>
				<PageTitle>Bond ATM</PageTitle>
				{isCreateFormVisible && (
					<CreateAccountForm onAccountCreated={handleSelectAccount} />
				)}
				{selectedAccountId !== null && (
					<ATMInterface
						accountId={selectedAccountId}
						onShowCreateAccount={handleShowCreateAccount}
						onClose={handleShowCreateAccount}
					/>
				)}
				<AccountList onSelectAccount={handleSelectAccount} />
			</Container>
		</AppShell>
	);
}

const AppShell = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 24px;
`;

const Container = styled.main`
	display: flex;
	flex-direction: column;
	gap: 40px;
`;

const PageTitle = styled.h1`
	margin: 0;
	font-size: 1.6rem;
`;
