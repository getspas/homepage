// Mirrors wiki/Installation.md in getspas/spas. Keep commands in sync with upstream.
export const releasesUrl = 'https://github.com/getspas/spas/releases/latest';
export const installGuideUrl = 'https://github.com/getspas/spas/wiki/Installation';

type NoteSegment = string | { text: string; href: string };

export type InstallChannel = {
	id: string;
	label: string;
	name: string;
	lines: string[];
	note: NoteSegment[];
};

export const installChannels: InstallChannel[] = [
	{
		id: 'brew',
		label: 'brew',
		name: 'Homebrew',
		lines: ['brew install getspas/tap/spas'],
		note: ['macOS and Linux. Builds from source and installs shell completions.'],
	},
	// winget-pending: re-enable after microsoft/winget-pkgs#455022 merges.
	// {
	// 	id: 'winget',
	// 	label: 'winget',
	// 	name: 'WinGet',
	// 	lines: ['winget install --exact --id GetSPAS.SPAS --source winget --scope user'],
	// 	note: ['Windows x64 and ARM64, installed for the current user.'],
	// },
	{
		id: 'scoop',
		label: 'scoop',
		name: 'Scoop',
		lines: ['scoop bucket add getspas https://github.com/getspas/scoop-bucket', 'scoop install getspas/spas'],
		note: ['Windows x64 and ARM64. Adds the getspas bucket, then installs.'],
	},
	{
		id: 'deb-rpm',
		label: 'deb/rpm',
		name: 'Linux package, .deb or .rpm',
		lines: [],
		note: [
			'Debian, Ubuntu, Fedora, and compatible systems, amd64 and arm64. Download the .deb or .rpm from the ',
			{ text: 'latest release', href: releasesUrl },
			', then follow the ',
			{ text: 'installation guide', href: `${installGuideUrl}#downloadable-linux-packages` },
			' to verify and install it.',
		],
	},
	{
		id: 'go',
		label: 'go',
		name: 'Go source build',
		lines: ['go install -trimpath github.com/getspas/spas@latest'],
		note: ['Builds from source. Requires Go 1.26.9 or newer.'],
	},
];
