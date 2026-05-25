#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

CMD="${1:-}"
IMAGE_NAME="${IMAGE_NAME:-ver/v-ecommerce-frontend}"
REMOTE="${REMOTE:-prod}"
SSH_KEY="${SSH_KEY:-}"
REMOTE_DIR="${REMOTE_DIR:-/root/gk/ecommerce-web}"
REMOTE_BASE="${REMOTE_DIR%/*}"
TS="$(date +%Y%m%d-%H%M%S)"
LOCAL_DEV_DIR="artifacts/dev"
LOCAL_PROD_DIR="artifacts/prod"

ssh_cmd() {
  if [ -n "$SSH_KEY" ]; then
    ssh -i "$SSH_KEY" "$REMOTE" "$@"
  else
    ssh "$REMOTE" "$@"
  fi
}

scp_cmd() {
  if [ -n "$SSH_KEY" ]; then
    scp -i "$SSH_KEY" "$@"
  else
    scp "$@"
  fi
}

remote() {
  ssh_cmd "$1"
}

require_clean_commit() {
  node scripts/ecommerce-build-preflight.mjs
}

write_version_json() {
  lane="$1"
  mkdir -p dist
  sha="$(git rev-parse HEAD)"
  short_sha="$(git rev-parse --short=12 HEAD)"
  branch="$(git rev-parse --abbrev-ref HEAD)"
  subject="$(git log -1 --pretty=%s | sed 's/["\\]/_/g')"
  built_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  cat > dist/version.json <<JSON
{
  "app": "ecommerce-frontend",
  "lane": "$lane",
  "git_sha": "$sha",
  "short_sha": "$short_sha",
  "branch": "$branch",
  "commit_subject": "$subject",
  "build_time": "$built_at"
}
JSON
}

send_files() {
  out_file="$1"
  out_base="$(basename "$out_file")"
  remote "mkdir -p '$REMOTE_DIR' '$REMOTE_BASE'"
  scp_cmd "$out_file" "$REMOTE:$REMOTE_BASE/"
  scp_cmd deploy/docker-compose.yml "$REMOTE:$REMOTE_DIR/docker-compose.yml"
  scp_cmd deploy/ecommerce-nginx.conf "$REMOTE:$REMOTE_DIR/ecommerce-nginx.conf"
  echo "$REMOTE_BASE/$out_base"
}

local_image_id() {
  docker image inspect "$1" --format '{{.Id}}' 2>/dev/null || true
}

remove_local_image_if_unused() {
  image_id="$1"
  [ -z "$image_id" ] && return 0
  running_ref="$(docker ps -aq --filter "ancestor=$image_id" 2>/dev/null || true)"
  [ -n "$running_ref" ] && return 0
  docker rmi "$image_id" >/dev/null 2>&1 || true
}

health_wait() {
  name="$1"
  lim="$2"
  remote "for i in \$(seq 1 $lim); do s=\$(docker inspect -f '{{.State.Health.Status}}' $name 2>/dev/null || echo none); [ \"\$s\" = \"healthy\" ] && echo HEALTHY && exit 0; sleep 2; done; docker ps --filter name=$name --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'; echo HEALTH_CHECK_FAILED; exit 1"
}

