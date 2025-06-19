import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSidebar } from "../ui/sidebar";
import { cn } from "@/lib/utils";
import QuickActionsRight from "../sidebar/quick-actions-right";
import QuickActionsLeft from "../sidebar/quick-actions-left";

export default function Topbar() {
	const isSmallScreen = useMediaQuery("(max-width: 640px)");
	const { open, openMobile, isMobile } = useSidebar();

	return (
		<div
			className={cn(
				"absolute overflow-x-clip right-0 w-[calc(100%+2px)] z-50 h-4 bg-sidebar border-b border-sidebar-border transition-all ease-in-out duration-500",
				!isSmallScreen && ((open && !openMobile) || isMobile)
					? "top-0"
					: "-top-4.5"
			)}
		>
			<div className="relative w-full h-full">
				{!isMobile ? (
					<div
						className="absolute top-[calc(100%-0.25px)] left-[1px] size-3.5 bg-sidebar"
						style={{ clipPath: "inset(0px 0px 0px 0px)" }}
					>
						<div className="bg-background border border-sidebar-border rounded-full w-[200%] h-[200%]"></div>
					</div>
				) : (
					<svg
						className="absolute left-3 top-[calc(100%-2px)] h-9 origin-top-left overflow-visible mt-0.5 translate-x-[calc(4rem+10px)] skew-x-[30deg] -scale-x-100 max-sm:hidden"
						version="1.1"
						xmlns="http://www.w3.org/2000/svg"
						xmlnsXlink="http://www.w3.org/1999/xlink"
						viewBox="0 0 128 32"
						xmlSpace="preserve"
					>
						<line
							stroke="var(--sidebar)"
							strokeWidth="2px"
							shapeRendering="optimizeQuality"
							vectorEffect="non-scaling-stroke"
							strokeLinecap="round"
							strokeMiterlimit="10"
							x1="1"
							y1="0"
							x2="128"
							y2="0"
						></line>
						<path
							stroke="var(--sidebar-border)"
							className="translate-y-[0.5px]"
							fill="var(--sidebar)"
							shapeRendering="optimizeQuality"
							strokeWidth="1px"
							strokeLinecap="round"
							strokeMiterlimit="10"
							vectorEffect="non-scaling-stroke"
							d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"
						></path>
					</svg>
				)}

				<svg
					className={cn(
						"absolute h-9 -right-8.5 origin-top-left skew-x-[30deg] overflow-visible transition-all duration-300",
						!isSmallScreen && ((open && !openMobile) || isMobile)
							? "top-full"
							: "-top-9"
					)}
					version="1.1"
					xmlns="http://www.w3.org/2000/svg"
					xmlnsXlink="http://www.w3.org/1999/xlink"
					viewBox="0 0 128 32"
					xmlSpace="preserve"
				>
					<line
						stroke="var(--sidebar)"
						strokeWidth="2px"
						shapeRendering="optimizeQuality"
						vectorEffect="non-scaling-stroke"
						strokeLinecap="round"
						strokeMiterlimit="10"
						x1="1"
						y1="0"
						x2="128"
						y2="0"
					></line>
					<path
						stroke="var(--sidebar-border)"
						className="translate-y-[0.5px]"
						fill="var(--sidebar)"
						shapeRendering="optimizeQuality"
						strokeWidth="1px"
						strokeLinecap="round"
						strokeMiterlimit="10"
						vectorEffect="non-scaling-stroke"
						d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"
					></path>
				</svg>
			</div>

			<QuickActionsLeft />
			<QuickActionsRight />
		</div>
	);
}
