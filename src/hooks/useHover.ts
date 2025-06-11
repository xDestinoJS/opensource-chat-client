import { useState, useRef, useEffect } from "react";

export default function useHover(): [React.RefObject<any>, boolean] {
	const [isHovered, setHovered] = useState(false);
	const ref = useRef<any | null>(null);

	useEffect(() => {
		const handleMouseOver = () => setHovered(true);
		const handleMouseOut = () => setHovered(false);
		const node = ref.current;

		if (node) {
			node.addEventListener("mouseover", handleMouseOver);
			node.addEventListener("mouseout", handleMouseOut);
		}

		return () => {
			if (node) {
				node.removeEventListener("mouseover", handleMouseOver);
				node.removeEventListener("mouseout", handleMouseOut);
			}
		};
	}, []);

	return [ref, isHovered];
}
