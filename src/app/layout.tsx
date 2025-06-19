import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Changed from Lato to Inter
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// Configure the Inter font
const inter = Inter({
	subsets: ["latin"],
	display: "swap", // Optimizes font loading
	variable: "--font-inter", // Define a CSS variable for easy access
});

export const metadata: Metadata = {
	title: "Aiki",
	description: "A T3 Chat Clone",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/assets/favicon.png" sizes="any" />
			</head>
			<body className={`${inter.className} antialiased`}>
				<ConvexClientProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						disableTransitionOnChange
					>
						{children}
						<Toaster />
					</ThemeProvider>
				</ConvexClientProvider>
			</body>
		</html>
	);
}
