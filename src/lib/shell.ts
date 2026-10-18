export type TokenKind = 'bin' | 'sub' | 'flag' | 'arg' | 'op';

const VERBS = new Set([
	'install',
	'bucket',
	'add',
	'link',
	'remove',
	'sync',
	'status',
	'diff',
	'doctor',
	'unlink',
	'completion',
	'version',
]);

export function tokenizeCommand(line: string): { text: string; kind: TokenKind }[] {
	let leading = true;
	return line.split(' ').map((text, i) => {
		let kind: TokenKind;
		if (i === 0) kind = 'bin';
		else if (/^[|&;<>]+$/.test(text)) {
			kind = 'op';
			leading = false;
		} else if (text.startsWith('-')) {
			kind = 'flag';
			leading = false;
		} else if (leading && VERBS.has(text)) kind = 'sub';
		else {
			kind = 'arg';
			leading = false;
		}
		return { text, kind };
	});
}
