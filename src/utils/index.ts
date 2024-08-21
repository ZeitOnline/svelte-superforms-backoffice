/**
 *  This function is used to transform the published date
 * @param publishedAt
 * @returns
 */
export const transformedPublishedData = (publishedAt: string) => {
	const date = new Date(publishedAt);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
};

/**
 * This function is used to debounce the function call
 * @param callback  debounce function
 * @param wait  debounce time
 * @returns
 */
export const debounce = (callback: Function, wait = 300) => {
	let timeout: ReturnType<typeof setTimeout>;
	return (...args: any[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => callback(...args), wait);
	};
};

/**
 * This function is used to highlight the matched text
 * @param text the text to be highlighted
 * @param term the term to be highlighted
 * @returns
 */
export function highlightMatch(text: string | number, term: string): string {
	const textStr = text.toString();
	const parts: string[] = textStr.split(new RegExp(`(${term})`, 'gi'));
	return parts
		.map((part: string, index: number) =>
			part.toLowerCase() === term.toLowerCase()
				? `<span class="bg-yellow-300">${part}</span>`
				: part
		)
		.join('');
}
