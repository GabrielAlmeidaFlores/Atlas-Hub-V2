#!/usr/bin/env python3
"""Transcribe one or many audio files to matching .txt files (Portuguese)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from faster_whisper import WhisperModel


def transcribe_file(model: WhisperModel, audio: Path, output: Path, language: str) -> None:
    segments, info = model.transcribe(
        str(audio),
        language=language,
        vad_filter=True,
        beam_size=5,
    )

    lines: list[str] = []
    for segment in segments:
        text = segment.text.strip()
        if text:
            lines.append(text)

    transcript = "\n".join(lines).strip() + ("\n" if lines else "")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(transcript, encoding="utf-8")
    print(
        f"ok lang={info.language} prob={info.language_probability:.2f} "
        f"chars={len(transcript)} -> {output}",
        flush=True,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "pairs",
        nargs="*",
        help="Optional single pair: AUDIO OUTPUT. Prefer --manifest for batches.",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        help="Text file with lines: AUDIO_PATH<TAB>OUTPUT_PATH",
    )
    parser.add_argument("--model", default="medium")
    parser.add_argument("--language", default="pt")
    parser.add_argument("--compute-type", default="int8")
    args = parser.parse_args()

    jobs: list[tuple[Path, Path]] = []

    if args.manifest:
        for raw in args.manifest.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            audio_s, output_s = line.split("\t", 1)
            jobs.append((Path(audio_s), Path(output_s)))
    elif len(args.pairs) == 2:
        jobs.append((Path(args.pairs[0]), Path(args.pairs[1])))
    else:
        print("Provide AUDIO OUTPUT or --manifest FILE", file=sys.stderr)
        return 2

    if not jobs:
        print("No jobs in manifest.", flush=True)
        return 0

    print(
        f"Loading model={args.model} compute_type={args.compute_type} jobs={len(jobs)}",
        flush=True,
    )
    model = WhisperModel(args.model, device="cpu", compute_type=args.compute_type)

    failed = 0
    for idx, (audio, output) in enumerate(jobs, start=1):
        print(f"======== [{idx}/{len(jobs)}] {audio} ========", flush=True)
        if not audio.is_file():
            print(f"audio not found: {audio}", file=sys.stderr)
            failed += 1
            continue
        try:
            transcribe_file(model, audio, output, args.language)
        except Exception as exc:  # noqa: BLE001 - keep batch going
            failed += 1
            print(f"FAILED {audio}: {exc}", file=sys.stderr)

    print(f"Done. ok={len(jobs) - failed} fail={failed}", flush=True)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
