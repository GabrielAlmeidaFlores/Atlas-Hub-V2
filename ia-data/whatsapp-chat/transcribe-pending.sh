#!/usr/bin/env bash
# Find WhatsApp audio files without a matching .txt transcription and
# transcribe them via Docker (faster-whisper, Portuguese).
#
# Usage:
#   ./transcribe-pending.sh              # process all pending
#   ./transcribe-pending.sh --dry-run    # only list pending
#   ./transcribe-pending.sh atlas-hub    # only one chat folder
#   WHISPER_MODEL=small ./transcribe-pending.sh
#
# Matching rule:
#   00001234-AUDIO-....opus  ->  00001234-AUDIO-....txt  (same stem)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TRANSCRIPTION_DIR="${SCRIPT_DIR}/transcription"
IMAGE_NAME="${WHISPER_IMAGE:-atlas-whisper-pt:latest}"
MODEL="${WHISPER_MODEL:-medium}"
LANGUAGE="${WHISPER_LANGUAGE:-pt}"
CACHE_DIR="${WHISPER_CACHE_DIR:-${HOME}/.cache/atlas-whisper}"
MANIFEST="${SCRIPT_DIR}/transcription/.pending-manifest.tsv"

AUDIO_EXT_REGEX='\.(opus|ogg|mp3|m4a|wav|aac|webm|oga)$'

DRY_RUN=0
REBUILD=0
TARGETS=()

usage() {
  cat <<'EOF'
Usage: ./transcribe-pending.sh [--dry-run] [--rebuild] [chat-folder ...]

Options:
  --dry-run   List pending audios without transcribing
  --rebuild   Force rebuild of the Docker image
  -h, --help  Show help

Env:
  WHISPER_MODEL      Model size (tiny|base|small|medium|large-v3). Default: medium
  WHISPER_LANGUAGE   Language code. Default: pt
  WHISPER_IMAGE      Docker image name. Default: atlas-whisper-pt:latest
  WHISPER_CACHE_DIR  Host dir for downloaded models. Default: ~/.cache/atlas-whisper
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --rebuild) REBUILD=1; shift ;;
    -h|--help) usage; exit 0 ;;
    --) shift; break ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      TARGETS+=("$1")
      shift
      ;;
  esac
done

resolve_docker() {
  if command -v docker >/dev/null 2>&1; then
    command -v docker
    return 0
  fi
  local candidates=(
    "/usr/local/bin/docker"
    "${HOME}/.docker/bin/docker"
    "/Applications/Docker.app/Contents/Resources/bin/docker"
  )
  local c
  for c in "${candidates[@]}"; do
    if [[ -x "$c" ]]; then
      echo "$c"
      return 0
    fi
  done
  return 1
}

ensure_docker() {
  if ! DOCKER_BIN="$(resolve_docker)"; then
    echo "Docker CLI not found. Install/start Docker Desktop first." >&2
    exit 1
  fi

  if ! "$DOCKER_BIN" info >/dev/null 2>&1; then
    echo "Docker daemon is not running. Trying to open Docker Desktop..." >&2
    if [[ -d "/Applications/Docker.app" ]]; then
      open -a Docker
      echo "Waiting for Docker to become ready..." >&2
      local i
      for i in $(seq 1 60); do
        if "$DOCKER_BIN" info >/dev/null 2>&1; then
          echo "Docker is ready." >&2
          return 0
        fi
        sleep 2
      done
    fi
    echo "Docker is still unavailable. Open Docker Desktop and retry." >&2
    exit 1
  fi
}

ensure_image() {
  if [[ "$REBUILD" -eq 0 ]] && "$DOCKER_BIN" image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
    return 0
  fi
  echo "Building Docker image: $IMAGE_NAME" >&2
  "$DOCKER_BIN" build -t "$IMAGE_NAME" "$TRANSCRIPTION_DIR"
}

is_audio() {
  local name
  name="$(basename "$1")"
  [[ "$name" =~ $AUDIO_EXT_REGEX ]]
}

transcript_path_for() {
  local audio="$1"
  local dir base
  dir="$(dirname "$audio")"
  base="$(basename "$audio")"
  echo "${dir}/${base%.*}.txt"
}

collect_pending() {
  local search_roots=()
  local t root

  if [[ ${#TARGETS[@]} -eq 0 ]]; then
    while IFS= read -r -d '' root; do
      search_roots+=("$root")
    done < <(find "$SCRIPT_DIR" -mindepth 1 -maxdepth 1 -type d \
      ! -name 'transcription' \
      ! -name '.*' \
      -print0 | sort -z)
  else
    for t in "${TARGETS[@]}"; do
      if [[ -d "$SCRIPT_DIR/$t" ]]; then
        search_roots+=("$SCRIPT_DIR/$t")
      elif [[ -d "$t" ]]; then
        search_roots+=("$(cd "$t" && pwd)")
      else
        echo "Chat folder not found: $t" >&2
        exit 1
      fi
    done
  fi

  local audio txt
  local -a pending=()

  for root in "${search_roots[@]}"; do
    while IFS= read -r -d '' audio; do
      is_audio "$audio" || continue
      txt="$(transcript_path_for "$audio")"
      if [[ ! -f "$txt" ]]; then
        pending+=("$audio")
      fi
    done < <(find "$root" -type f -print0 | sort -z)
  done

  printf '%s\0' "${pending[@]+"${pending[@]}"}"
}

write_manifest() {
  local -a pending=("$@")
  local audio txt rel_audio rel_txt
  : > "$MANIFEST"
  for audio in "${pending[@]}"; do
    txt="$(transcript_path_for "$audio")"
    rel_audio="${audio#"$SCRIPT_DIR"/}"
    rel_txt="${txt#"$SCRIPT_DIR"/}"
    printf '/work/%s\t/work/%s\n' "$rel_audio" "$rel_txt" >> "$MANIFEST"
  done
}

run_batch() {
  mkdir -p "$CACHE_DIR"
  "$DOCKER_BIN" run --rm \
    -v "$SCRIPT_DIR:/work" \
    -v "$CACHE_DIR:/root/.cache/huggingface" \
    -w /work \
    "$IMAGE_NAME" \
    --manifest /work/transcription/.pending-manifest.tsv \
    --model "$MODEL" \
    --language "$LANGUAGE"
}

main() {
  echo "Root:   $SCRIPT_DIR"
  echo "Model:  $MODEL"
  echo "Lang:   $LANGUAGE"
  echo "Image:  $IMAGE_NAME"
  echo

  local -a pending=()
  local item
  while IFS= read -r -d '' item; do
    [[ -n "$item" ]] && pending+=("$item")
  done < <(collect_pending)

  local total="${#pending[@]}"
  echo "Pending transcriptions: $total"

  if [[ "$total" -eq 0 ]]; then
    echo "Nothing to do."
    exit 0
  fi

  local i=0
  for item in "${pending[@]}"; do
    i=$((i + 1))
    printf '[%d/%d] %s\n' "$i" "$total" "${item#"$SCRIPT_DIR"/}"
  done

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo
    echo "Dry-run only. Re-run without --dry-run to transcribe."
    exit 0
  fi

  ensure_docker
  ensure_image
  write_manifest "${pending[@]}"

  echo
  echo "Starting batch transcription (model loaded once)..."
  run_batch
  rm -f "$MANIFEST"
}

main "$@"
