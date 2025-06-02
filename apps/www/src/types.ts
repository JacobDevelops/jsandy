/** Metadata for search results, shared between server and client */
export type SearchMetadata = Readonly<{
	/** Document title displayed in UI */
	title: string;
	/** URL path to the document */
	path: string;
	/** Heading level within the document */
	level: number;
	/** Nature of the result, e.g., "page" or "heading" */
	type: string;
	/** Snippet of content around the match */
	content: string;
	/** Full title of the parent document */
	documentTitle: string;
}>;
