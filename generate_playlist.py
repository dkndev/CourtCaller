#!/usr/bin/env python3

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple, Union


DISCIPLINES_SINGLES = {"HE", "DE"}
DISCIPLINES_DOUBLES = {"HD", "DD", "GD"}
DISCIPLINES_ALL = DISCIPLINES_SINGLES | DISCIPLINES_DOUBLES


def _normalize_whitespace(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def normalize_name(name: str, *, strip_seed: bool) -> str:
    name = _normalize_whitespace(name)
    if strip_seed:
        # Remove trailing seed markers like " [1]" or " [2]" etc.
        name = re.sub(r"\s*\[[0-9]+\]\s*$", "", name).strip()
    return name


def parse_matches_from_html(html: str) -> List[Tuple[str, str, List[List[str]]]]:
    """Returns list of (discipline, level_key, rows).

    rows is a list of match rows; each row is a list of player names.
    For singles: typically 2 rows with 1 name each.
    For doubles: typically 2 rows with 2 names each.
    """

    blocks = html.split('<div class="match match--list">')
    matches: List[Tuple[str, str, List[List[str]]]] = []

    for b in blocks[1:]:
        header_m = re.search(
            r'<div class="match__header">.*?<span class="nav-link__value">\s*([^<]+?)\s*</span>',
            b,
            re.S,
        )
        if not header_m:
            continue

        title = _normalize_whitespace(header_m.group(1))
        disc_m = re.match(r"^(HE|HD|DE|DD|GD)\s+(.*)$", title)
        if not disc_m:
            continue

        discipline = disc_m.group(1)
        if discipline not in DISCIPLINES_ALL:
            continue

        rest = disc_m.group(2)
        # We group on the level part only (e.g. "3-4", "11-12", "7").
        level_key = _normalize_whitespace(rest.split(" - ")[0])

        row_htmls = re.findall(r'(<div class="match__row "[\s\S]*?</div>\s*</div>)', b)
        if not row_htmls:
            row_htmls = re.findall(r'(<div class="match__row[^\"]*"[\s\S]*?</div>\s*</div>)', b)

        rows: List[List[str]] = []
        for rh in row_htmls:
            names = re.findall(
                r'<a href="/sport/player\.aspx[^\"]*"[^>]*class="nav-link"[^>]*>\s*'
                r'<span class="nav-link__value">\s*([^<]+?)\s*</span>\s*</a>',
                rh,
                re.S,
            )
            names = [_normalize_whitespace(n) for n in names]
            if names:
                rows.append(names)

        if not rows:
            continue

        matches.append((discipline, level_key, rows))

    return matches


PlaylistValue = Union[List[str], List[List[str]]]
Playlist = Dict[str, Dict[str, PlaylistValue]]


def build_playlist(
    html_paths: Sequence[Path],
    *,
    strip_seed: bool,
) -> Playlist:
    singles: Dict[str, Dict[str, Set[str]]] = {}
    doubles: Dict[str, Dict[str, Set[Tuple[str, str]]]] = {}

    for p in html_paths:
        html = p.read_text(encoding="utf-8", errors="ignore")
        for discipline, level_key, rows in parse_matches_from_html(html):
            if discipline in DISCIPLINES_SINGLES:
                names = [normalize_name(n, strip_seed=strip_seed) for r in rows for n in r]
                names = [n for n in names if n]
                singles.setdefault(discipline, {}).setdefault(level_key, set()).update(names)
            elif discipline in DISCIPLINES_DOUBLES:
                # Each row represents a team; keep unique 2-person teams.
                for r in rows:
                    if len(r) != 2:
                        continue
                    a = normalize_name(r[0], strip_seed=strip_seed)
                    b = normalize_name(r[1], strip_seed=strip_seed)
                    if not a or not b:
                        continue
                    team = tuple(sorted((a, b)))
                    doubles.setdefault(discipline, {}).setdefault(level_key, set()).add(team)

    out: Playlist = {}

    for discipline in sorted(set(list(singles.keys()) + list(doubles.keys()))):
        levels: Dict[str, PlaylistValue] = {}

        if discipline in singles:
            for level_key, names in singles[discipline].items():
                levels[level_key] = sorted(names)

        if discipline in doubles:
            for level_key, teams in doubles[discipline].items():
                levels[level_key] = sorted([list(t) for t in teams], key=lambda t: " / ".join(t))

        # Keep deterministic key ordering; prioritize shorter keys (e.g. "7" before "1-2").
        out[discipline] = {k: levels[k] for k in sorted(levels.keys(), key=lambda x: (len(x), x))}

    return out


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Generate combined playlist from TournamentSoftware match HTML exports.")
    parser.add_argument(
        "html",
        nargs="+",
        type=Path,
        help="Input HTML files (e.g. mache_saturday.html mache_sunday.html)",
    )
    parser.add_argument(
        "--players-json",
        type=Path,
        default=Path("src/data/players.json"),
        help="Path to players.json to update (default: src/data/players.json)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Write playlist JSON to this file (optional).",
    )
    parser.add_argument(
        "--no-update",
        action="store_true",
        help="Do not modify players.json; just print/write the playlist.",
    )
    parser.add_argument(
        "--strip-seed",
        action="store_true",
        help="Strip trailing seed markers like [1] / [2] from names.",
    )

    args = parser.parse_args(argv)

    missing = [str(p) for p in args.html if not p.exists()]
    if missing:
        print("Missing input files:\n" + "\n".join(missing), file=sys.stderr)
        return 2

    playlist = build_playlist(args.html, strip_seed=args.strip_seed)

    if args.out is not None:
        dump_json(args.out, playlist)

    if args.no_update:
        print(json.dumps(playlist, ensure_ascii=False, indent=2))
        return 0

    if not args.players_json.exists():
        print(f"players.json not found: {args.players_json}", file=sys.stderr)
        return 2

    players_data = load_json(args.players_json)
    players_data["playlist"] = playlist
    dump_json(args.players_json, players_data)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
