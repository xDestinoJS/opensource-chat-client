"use client";

import { Button } from "../ui/button";
import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Link from "next/link";
import ChangeThemeButton from "../change-theme-button";

export default function QuickActionsRight() {
	const [areQuickActionsClosed, setAreQuickActionsClosed] = useState(false);
	const isSmallScreen = useMediaQuery("(max-width: 640px)");

	useEffect(() => {
		setAreQuickActionsClosed(isSmallScreen);
	}, [isSmallScreen]);

	return (
		<div className="fixed flex items-center border border-transparent rounded-sm p-0.75 pr-1.25 z-9999 justify-start top-2 right-2 overflow-visible transition duration-350 bg-sidebar">
			{!areQuickActionsClosed && (
				<>
					<div className="size-7.5 flex items-center justify-center">
						<Button
							className="size-7.5 hover:bg-primary/10 rounded-sm"
							variant="ghost"
							onClick={() => alert}
							asChild
						>
							<Link href="/settings/customization">
								<Settings2 />
							</Link>
						</Button>
					</div>
					<div className="size-7.5 flex items-center justify-center">
						<ChangeThemeButton />
					</div>
				</>
			)}
		</div>
	);
}
