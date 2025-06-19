import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

export default function ChangeThemeButton() {
	const { theme, setTheme } = useTheme();

	function changeTheme() {
		setTheme(theme == "dark" ? "light" : "dark");
	}

	return (
		<Button
			className="size-7.5 hover:bg-primary/10 rounded-sm"
			variant="ghost"
			onClick={changeTheme}
		>
			{theme == "light" ? <Moon /> : <Sun />}
		</Button>
	);
}
