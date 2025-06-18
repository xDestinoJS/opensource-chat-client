"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Form,
	FormField,
	FormControl,
	FormMessage,
} from "@/components/ui/form";
import SettingsItem from "../../components/settings-item";
import TraitBadge from "../../components/trait-badge";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useSession } from "@/lib/auth-client";

const FormSchema = z.object({
	name: z.string().max(50),
	occupation: z.string().max(100),
	traits: z.array(z.string()),
	additionalInfo: z.string().max(300),
});

const suggestedTraits = [
	"friendly",
	"witty",
	"concise",
	"curious",
	"empathetic",
	"creative",
	"patient",
];

export default function CustomizeT3Chat() {
	const { data: sessionData } = useSession();
	const [traitInput, setTraitInput] = useState("");

	const updateChatSettings = useMutation(
		api.userPreferences.updateChatSettings
	);

	const userPreferences = useQuery(
		api.userPreferences.getUserPreferences,
		sessionData ? { sessionToken: sessionData.session.token } : "skip"
	);

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			name: "",
			occupation: "",
			traits: [],
			additionalInfo: "",
		},
	});

	useEffect(() => {
		if (userPreferences?.chatSettings)
			form.reset(userPreferences?.chatSettings);
	}, [userPreferences?.chatSettings]);

	const addTrait = (trait?: string) => {
		const traitToAdd = (trait ?? traitInput.trim()).slice(0, 100);
		if (traitToAdd && !form.getValues("traits").includes(traitToAdd)) {
			form.setValue("traits", [...form.getValues("traits"), traitToAdd]);
			setTraitInput("");
		}
	};

	const removeTrait = (t: string) =>
		form.setValue(
			"traits",
			form.getValues("traits").filter((trait) => trait !== t)
		);

	const handleTraitKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === "Tab") {
			e.preventDefault();
			addTrait();
		}
	};

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		if (!sessionData) return;
		await updateChatSettings({
			chatSettings: data,
			sessionToken: sessionData.session.token,
		});
		toast("Chat preferences saved successfully!");
	};

	// Util to render text input with counter
	const renderTextInput = (
		field: any,
		placeholder: string,
		max: number,
		watchValue: string
	) => (
		<div className="relative">
			<Input
				{...field}
				placeholder={placeholder}
				maxLength={max}
				className="pr-12 dark:bg-black/5 dark:border-black/20"
			/>
			<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
				{watchValue.length}/{max}
			</span>
		</div>
	);

	return (
		<div className="max-w-full">
			<h1 className="text-2xl font-semibold">Customize Chat</h1>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="mt-5 flex flex-col gap-5"
				>
					{/* Name */}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<SettingsItem
								title="What should T3 Chat call you?"
								size="sm"
								form
							>
								{renderTextInput(field, "Enter your name", 50, field.value)}
							</SettingsItem>
						)}
					/>

					{/* Occupation */}
					<FormField
						control={form.control}
						name="occupation"
						render={({ field }) => (
							<SettingsItem title="What do you do?" size="sm" form>
								{renderTextInput(
									field,
									"Engineer, student, etc.",
									100,
									field.value
								)}
							</SettingsItem>
						)}
					/>

					{/* Traits */}
					<FormField
						control={form.control}
						name="traits"
						render={() => (
							<SettingsItem
								title="What traits should T3 Chat have?"
								subtitle="(up to 50, max 100 chars each)"
								size="sm"
								form
							>
								<div>
									{/* Active Traits */}
									{form.watch("traits").length > 0 && (
										<div className="flex flex-wrap gap-2 mb-2">
											{form.watch("traits").map((trait, idx) => (
												<TraitBadge
													key={idx}
													label={trait}
													removable
													onClick={() => removeTrait(trait)}
												/>
											))}
										</div>
									)}

									{/* Trait Input */}
									<div className="relative">
										<Input
											placeholder="Type a trait and press Enter or Tab..."
											value={traitInput}
											onChange={(e) => setTraitInput(e.target.value)}
											onKeyDown={handleTraitKeyDown}
											maxLength={50}
											className="pr-12 dark:bg-black/5 dark:border-black/20"
										/>
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
											{traitInput.length}/50
										</span>
									</div>

									{/* Suggested Traits */}
									<div className="flex flex-wrap gap-2 mt-2">
										{suggestedTraits.map((trait, idx) =>
											form.watch("traits").includes(trait) ? null : (
												<TraitBadge
													key={idx}
													label={trait}
													onClick={() => addTrait(trait)}
												/>
											)
										)}
									</div>
								</div>
								<FormMessage />
							</SettingsItem>
						)}
					/>

					{/* Additional Info */}
					<FormField
						control={form.control}
						name="additionalInfo"
						render={({ field }) => (
							<SettingsItem
								title="Anything else T3 Chat should know about you?"
								size="sm"
								form
							>
								<div className="relative">
									<FormControl>
										<Textarea
											{...field}
											placeholder="Interests, values, or preferences to keep in mind"
											maxLength={300}
											className="min-h-[120px] resize-none pr-16 dark:bg-black/5 dark:border-black/20"
										/>
									</FormControl>
									<span className="absolute right-3 bottom-3 text-sm text-muted-foreground">
										{field.value?.length || 0}/300
									</span>
								</div>
								<FormMessage />
							</SettingsItem>
						)}
					/>

					{/* Submit */}
					<div className="flex justify-end pt-4">
						<Button type="submit" className="dark:bg-[#ae1b6c]">
							Save Preferences
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
