"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import providers from "@/lib/providers";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

// 1. Create the schema based on provider keys
const formSchema = z.object(
	Object.fromEntries(
		providers.map((p) => [p.id || p.name, z.string().optional()])
	)
);

type FormValues = z.infer<typeof formSchema>;

export default function Page() {
	const { data: sessionData } = useSession();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: Object.fromEntries(
			providers.map((p) => [p.id || p.name, ""])
		),
	});

	const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

	const toggleVisibility = (key: string) => {
		setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const updateApiKeys = useMutation(api.userPreferences.updateApiKeys);

	const userPreferences = useQuery(
		api.userPreferences.getUserPreferences,
		sessionData ? { sessionToken: sessionData.session.token } : "skip"
	);

	useEffect(() => {
		if (userPreferences?.apiKeys) {
			form.reset(
				Object.fromEntries(
					userPreferences.apiKeys.map((key) => [key.providerId, key.key])
				)
			);
		}
	}, [userPreferences?.apiKeys]);

	const onSubmit = async (values: FormValues) => {
		if (!sessionData) return;

		const apiKeys = Object.entries(values)
			.filter(
				(entry): entry is [string, string] =>
					typeof entry[1] === "string" && entry[1].trim() !== ""
			)
			.map(([providerId, key]) => ({ providerId, key }));

		await updateApiKeys({
			apiKeys,
			sessionToken: sessionData.session.token,
		});

		toast("Updated API keys succesfully!");
	};

	return (
		<>
			<h1 className="text-2xl font-semibold">API Keys</h1>
			<p>
				Provide your API keys to enable different models and access their
				capabilities within the application.
			</p>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					{providers.map((provider) => {
						const fieldName = provider.id || provider.name;

						return (
							<FormField
								key={fieldName}
								control={form.control}
								name={fieldName}
								render={({ field }) => (
									<FormItem>
										<div className="grid grid-cols-[max-content_1fr] items-center gap-4">
											<FormLabel className="w-30 md:w-45 flex gap-4 items-center whitespace-nowrap">
												<Image
													src={provider.darkIcon ?? provider.icon}
													className="size-[18px]"
													alt={provider.name}
													width={15}
													height={15}
												/>
												<p className="text-wrap text-base">{provider.name}</p>
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Input
														{...field}
														placeholder={provider.apiKeySource}
														type={visibleKeys[fieldName] ? "text" : "password"}
														className="pr-12 dark:bg-black/5 dark:border-black/20"
													/>
													<button
														type="button"
														onClick={() => toggleVisibility(fieldName)}
														className="absolute right-2 top-1/2 cursor-pointer -translate-y-1/2 text-muted-foreground"
													>
														{visibleKeys[fieldName] ? (
															<EyeOff className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
													</button>
												</div>
											</FormControl>
										</div>
									</FormItem>
								)}
							/>
						);
					})}

					<div className="flex justify-end">
						<Button type="submit" variant="highlight">
							Submit
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
}
