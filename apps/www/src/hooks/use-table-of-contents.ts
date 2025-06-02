import { create } from "zustand";

interface Heading {
	level: number;
	text: string;
}

interface State {
	allHeadings: Heading[];
	activeHeadingIds: number[];
	visibleSections: Array<string | number>;
	setVisibleSections: (visibleSections: Array<string | number>) => void;
	setAllHeadings: (headings: Heading[]) => void;
}

export const useTableOfContents = create<State>()((set) => ({
	allHeadings: [],
	activeHeadingIds: [],
	setAllHeadings: (allHeadings) => set({ allHeadings }),
	sections: [],
	visibleSections: [],
	setVisibleSections: (visibleSections) =>
		set((state) => {
			if (state.visibleSections.length !== visibleSections.length) {
				return { visibleSections };
			}
			if (
				state.visibleSections.some(
					(item, index) => item !== visibleSections[index],
				)
			) {
				return { visibleSections };
			}
			return {};
		}),
}));
