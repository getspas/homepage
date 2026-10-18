const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------------- word-mask heading split ---------------- */

function initSplitHeadings() {
	if (prefersReducedMotion.matches) return;
	const heads = document.querySelectorAll<HTMLElement>('[data-split]');
	for (const head of heads) {
		const label = (head.innerText || head.textContent || '').replace(/\s+/g, ' ').trim();
		head.setAttribute('aria-label', label);
		let wi = 0;
		const wrapWords = (node: Node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				const text = node.textContent ?? '';
				const frag = document.createDocumentFragment();
				for (const part of text.split(/(\s+)/)) {
					if (!part) continue;
					if (/^\s+$/.test(part)) {
						frag.appendChild(document.createTextNode(part));
					} else {
						const w = document.createElement('span');
						w.className = 'w';
						w.setAttribute('aria-hidden', 'true');
						const inner = document.createElement('span');
						inner.className = 'w-i';
						inner.style.setProperty('--wi', String(Math.min(wi, 14)));
						inner.textContent = part;
						w.appendChild(inner);
						frag.appendChild(w);
						wi += 1;
					}
				}
				node.parentNode?.replaceChild(frag, node);
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node as HTMLElement;
				if (el.tagName === 'BR') return;
				Array.from(el.childNodes).forEach(wrapWords);
			}
		};
		Array.from(head.childNodes).forEach(wrapWords);
		head.classList.add('split-ready');
	}
	// hero h1 isn't IO-revealed: trigger it directly next frame
	const heroH1 = document.querySelector<HTMLElement>('h1.split-ready[data-split]');
	if (heroH1) requestAnimationFrame(() => heroH1.classList.add('is-in'));
}

/* ---------------- scroll reveal ---------------- */

function initReveal() {
	const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
	if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
		els.forEach((el) => el.classList.add('is-in'));
		return;
	}
	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (e.isIntersecting) {
					e.target.classList.add('is-in');
					io.unobserve(e.target);
				}
			}
		},
		{ threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
	);
	els.forEach((el) => io.observe(el));
}

/* ---------------- nav state ---------------- */

function initNav() {
	const nav = document.querySelector('.site-nav');
	const sentinel = document.getElementById('nav-sentinel');
	if (!nav || !sentinel) return;
	new IntersectionObserver(([e]) => nav.classList.toggle('scrolled', !e.isIntersecting), {
		rootMargin: '-1px 0px 0px 0px',
	}).observe(sentinel);
}

/* ---------------- scroll spy ---------------- */

function initScrollSpy() {
	const nav = document.querySelector('.site-nav');
	if (!nav) return;
	const ids = ['use-cases', 'how-it-works', 'features', 'commands', 'quickstart'];
	const links = ids.map((id) => ({
		id,
		els: Array.from(nav.querySelectorAll<HTMLElement>(`a[href$="#${id}"]`)),
	}));
	const visible = new Map<string, boolean>();
	const sections = ids
		.map((id) => document.getElementById(id))
		.filter((el): el is HTMLElement => el !== null);
	if (!sections.length) return;

	const update = () => {
		const active = ids.find((id) => visible.get(id)) ?? null;
		for (const { id, els } of links) {
			for (const el of els) {
				if (id === active) el.setAttribute('aria-current', 'true');
				else el.removeAttribute('aria-current');
			}
		}
	};

	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) visible.set(e.target.id, e.isIntersecting);
			update();
		},
		{ rootMargin: '-40% 0px -55% 0px' }
	);
	sections.forEach((s) => io.observe(s));
}

/* ---------------- mobile menu ---------------- */

function initMobileMenu() {
	const btn = document.getElementById('nav-menu-btn');
	const menu = document.getElementById('mobile-menu');
	if (!btn || !menu) return;
	const openIcon = btn.querySelector('.menu-icon-open');
	const closeIcon = btn.querySelector('.menu-icon-close');

	const isOpen = () => menu.classList.contains('open');
	const setOpen = (open: boolean) => {
		menu.classList.toggle('open', open);
		btn.setAttribute('aria-expanded', String(open));
		btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
		openIcon?.classList.toggle('hidden', open);
		closeIcon?.classList.toggle('hidden', !open);
	};

	btn.addEventListener('click', () => setOpen(!isOpen()));
	menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && isOpen()) {
			setOpen(false);
			btn.focus();
		}
	});
	document.addEventListener('click', (e) => {
		if (isOpen() && e.target instanceof Node && !menu.contains(e.target) && !btn.contains(e.target)) {
			setOpen(false);
		}
	});
	window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
		if (e.matches) setOpen(false);
	});
}

/* ---------------- theme toggle ---------------- */

