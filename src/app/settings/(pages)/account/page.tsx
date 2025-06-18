"use client";

import SettingsItem from "../../components/settings-item";
import DeleteAccountContent from "./components/delete-account-content";

export default function Account() {
	return (
		<>
			<h1 className="text-2xl font-semibold">Account</h1>

			<SettingsItem
				title="Danger Zone"
				description="Permanently erase your account and all associated data."
				size="sm"
			>
				<div>
					<DeleteAccountContent />
				</div>
			</SettingsItem>
		</>
	);
}
