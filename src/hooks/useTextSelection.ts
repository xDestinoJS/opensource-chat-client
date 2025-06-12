"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface SelectionData {
	text: string;
	position: DOMRect | null;
}

export function useTextSelection() {
	const [finalSelectionData, setFinalSelectionData] = useState<SelectionData>({
		text: "",
		position: null,
	});
	const contentRef = useRef<HTMLDivElement>(null);

	const clearSelectionData = useCallback(() => {
		setFinalSelectionData({
			text: "",
			position: null,
		});
	}, []);

	const captureFinalSelection = useCallback(() => {
		const selection = window.getSelection();
		if (
			selection &&
			selection.toString() &&
			contentRef.current &&
			selection.anchorNode &&
			selection.focusNode &&
			contentRef.current.contains(selection.anchorNode) &&
			contentRef.current.contains(selection.focusNode)
		) {
			const text = selection.toString();
			const range = selection.getRangeAt(0);
			const clientRects = range.getClientRects();
			const rect =
				clientRects.length > 0 ? clientRects[0] : range.getBoundingClientRect();
			setFinalSelectionData({ text, position: rect });
		} else {
			clearSelectionData();
		}
	}, [clearSelectionData]);

	useEffect(() => {
		const handleMouseDown = (event: MouseEvent) => {
			if (
				contentRef.current &&
				contentRef.current.contains(event.target as Node)
			) {
				clearSelectionData();
			}
		};

		const handleMouseUp = () => {
			captureFinalSelection();
		};

		const handleSelectionChange = () => {
			const selection = window.getSelection();
			if (
				!selection ||
				!selection.toString() ||
				!selection.anchorNode ||
				!contentRef.current ||
				!contentRef.current.contains(selection.anchorNode)
			) {
				clearSelectionData();
			}
		};

		const currentContentElement = contentRef.current;

		if (currentContentElement) {
			currentContentElement.addEventListener("mousedown", handleMouseDown);
		}
		document.addEventListener("mouseup", handleMouseUp);
		document.addEventListener("selectionchange", handleSelectionChange);

		return () => {
			if (currentContentElement) {
				currentContentElement.removeEventListener("mousedown", handleMouseDown);
			}
			document.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("selectionchange", handleSelectionChange);
		};
	}, [captureFinalSelection, clearSelectionData]);

	return { selectionData: finalSelectionData, contentRef };
}