function initThemeToggle() {
	const btn = document.getElementById('theme-toggle');
	if (!btn) return;
	const root = document.documentElement;
	const mq = window.matchMedia('(prefers-color-scheme: light)');
	const effective = () =>
		root.dataset.theme === 'light' || root.dataset.theme === 'dark'
			? root.dataset.theme
			: mq.matches
				? 'light'
				: 'dark';
	const setLabel = () =>
		btn.setAttribute(
			'aria-label',
			effective() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
		);
	btn.hidden = false;
	setLabel();
	btn.addEventListener('click', () => {
		const next = effective() === 'dark' ? 'light' : 'dark';
		const apply = () => {
			root.dataset.theme = next;
			localStorage.setItem('theme', next);
			setLabel();
		};
		if (
			prefersReducedMotion.matches ||
			typeof (document as Document & { startViewTransition?: unknown }).startViewTransition !==
				'function'
		) {
			apply();
			return;
		}
		root.classList.add('theme-vt');
		const rect = btn.getBoundingClientRect();
		const x = rect.left + rect.width / 2;
		const y = rect.top + rect.height / 2;
		const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
		const vt = document.startViewTransition(apply);
		void vt.ready.then(() => {
			root.animate(
				{
					clipPath: [
						`circle(0px at ${x}px ${y}px)`,
						`circle(${r}px at ${x}px ${y}px)`,
					],
				},
				{
					duration: 520,
					easing: 'cubic-bezier(0.16,1,0.3,1)',
					pseudoElement: '::view-transition-new(root)',
				}
			);
		});
		void vt.finished.finally(() => root.classList.remove('theme-vt'));
	});
	mq.addEventListener('change', () => {
		if (!root.dataset.theme) setLabel();
	});
}

/* ---------------- install pickers ---------------- */

function initInstall() {
	const pickers = Array.from(document.querySelectorAll<HTMLElement>('[data-install]'));
	if (!pickers.length) return;
	const select = (value: string) =>
		pickers.forEach((p) => {
			const radio = p.querySelector<HTMLInputElement>(`input[value="${value}"]`);
			if (radio) radio.checked = true;
		});
	const nav = navigator as Navigator & { userAgentData?: { platform: string } };
	const platform = nav.userAgentData?.platform || navigator.platform;
	// winget-pending: switch the Windows default back to 'winget'.
	const detected = /win/i.test(platform) ? 'scoop' : /mac/i.test(platform) ? 'brew' : /linux/i.test(platform) ? 'deb-rpm' : null;
	if (detected) select(detected);

	// sliding indicator per picker
	const indicators = pickers.map((p) => {
		const opts = p.querySelector<HTMLElement>('.install-opts');
		if (!opts) return null;
		const ind = document.createElement('span');
		ind.className = 'install-ind';
		ind.setAttribute('aria-hidden', 'true');
		opts.appendChild(ind);
		const place = () => {
			const checked = opts.querySelector<HTMLInputElement>('input:checked');
			const label = checked?.nextElementSibling as HTMLElement | null;
			if (!label) return;
			ind.style.translate = `${label.offsetLeft}px ${label.offsetTop + label.offsetHeight - 2}px`;
			ind.style.scale = `${label.offsetWidth} 1`;
			if (!ind.classList.contains('ind-ready')) {
				requestAnimationFrame(() => ind.classList.add('ind-ready'));
				p.classList.add('has-ind');
			}
		};
		new ResizeObserver(place).observe(opts);
		if (document.fonts) void document.fonts.ready.then(place);
		place();
		return place;
	});
	const updateIndicators = () => indicators.forEach((fn) => fn?.());

	pickers.forEach((p) =>
		p.addEventListener('change', (e) => {
			if (e.target instanceof HTMLInputElement) {
				select(e.target.value);
				updateIndicators();
			}
		})
	);
}

/* ---------------- copy buttons ---------------- */

function initCopy() {
	const status = document.getElementById('sr-status');
	document.querySelectorAll<HTMLButtonElement>('.copy-btn[data-copy]').forEach((btn) => {
		const [copyIcon, checkIcon] = Array.from(btn.querySelectorAll('svg'));
		btn.addEventListener('click', async () => {
			const text = btn.dataset.copy ?? '';
			try {
				await navigator.clipboard.writeText(text);
			} catch {
				const ta = document.createElement('textarea');
				ta.value = text;
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				ta.remove();
			}
			if (status) {
				status.textContent = '';
				requestAnimationFrame(() => {
					status.textContent = 'Copied to clipboard';
				});
			}
			btn.classList.add('copied');
			copyIcon?.classList.add('hidden');
			checkIcon?.classList.remove('hidden');
			setTimeout(() => {
				btn.classList.remove('copied');
				copyIcon?.classList.remove('hidden');
				checkIcon?.classList.add('hidden');
			}, 1600);
		});
	});
}

/* ---------------- hero terminal ---------------- */

