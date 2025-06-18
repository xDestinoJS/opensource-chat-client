import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Not T3 Chat",
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
				{/* <script src="https://unpkg.com/react-scan/dist/auto.global.js" /> */}
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ConvexClientProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="light"
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
