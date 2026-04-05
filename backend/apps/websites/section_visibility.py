"""Portfolio section visibility flags (stored on UserWebsite.section_visibility)."""
from __future__ import annotations

from typing import Any, Dict, Optional

DEFAULT_SECTION_VISIBILITY = {
    "services_on_home": True,
    "services_page": True,
    "projects_on_home": True,
    "projects_page": True,
    "articles_on_home": True,
    "articles_page": True,
}


def merge_section_visibility(raw: Optional[Dict[str, Any]]) -> Dict[str, bool]:
    out = dict(DEFAULT_SECTION_VISIBILITY)
    if not raw or not isinstance(raw, dict):
        return out
    for key in DEFAULT_SECTION_VISIBILITY:
        if key in raw:
            out[key] = bool(raw[key])
    return out
