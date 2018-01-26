export function findMedian(data, field) {
	const nums = data.feeds
		.map(f => f[field])
		.sort()

	const l = nums.length

	if (l % 2 === 0) {
		return nums[l/2]
	} else {
		return (nums[(l-1) / 2] + nums[(l+1) / 2]) / 2.0
	}
}


export function findMax(data, field) {
	return data.feeds.reduce((max, curr) => Math.max(curr[field], max), 0)
}
