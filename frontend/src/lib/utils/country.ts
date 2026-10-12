export function countryFlag(countryCode?: string | null): string {
	if (!countryCode || !/^[a-z]{2}$/i.test(countryCode)) return '';
	return String.fromCodePoint(
		...countryCode
			.toUpperCase()
			.split('')
			.map((letter) => letter.charCodeAt(0) + 127397)
	);
}
