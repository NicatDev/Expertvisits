"""
Məqalə gövdəsindəki <a> linkləri: TipTap/richtext-dən gələn HTML üçün rel siyasəti.
Xarici linklər: nofollow ugc (+ təhlükəsizlik üçün noopener noreferrer, target=_blank).
Daxili (expertvisits.com və nisbi yollar): nofollow tətbiq olunmur.
"""
from __future__ import annotations

import re
from urllib.parse import urlparse

# CORS / platform hostları ilə uyğun
_INTERNAL_HOSTS = frozenset(
    {
        'expertvisits.com',
        'www.expertvisits.com',
        'app.expertvisits.com',
        'api.expertvisits.com',
        'website.expertvisits.com',
        'localhost',
        '127.0.0.1',
    }
)

_EXTERNAL_REL = ('nofollow', 'ugc', 'noopener', 'noreferrer')
_REL_ORDER = ('nofollow', 'ugc', 'sponsored', 'noopener', 'noreferrer')

_A_OPEN = re.compile(r'<a(\s[^>]*)>', re.IGNORECASE)
_HREF = re.compile(r"""href\s*=\s*(['"])(.*?)\1""", re.IGNORECASE | re.DOTALL)
_REL = re.compile(r"""rel\s*=\s*(['"])(.*?)\1""", re.IGNORECASE | re.DOTALL)
_TARGET = re.compile(r"""target\s*=\s*(['"])(.*?)\1""", re.IGNORECASE)


def _host_is_internal(host: str) -> bool:
    h = (host or '').lower().split(':')[0]
    if not h:
        return True
    if h in _INTERNAL_HOSTS:
        return True
    return h.endswith('.expertvisits.com')


def _href_is_internal(href: str) -> bool:
    if not href or href.startswith('#'):
        return True
    if href.startswith('mailto:'):
        return True
    if href.startswith('/') and not href.startswith('//'):
        return True
    parsed = urlparse(href)
    if not parsed.netloc:
        return True
    return _host_is_internal(parsed.netloc)


def _parse_rel(value: str | None) -> set[str]:
    if not value:
        return set()
    return {t.strip().lower() for t in value.split() if t.strip() and t.strip().lower() != 'dofollow'}


def _format_rel(tokens: set[str]) -> str:
    return ' '.join(t for t in _REL_ORDER if t in tokens)


def _set_or_replace_attr(attrs: str, name: str, value: str) -> str:
    pattern = re.compile(rf"""{name}\s*=\s*(['"])(.*?)\1""", re.IGNORECASE | re.DOTALL)
    replacement = f'{name}="{value}"'
    if pattern.search(attrs):
        return pattern.sub(replacement, attrs, count=1)
    return f'{attrs.rstrip()} {replacement}'.strip()


def _process_anchor(attrs: str) -> str:
    m = _HREF.search(attrs)
    if not m:
        return f'<a{attrs}>'
    href = m.group(2).strip()
    if _href_is_internal(href):
        return f'<a{attrs}>'

    rel_tokens = set(_EXTERNAL_REL) | _parse_rel(_REL.search(attrs).group(2) if _REL.search(attrs) else None)
    rel_tokens.discard('dofollow')
    out = attrs
    out = _set_or_replace_attr(out, 'rel', _format_rel(rel_tokens))
    out = _set_or_replace_attr(out, 'target', '_blank')
    return f'<a {out.strip()}>'


def apply_article_link_policy(html: str | None) -> str:
    if not html:
        return html or ''

    def repl(match: re.Match) -> str:
        return _process_anchor(match.group(1))

    return _A_OPEN.sub(repl, html)
