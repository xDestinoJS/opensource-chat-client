import React from "react";

export interface ShortcutData {
	name: string;
	keys: string[];
}

function Shortcut({ shortcut }: { shortcut: ShortcutData }) {
	return (
		<div className="flex items-center justify-between p-0">
			<span>{shortcut.name}</span>
			<div className="flex items-center gap-1">
				{shortcut.keys.map((key, index) => (
					<div
						key={index}
						className="px-2 py-1 bg-muted dark:bg-[#21141e] text-sm rounded"
					>
						{key}
					</div>
				))}
			</div>
		</div>
	);
}

export default Shortcut;
