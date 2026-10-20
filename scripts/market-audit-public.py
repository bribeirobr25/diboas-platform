"""Optional read-only public-page probe: 12 sequential GETs, 20s timeout each.

Run explicitly; never part of offline CI. No forms, assets or provider calls.
Only hashes, booleans, response timings and selected header presence are emitted.
"""

import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.text = []
        self.html_lang = None
        self.gauge_names = []
        self.groups = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if tag in ("script", "style"):
            self.skip += 1
        if tag == "html":
            self.html_lang = attr.get("lang")
        if attr.get("role") == "img" and "aria-label" in attr:
            self.gauge_names.append(attr["aria-label"])
        if "data-status" in attr:
            self.groups.append(attr["data-status"])
        if tag == "a":
            self.links.append(attr.get("href", ""))

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip -= 1

    def handle_data(self, text):
        if not self.skip:
            self.text.append(text)


def normalize(text):
    return " ".join(text.split())


regime = json.loads((ROOT / "apps/web/data/market/shared/regime.json").read_text())
results = []
for locale in ("en", "pt-BR", "es", "de"):
    labels = json.loads(
        (ROOT / f"packages/i18n/translations/{locale}/market.json").read_text()
    )["dashboard"]
    for view in ("", "/bitcoin", "/backdrop"):
        url = f"https://diboas.com/{locale}/market{view}"
        started = time.monotonic()
        request = Request(url, headers={"User-Agent": "diBoaS-owner-authorized-read-only-audit"})
        with urlopen(request, timeout=20) as response:
            html = response.read()
            headers = response.headers
            status = response.status
            final_url = response.url
        page = Page()
        page.feed(html.decode("utf-8"))
        text = normalize(" ".join(page.text))
        row = {
            "url": url,
            "final_url": final_url,
            "http_status": status,
            "seconds": round(time.monotonic() - started, 3),
            "html_bytes": len(html),
            "sha256": hashlib.sha256(html).hexdigest(),
            "language_matches": page.html_lang == locale,
            "acquisition_link_present": any(
                "source=adelaide_daily" in link for link in page.links
            ),
            "headers_present": {
                key: bool(headers.get(key))
                for key in (
                    "Content-Security-Policy",
                    "Strict-Transport-Security",
                    "X-Content-Type-Options",
                    "Referrer-Policy",
                )
            },
        }
        if view == "/bitcoin":
            row["matches_local_baseline"] = {
                "score": bool(re.search(
                    rf'\b{regime["score"]}\s*/\s*{regime["max_score"]}\b', text
                )),
                "band": labels["regimeLabels"][regime["regime_code"]] in text,
                "confidence": labels["confidence"][regime["data_status"]["overall_confidence"]] in text,
                "memo": normalize(regime["summary"][locale]["detailed"]) in text,
                "unavailable_word": labels["freshness"]["UNAVAILABLE"] in text,
                "unavailable_group": "UNAVAILABLE" in page.groups,
                "cycle_date_in_chart": regime["last_updated_at"][:10] in text,
            }
            row["gauge_name_has_score"] = any(
                f'{regime["score"]}/{regime["max_score"]}' in name
                for name in page.gauge_names
            )
            # Any of the five raw band codes, not only the current band's.
            row["raw_chart_band_code_present"] = any(
                code in text
                for code in ("VERY_FAVORABLE", "CONSTRUCTIVE", "NEUTRAL_MIXED", "DEFENSIVE", "HOSTILE")
            )
        results.append(row)
print(json.dumps({"pages": results, "note": "HTTP/SSR sample, not browser rendering or load testing."}, indent=2))
