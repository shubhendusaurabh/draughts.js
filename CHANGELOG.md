# Changelog

## 0.3.0

### Fixed
- `perft()` always returned 0 because it passed an options object where a square was expected.
- Kings could only move one square; they now move along the whole diagonal.
- A king capture was reported once per intermediate landing square; each distinct (from, to, takes) sequence is now reported once.
- `moves(square)` ignored the mandatory capture rule for the side; it now returns only captures when any piece can capture.
- Removed stray `console.log` / `console.error` output.

### Added
- Draw detection: `inDraw()` now works. New methods `insufficient_material()`, `in_threefold_repetition()`, `in_twenty_five_move_rule()` and `in_sixteen_move_rule()`.
- `load_pdn()` is wired to `parsePDN()`.
- History entries store the position before each move (`positionBefore`).
- Tests for perft (depths 1-6 from the start position), capture rules, king moves and draw rules.

### Removed
- Unused `_get_disambiguator` stub.
