import React from "react";

const LabeledSeparator = ({ text }: { text: string }) => {
	return (
		<div className="flex items-center justify-center my-2.5 px-3">
			<div className="h-px bg-primary grow" />
			<span className="mx-2 text-sm">{text}</span>
			<div className="h-px bg-primary grow" />
		</div>
	);
};

export default LabeledSeparator;