type Seg = [string, string];
type Step =
	| { type: 'cmd'; segments: Seg[] }
	| { type: 'out'; lines: Seg[][] };

function initTerminal() {
	const term = document.getElementById('hero-terminal');
	const live = document.getElementById('term-live');
	const replay = document.getElementById('term-replay');
	const dataEl = document.getElementById('term-script');
	if (!term || !live || !dataEl) return;

	const steps = JSON.parse(dataEl.textContent ?? '[]') as Step[];
	if (!steps.length || prefersReducedMotion.matches) return;

	replay?.removeAttribute('hidden');

	let timers: ReturnType<typeof setTimeout>[] = [];
	let runId = 0;

	const wait = (ms: number) =>
		new Promise<void>((resolve) => timers.push(setTimeout(resolve, ms)));

	const makeLine = () => {
		const div = document.createElement('div');
		div.className = 'term-line';
		return div;
	};

	const appendPromptLine = () => {
		const line = makeLine();
		const prompt = document.createElement('span');
		prompt.className = 't-prompt';
		prompt.textContent = '❯ ';
		line.appendChild(prompt);
		live.appendChild(line);
		return line;
	};

	async function typeCommand(line: HTMLElement, segments: Seg[], id: number) {
		const caret = document.createElement('span');
		caret.className = 'term-caret';
		line.appendChild(caret);
		for (const [text, cls] of segments) {
			const span = document.createElement('span');
			span.className = cls;
			line.insertBefore(span, caret);
			for (const ch of text) {
				span.textContent += ch;
				await wait(18 + Math.random() * 30);
				if (id !== runId) return null;
			}
		}
		return caret;
	}

	async function renderOut(lines: Seg[][], id: number) {
		for (const segs of lines) {
			const line = makeLine();
			for (const [text, cls] of segs) {
				const span = document.createElement('span');
				span.className = cls;
				span.textContent = text;
				line.appendChild(span);
			}
			live.appendChild(line);
			await wait(150);
			if (id !== runId) return false;
		}
		return true;
	}

	async function play() {
		const id = ++runId;
		timers.forEach(clearTimeout);
		timers = [];
		term.classList.add('is-playing');
		live.replaceChildren();
		for (const step of steps) {
			if (step.type === 'cmd') {
				const line = appendPromptLine();
				const caret = await typeCommand(line, step.segments, id);
				if (!caret) return;
				await wait(320);
				if (id !== runId) return;
				caret.remove();
			} else {
				if (!(await renderOut(step.lines, id))) return;
				await wait(160);
				if (id !== runId) return;
			}
		}
		// trailing prompt + blinking caret
		const line = appendPromptLine();
		const caret = document.createElement('span');
		caret.className = 'term-caret';
		line.appendChild(caret);
	}

	new IntersectionObserver(
		([e], io) => {
			if (e.isIntersecting) {
				io.disconnect();
				setTimeout(() => void play(), 700);
			}
		},
		{ threshold: 0.35 }
	).observe(term);

	replay?.addEventListener('click', () => void play());
}

/* ---------------- command explorer ---------------- */

function initCommandExplorer() {
	const root = document.getElementById('command-explorer');
	if (!root) return;
	const strip = root.querySelector<HTMLElement>('[role="tablist"]');
	const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
	const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
	if (!tabs.length || !panels.length) return;

	const scrollStrip = (tab: HTMLElement) => {
		if (!strip || strip.scrollWidth <= strip.clientWidth) return;
		const max = strip.scrollWidth - strip.clientWidth;
		let left = strip.scrollLeft;
		if (tab.offsetLeft < left) left = tab.offsetLeft;
		else if (tab.offsetLeft + tab.offsetWidth > left + strip.clientWidth)
			left = tab.offsetLeft + tab.offsetWidth - strip.clientWidth;
		strip.scrollTo({
			left: Math.min(Math.max(left, 0), max),
			behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
		});
	};

	// sliding indicator
	const ind = document.createElement('span');
	ind.className = 'cmd-ind';
	ind.setAttribute('aria-hidden', 'true');
	strip?.appendChild(ind);
	const wide = window.matchMedia('(min-width: 1024px)');
	const placeInd = () => {
		const tab = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
		if (!tab || !strip) return;
		if (wide.matches) {
			ind.style.translate = `0 ${tab.offsetTop}px`;
			ind.style.scale = `1 ${tab.offsetHeight}`;
		} else {
			ind.style.translate = `${tab.offsetLeft}px ${tab.offsetTop + tab.offsetHeight - 2}px`;
			ind.style.scale = `${tab.offsetWidth} 1`;
		}
		if (!ind.classList.contains('ind-ready')) {
			requestAnimationFrame(() => ind.classList.add('ind-ready'));
			root.classList.add('has-ind');
		}
	};
	if (strip) new ResizeObserver(placeInd).observe(strip);
	wide.addEventListener('change', placeInd);
	if (document.fonts) void document.fonts.ready.then(placeInd);

	const activate = (id: string) => {
		let activeTab: HTMLElement | null = null;
		tabs.forEach((it) => {
			const on = it.dataset.cmd === id;
			it.setAttribute('aria-selected', String(on));
			it.tabIndex = on ? 0 : -1;
			if (on) activeTab = it;
		});
		panels.forEach((p) => {
			const on = p.dataset.panel === id;
			p.classList.toggle('active', on);
			p.setAttribute('aria-hidden', String(!on));
		});
		if (activeTab) scrollStrip(activeTab);
		placeInd();
	};

	const move = (from: number, dir: number) => {
		const next = (from + dir + tabs.length) % tabs.length;
		const tab = tabs[next];
		tab.focus();
		activate(tab.dataset.cmd!);
	};

	tabs.forEach((tab, i) => {
		tab.addEventListener('click', () => activate(tab.dataset.cmd!));
		tab.addEventListener('keydown', (e) => {
			switch (e.key) {
				case 'ArrowDown':
				case 'ArrowRight':
					e.preventDefault();
					move(i, 1);
					break;
				case 'ArrowUp':
				case 'ArrowLeft':
					e.preventDefault();
					move(i, -1);
					break;
				case 'Home':
					e.preventDefault();
					move(i, -i);
					break;
				case 'End':
					e.preventDefault();
					move(i, tabs.length - 1 - i);
					break;
			}
		});
	});

	const selected = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
	if (selected) scrollStrip(selected);
	placeInd();
}

