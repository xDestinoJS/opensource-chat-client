"use client"; // This directive is crucial for using client-side hooks in Next.js App Router

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebar } from "../ui/sidebar";
import { Button } from "../ui/button";
import { Plus, Search, Sidebar } from "lucide-react";
import { usePathname, useRouter } from "next/navigation"; // Import usePathname and useRouter
import { useSpotlightModalStore } from "@/stores/use-spotlight-modal";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function QuickActionsLeft() {
	const [areQuickActionsClosed, setAreQuickActionsClosed] = useState(true);

	const isSmallScreen = useMediaQuery("(max-width: 640px)");
	const { isMobile, open, openMobile, setOpenMobile, setOpen } = useSidebar();

	const { open: openSpotlightModal } = useSpotlightModalStore();
	const pathname = usePathname(); // Get the current pathname using usePathname
	const router = useRouter(); // Get the router instance using useRouter

	const isChatPage = pathname === "/chat"; // Check if current path is /chat

	function handleOpen() {
		if (!isMobile) {
			const newOpenState = !open;
			setOpen(newOpenState);
			if (!isSmallScreen) setAreQuickActionsClosed(newOpenState);
		} else {
			setOpenMobile(!openMobile);
		}
	}

	useEffect(() => {
		if (!isMobile && !isSmallScreen) {
			setAreQuickActionsClosed(open);
		} else if (isSmallScreen) {
			setAreQuickActionsClosed(false);
		} else if (isMobile) {
			setAreQuickActionsClosed(true);
		}
	}, [open, isMobile, isSmallScreen]);

	return (
		<motion.div
			className={cn(
				"fixed flex items-center border border-transparent rounded-sm p-0.75 pr-1.25 z-9999 justify-start top-2 left-2 overflow-visible transition duration-350",
				(!areQuickActionsClosed || isSmallScreen) && "bg-sidebar"
			)}
			initial={{ width: "2.25rem" }}
			animate={{
				width:
					areQuickActionsClosed || (isMobile && !isSmallScreen)
						? "2.25rem"
						: "auto",
			}} // change 10rem as needed
			transition={{ duration: 0.1 }}
		>
			<Button
				className="size-7.5 hover:bg-primary/10 rounded-sm"
				size="icon"
				variant="ghost"
				onClick={handleOpen}
			>
				<Sidebar />
			</Button>

			<AnimatePresence mode="wait">
				{!areQuickActionsClosed &&
					[Search, Plus].map((Icon, i) => {
						let onClickHandler;
						let isDisabled = false;

						if (Icon === Search) {
							onClickHandler = () => openSpotlightModal();
						} else if (Icon === Plus) {
							onClickHandler = () => {
								if (!isChatPage) {
									router.push("/chat");
								}
							};
							isDisabled = isChatPage;
						}

						return (
							<motion.div
								key={i}
								className="size-7.5 flex ml-1 items-center justify-center"
								initial={{ x: 0, y: 0, opacity: 0 }}
								animate={{
									x: i + 1, // 32 px ≈ ancho de un botón
									opacity: 1,
								}}
								exit={{ x: 0, opacity: 0 }}
								transition={{
									delay: i * 0.01,
								}}
							>
								<Button
									className="size-7.5 hover:bg-primary/10 rounded-sm"
									variant="ghost"
									onClick={onClickHandler}
									disabled={isDisabled} // Apply disabled prop
								>
									<Icon />
								</Button>
							</motion.div>
						);
					})}
			</AnimatePresence>
		</motion.div>
	);
}
