"""Phase 0: merge the four stylesheets into app/css/{tokens,base,components,scenes,modes}.css.
Cascade order is preserved: within each layer, rules keep their original order (styles → game → roman → fidelity).
Classification is by selector prefix. Run once; then delete the old files."""
import os
import re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = ['styles.css', 'game.css', 'roman.css', 'fidelity.css']
OUT = os.path.join(ROOT, 'app', 'css')
os.makedirs(OUT, exist_ok=True)

def split_blocks(css):
    """Yield top-level blocks (including @media/@keyframes with their bodies). Comments are attached to the next block."""
    blocks, i, n, depth, start = [], 0, len(css), 0, 0
    in_str, str_ch, in_comment = False, '', False
    while i < n:
        c = css[i]
        if in_comment:
            if css.startswith('*/', i): in_comment = False; i += 2; continue
            i += 1; continue
        if in_str:
            if c == '\\': i += 2; continue
            if c == str_ch: in_str = False
            i += 1; continue
        if css.startswith('/*', i): in_comment = True; i += 2; continue
        if c in '"\'': in_str = True; str_ch = c; i += 1; continue
        if c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                blocks.append(css[start:i + 1].strip()); start = i + 1
        i += 1
    tail = css[start:].strip()
    if tail: blocks.append(tail)
    return [b for b in blocks if b]

def prelude(block):
    b = re.sub(r'/\*.*?\*/', '', block, flags=re.S).strip()
    return b[:b.index('{')].strip() if '{' in b else b

def first_inner_selector(block):
    body = block[block.index('{') + 1:]
    m = re.search(r'([^{}]+)\{', body)
    return m.group(1).strip() if m else ''

SCENE_KF = {'bob', 'routeFlow', 'shoreGlow', 'flutter', 'haloPulse', 'hazeDrift', 'march', 'lock', 'redflash', 'dust', 'flicker', 'flame', 'glow', 'sweep', 'mistDrift', 'moteRise', 'flameLick', 'glowPulse', 'streak', 'cheer', 'jeer', 'burst', 'spinSlow', 'goldPulse', 'breathe', 'raise', 'bounce', 'blink'}
SCENE_RE = re.compile(r'\.(scene-|amb-|battlefield|bf-|cutscene|tent|torch|legatus|briefing|brief-|standard\b|shadow-sweep|worldmap|trail\b|map-frame|map-link|map-title|map-subtitle|map-legend|sea\b|sea-|coast|province|prov-|island\b|isl-|flag\b|route\b|node\b|camp\b|camp-|here\b|boat|legion-marker|relief|parch|cartouche|compass|eagle|lock-ico|conq\b|terr\b|land\b|shore\b|wave\b)')
MODE_RE = re.compile(r'\.(hq|cart\b|cart-|cartridges|hero|shelf|tile|world\b|level\b|quest|claim|lesson|slide|scroll|learn-|toc-|flash|order-|pool|token|bucket|match-|plan\b|plan-|task|runner|qcard|qmeta|stem|option|explain|pursuit-banner|combo|hearts|timer|reason|xp-float|review-item|score-big|carousel|dots-nav|world-page|island-page|sheet-card|level-sheet|mini-q|vizwrap|vizcap|vizhint|vizlabel|viz\b|vt\b|draw\b|pop\b|ring-pop|flow\b|spin\b|plc-stage|steps|step\b|step-|pills|pill\b|m22|icard|mkbar|mk-|elbars|elbar|elfill|funnel-step|concept|ach\b|spark|heat|kw-ico|opt-text|key-n|mdot|blank)|table\.fig|ul\.fig|ol\.fig|details\.learn-more|details\.plan')
BASE_RE = re.compile(r'^(\*|html|body|button, input|button\b|a\b|h1|h2|h3|h4|p\b|\.mono|\.muted|\.faint|\.small|\.tiny|\.eyebrow|\.row|\.stack|\.grow|\.center|\.mt|\.mb|\.hidden|:focus-visible|\.boot|\.app\b|\.shell|\.nav\b|\.nav-|\.brand|\.main\b|\.topbar|\.bottom-nav|\.view|\.page-head|\.back\b|\.divider|\.empty|\.xpbar|\.level-pill|@keyframes stock|@keyframes viewIn)')
TOKEN_RE = re.compile(r'^:root(\[[^\]]+\])?(\s*,\s*:root(\[[^\]]+\])?)*$')

def classify(block):
    p = prelude(block)
    if p.startswith('@keyframes'):
        name = p.split()[1]
        return 'scenes' if name in SCENE_KF else 'components'
    if p.startswith('@media') or p.startswith('@supports'):
        inner = first_inner_selector(block)
        return classify_selector(inner)
    return classify_selector(p)

def classify_selector(sel):
    s = sel.strip()
    if TOKEN_RE.match(s): return 'tokens'
    # strip theme/motion prefixes for classification
    core = re.sub(r'^:root(\[[^\]]+\])?\s*', '', s)
    if SCENE_RE.search(core): return 'scenes'
    if MODE_RE.search(core): return 'modes'
    if BASE_RE.match(core) or BASE_RE.match(s): return 'base'
    return 'components'

layers = {k: [] for k in ('tokens', 'base', 'components', 'scenes', 'modes')}
counts = {}
for name in SRC:
    path = os.path.join(ROOT, 'app', name)
    if not os.path.exists(path): continue
    css = open(path, encoding='utf-8').read()
    for b in split_blocks(css):
        cat = classify(b)
        layers[cat].append(b)
        counts[(name, cat)] = counts.get((name, cat), 0) + 1

HEAD = {
    'tokens': '/* Imperium design tokens — see the art bible section at the top. Legacy aliases follow. */\n',
    'base': '/* Base: reset, typography, shell layout, utilities. */\n',
    'components': '/* Components: buttons, chips, cards, forms, bars, rings, modals, toasts. */\n',
    'scenes': '/* Scenes: backdrops, battlefield, cutscenes, maps. */\n',
    'modes': '/* Modes: home, campaign, lessons, runner, arcade, learn, progress. */\n',
}
ART_BIBLE = open(os.path.join(ROOT, 'tools', 'art_bible_tokens.css'), encoding='utf-8').read() if os.path.exists(os.path.join(ROOT, 'tools', 'art_bible_tokens.css')) else ''
for cat, blocks in layers.items():
    text = HEAD[cat] + (ART_BIBLE if cat == 'tokens' else '') + '\n\n'.join(blocks) + '\n'
    open(os.path.join(OUT, cat + '.css'), 'w', encoding='utf-8').write(text)
    print(cat, len(blocks), 'blocks')
for k, v in sorted(counts.items()): print('  ', k, v)