/* ---------------- diagram flow ---------------- */

function initFlowDiagram() {
	const root = document.querySelector<HTMLElement>('[data-flow]');
	if (!root) return;
	const col = root.querySelector<HTMLElement>('.diagram-connectors');
	const svg = col?.querySelector('svg');
	if (!col || !svg) return;

	const routeGroups = Array.from(svg.querySelectorAll<SVGGElement>('g[data-route]'));
	const dots = Array.from(col.querySelectorAll<HTMLElement>('.flow-dot'));
	const gitLabel = col.querySelector<HTMLElement>('[data-label="git"]');
	const spasLabel = col.querySelector<HTMLElement>('[data-label="spas"]');

	const measure = () => {
		const crect = col.getBoundingClientRect();
		const W = crect.width;
		const H = crect.height;
		if (!W || !H) return;
		svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

		const midY = (el: Element) => {
			const r = el.getBoundingClientRect();
			return r.top - crect.top + r.height / 2;
		};

		let spasLabelY = 0;
		let spasRoutes = 0;

		for (const g of routeGroups) {
			const route = g.dataset.route!;
			const ports = Array.from(root.querySelectorAll(`[data-port="${route}"]`));
			const target = root.querySelector(`[data-target="${route}"]`);
			const paths = g.querySelectorAll('path');
			const idx = routeGroups.filter((x) => x.dataset.route === route).indexOf(g);
			const port = ports[idx];
			if (!port || !target) continue;
			const ys = midY(port);
			const yt = midY(target);
			const d = `M 0 ${ys} C ${W * 0.55} ${ys}, ${W * 0.45} ${yt}, ${W} ${yt}`;
			paths.forEach((p) => p.setAttribute('d', d));

			const circle = svg.querySelector(`[data-target-port="${route}"]`);
			if (circle) {
				circle.setAttribute('cx', String(W));
				circle.setAttribute('cy', String(yt));
			}
			const dot = dots[idx];
			if (route === 'spas' && dot) dot.style.offsetPath = `path("${d}")`;

			if (route === 'git' && gitLabel) gitLabel.style.top = `${(ys + yt) / 2}px`;
			if (route === 'spas') {
				spasLabelY += (ys + yt) / 2;
				spasRoutes += 1;
			}
		}
		if (spasLabel && spasRoutes) spasLabel.style.top = `${spasLabelY / spasRoutes}px`;
	};

	new ResizeObserver(measure).observe(root);
	if (document.fonts) void document.fonts.ready.then(measure);
	measure();
}

/* ---------------- tile spotlight ---------------- */

function initTileSpotlight() {
	if (window.matchMedia('(pointer: coarse)').matches) return;
	document.querySelectorAll<HTMLElement>('.tile').forEach((tile) => {
		tile.addEventListener('pointermove', (e) => {
			const r = tile.getBoundingClientRect();
			tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
			tile.style.setProperty('--my', `${e.clientY - r.top}px`);
		});
	});
}

initSplitHeadings();
initReveal();
initNav();
initScrollSpy();
initMobileMenu();
initThemeToggle();
initInstall();
initCopy();
initTerminal();
initCommandExplorer();
initFlowDiagram();
initTileSpotlight();
