export function buildFlagUrls(iso2?: string) {
	if (!iso2 || iso2.length !== 2) return [];
	const lower = iso2.toLowerCase();
	const upper = iso2.toUpperCase();
	return [
		`https://flagcdn.com/${lower}.svg`, // preferred SVG
		`https://flagcdn.com/w80/${lower}.png`, // PNG fallback
		`https://purecatamphetamine.github.io/country-flag-icons/3x2/${upper}.svg`, // alt CDN (covers XK, etc.)
	];
}
