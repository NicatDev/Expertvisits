"""Portfolio section visibility flags (stored on UserWebsite.section_visibility)."""
from __future__ import annotations

from typing import Any, Dict, Optional

DEFAULT_SECTION_VISIBILITY = {
    "services_on_home": False,
    "services_page": False,
    "projects_on_home": False,
    "projects_page": False,
    "articles_on_home": False,
    "articles_page": False,
}


def merge_section_visibility(raw: Optional[Dict[str, Any]]) -> Dict[str, bool]:
    out = dict(DEFAULT_SECTION_VISIBILITY)
    if not raw or not isinstance(raw, dict):
        return out
    for key in DEFAULT_SECTION_VISIBILITY:
        if key in raw:
            out[key] = bool(raw[key])
    return out
