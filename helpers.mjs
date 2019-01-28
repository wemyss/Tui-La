/** Extracts the list of values > 0 for the given field name */
export function extractFieldValues(data, field) {
	return data.feeds
		.map(x => x[field])
		.map(x => parseInt(x, 10))
		.filter(x => x > 0)
}