prune_local_tars() {
  dir="$1"
  keep="$2"
  [ -d "$dir" ] || return 0
  count="$(ls -1t "$dir"/*.tar.gz 2>/dev/null | wc -l | tr -d ' ')"
  [ "$count" -le "$keep" ] && return 0
  ls -1t "$dir"/*.tar.gz 2>/dev/null | tail -n +$((keep + 1)) | xargs -r rm -f
}

prune_remote_tars() {
  remote_dir="$1"
  keep="$2"
  remote "mkdir -p '$remote_dir'; cd '$remote_dir'; count=\$(ls -1t *.tar.gz 2>/dev/null | wc -l | tr -d ' '); if [ \"\$count\" -gt $keep ]; then ls -1t *.tar.gz | tail -n +$((keep + 1)) | xargs -r rm -f; fi"
}

case "$CMD" in
  dev)
    require_clean_commit
    DEV_TAG="${DEV_TAG:-dev}"
    IMG="$IMAGE_NAME:$DEV_TAG"
    OLD_LOCAL_IMAGE_ID="$(local_image_id "$IMG")"
    mkdir -p "$LOCAL_DEV_DIR"
    OUT="$LOCAL_DEV_DIR/${IMAGE_NAME##*/}_dev_$TS.tar.gz"
    echo "Building Frontend Locally for dev lane..."
    if [ "${SKIP_NPM_CI:-0}" = "1" ]; then
      echo "Skipping npm ci because SKIP_NPM_CI=1"
    else
      npm ci --legacy-peer-deps
    fi
    npm run build
    write_version_json dev
    docker buildx build --platform linux/amd64 \
      --label "org.opencontainers.image.revision=$(git rev-parse HEAD)" \
      --label "org.opencontainers.image.source=ecommerce-frontend" \
      --label "org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      -f deploy/Dockerfile.dev -t "$IMG" .
    NEW_LOCAL_IMAGE_ID="$(local_image_id "$IMG")"
    if [ -n "$OLD_LOCAL_IMAGE_ID" ] && [ "$OLD_LOCAL_IMAGE_ID" != "$NEW_LOCAL_IMAGE_ID" ]; then
      remove_local_image_if_unused "$OLD_LOCAL_IMAGE_ID"
    fi
    docker save "$IMG" | gzip > "$OUT"
    REMOTE_OUT="$(send_files "$OUT")"
    OLD_REMOTE_IMAGE_ID="$(remote "docker image inspect '$IMG' --format '{{.Id}}' 2>/dev/null || true")"
    remote "docker load -i '$REMOTE_OUT'"
    remote "mkdir -p '$REMOTE_BASE/backups/dev'; mv -f '$REMOTE_OUT' '$REMOTE_BASE/backups/dev/'"
    prune_remote_tars "$REMOTE_BASE/backups/dev" 2
    prune_local_tars "$LOCAL_DEV_DIR" 2
    remote "cd '$REMOTE_DIR'; DEV_TAG='$DEV_TAG' docker compose up -d dev-ecommerce-web"
    health_wait v-ecommerce-frontend-dev 20
    NEW_REMOTE_IMAGE_ID="$(remote "docker image inspect '$IMG' --format '{{.Id}}' 2>/dev/null || true")"
    if [ -n "$OLD_REMOTE_IMAGE_ID" ] && [ "$OLD_REMOTE_IMAGE_ID" != "$NEW_REMOTE_IMAGE_ID" ]; then
      remote "cid=\$(docker ps -aq --filter ancestor=$OLD_REMOTE_IMAGE_ID 2>/dev/null || true); [ -n \"\$cid\" ] || docker rmi '$OLD_REMOTE_IMAGE_ID' >/dev/null 2>&1 || true"
    fi
    ;;
  promote)
    # Promotion intentionally happens on prod after dev is verified.
    SRC_TAG="${SRC_TAG:-dev}"
    NEW_TAG="${PROD_TAG:-prod-$TS}"
    remote "img_id=\$(docker images -q '$IMAGE_NAME:$SRC_TAG'); [ -z \"\$img_id\" ] && echo MISSING_DEV_IMAGE && exit 1 || docker tag '$IMAGE_NAME:$SRC_TAG' '$IMAGE_NAME:$NEW_TAG'"
    remote "cur=\$(docker inspect -f '{{.Config.Image}}' v-ecommerce-frontend 2>/dev/null || echo ''); if [ -n \"\$cur\" ]; then tag=\$(echo \"\$cur\" | awk -F: '{print \$2}'); [ -n \"\$tag\" ] && echo \"\$tag\" > '$REMOTE_DIR/.prod_prev'; fi || true"
    remote "cd '$REMOTE_DIR'; PROD_TAG='$NEW_TAG' docker compose up -d prod-ecommerce-web"
    health_wait v-ecommerce-frontend 60
    ;;
  *)
    echo "Usage: deploy/deploy.sh [dev|promote]"
    echo "ENV: IMAGE_NAME, REMOTE, SSH_KEY, REMOTE_DIR, DEV_TAG, PROD_TAG, SRC_TAG, SKIP_NPM_CI"
    exit 1
    ;;
esac
