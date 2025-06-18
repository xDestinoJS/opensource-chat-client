"use client";

import React from "react";
import { Button } from "@/components/ui/button";

import { PiSparkleFill } from "react-icons/pi";
import { FaTiktok } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import Link from "next/link";
import SettingsItem from "../../components/settings-item";

const options = [
	{
		icon: PiSparkleFill,
		title: "Suggestions",
		description: "Share your thoughts and ideas to help us improve.",
		href: "https://otternote.featurebase.app",
	},
	{
		icon: FaDiscord,
		title: "Discord",
		description: "Join our Discord server for community support and updates.",
		href: "https://discord.gg/your_discord_link",
	},
	{
		icon: FaTiktok,
		title: "TikTok",
		description: "Follow us on TikTok for the latest news and announcements.",
		href: "https://tiktok.com/@your_twitter_handle",
	},
];

export default function ContactPage() {
	return (
		<div className="w-full mt-1">
			<SettingsItem
				title={"We're here to help!"}
				description="If you have any questions or feedback, please feel free to reach
				out to us."
			>
				<div className="flex flex-col gap-3 mt-1 md:w-max">
					{options.map((option, index) => (
						<Button
							key={index}
							size="lg"
							variant="outline"
							className="p-4 px-6 h-max whitespace-normal text-wrap break-words [&_svg]:size-7.5!"
							asChild
						>
							<Link href={option.href}>
								<div className="flex gap-4 w-full h-full text-left items-center">
									<div className="shrink-0 mr-2">
										<option.icon />
									</div>
									<div className="grow text-left break-words">
										<h3 className="w-full text-base">{option.title}</h3>
										<p className="text-sm w-full text-muted-foreground">
											{option.description}
										</p>
									</div>
								</div>
							</Link>
						</Button>
					))}
				</div>
			</SettingsItem>
		</div>
	);
}
