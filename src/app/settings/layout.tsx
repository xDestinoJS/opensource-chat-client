"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import SettingsRow from "./components/settings-row";
import Link from "next/link";
import SignOutButton from "./components/sign-out-button";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import Shortcut, { ShortcutData } from "./components/shortcut";

const pages = [
	{
		name: "Account",
		href: "/settings/account",
	},
	{
		name: "Customization",
		href: "/settings/customization",
	},
	{
		name: "Models",
		href: "/settings/models",
	},
	{
		name: "API Keys",
		href: "/settings/api-keys",
	},
	/* {
		name: "Contact Us",
		href: "/settings/contact",
	}, */
];

export type SettingsPages = typeof pages;

export default function SettingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { data: sessionData, isPending } = useSession();
	const isPremium = false;

	const shortcuts: ShortcutData[] = [
		{
			name: "Search",
			keys: ["Ctrl", "K"],
		},
		{
			name: "New Chat",
			keys: ["Ctrl", "Shift", "O"],
		},
		{
			name: "Toggle Sidebar",
			keys: ["Ctrl", "B"],
		},
	];

	useEffect(() => {
		if ((!sessionData && !isPending) || sessionData?.user.isAnonymous) {
			redirect("/auth");
		}
	}, [sessionData, isPending]);

	return (
		<TooltipProvider>
			<div className="w-full bg-[#f2e3f5] dark:bg-[#20141c] min-h-screen">
				<div className="flex flex-col items-center gap-7 max-w-7xl p-7 md:p-10 mx-auto">
					<div className="w-full flex justify-between">
						<Button size="sm" variant="ghost" asChild>
							<Link href="/chat">
								<ChevronLeft />
								<span className="hidden sm:block text-sm text-primary/95">
									Return to chat
								</span>
							</Link>
						</Button>

						<SignOutButton />
					</div>
					<div className="w-full flex flex-col sm:flex-row justify-between items-center sm:items-start gap-7 sm:gap-14">
						<div className="flex flex-row sm:flex-col justify-center items-center gap-4 w-full sm:max-w-[280px] shrink-0">
							{sessionData && sessionData?.user.image ? (
								<Image
									src={sessionData?.user.image || " "}
									alt="Profile Picture"
									width={400}
									height={400}
									priority
									className="size-20 sm:size-[165px] rounded-full"
								/>
							) : (
								<Skeleton className="size-20 sm:size-[165px] rounded-full" />
							)}

							<div className="flex flex-col gap-2 text-left sm:justify-center sm:items-center sm:text-center w-5/7 sm:w-full">
								<div className="flex flex-col sm:items-center gap-1 w-full">
									<h1 className="text-xl font-bold break-words">
										{sessionData?.user?.name}
									</h1>
									<p
										className="text-[.93rem] text-muted-foreground max-sm:truncate sm:w-4/5 break-all w-full"
										title={sessionData?.user?.email || ""}
									>
										{sessionData?.user?.email}
									</p>
								</div>
								<div
									className={cn(
										"p-1 px-3 bg-muted dark:bg-muted/10 text-muted-foreground dark:text-white rounded-full w-max text-sm select-none cursor-pointer hover:scale-105 hover:shadow-md transition-all ease-in-out relative overflow-hidden",
										"group",
										isPremium &&
											"bg-gradient-to-t from-gradient-end via-cyan-500 via-90% to-cyan-500 text-white"
									)}
								>
									<span className="relative z-10 pointer-events-none">
										{!isPremium ? "Free plan" : "Premium"}
									</span>

									{isPremium && (
										<span className="absolute inset-0 z-0 before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,white_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%] before:bg-[position:200%_0] before:bg-no-repeat before:transition-[background-position] before:duration-0 hover:before:bg-[position:-100%_0] hover:before:duration-[750ms]" />
									)}
								</div>

								<div className="p-4 w-full border text-left rounded-lg bg-white dark:bg-[#0b080b] mt-4">
									<h1 className="text-sm font-bold mb-4">Keyboard Shortcuts</h1>
									<div className="flex flex-col gap-2">
										{shortcuts.map((shortcut, index) => (
											<Shortcut key={index} shortcut={shortcut}></Shortcut>
										))}
									</div>
								</div>
							</div>
						</div>
						<div className="flex flex-col gap-5 grow w-full sm:w-auto">
							<SettingsRow pages={pages} />
							<div className="flex flex-col gap-4 w-full">{children}</div>
						</div>
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}
