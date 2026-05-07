FROM oven/bun:1

# postgresql-client gives us `pg_isready` for the entrypoint's wait loop
RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-client \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Repository contents are pulled from the build context (see docker-compose.yml,
# which uses `context: https://github.com/stravigor/maestro.git#main`).
COPY . .
RUN bun install

EXPOSE 3000

# Inline entrypoint so the image is self-contained — no extra files needed in
# the repo. First boot creates the app + bypass roles via the Postgres
# superuser, then runs `seed --fresh` to migrate and seed in one step. A
# marker file guards against re-running on subsequent starts.
RUN cat > /entrypoint.sh <<'SH'
#!/bin/sh
set -e

echo "[entrypoint] waiting for Postgres at $DB_HOST:$DB_PORT…"
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U postgres >/dev/null 2>&1; do
  sleep 1
done
echo "[entrypoint] Postgres is up"

if [ ! -f /app/.bootstrapped ]; then
  echo "[entrypoint] first boot — creating app + bypass roles"
  bun strav db:setup-roles --apply --superuser postgres
  echo "[entrypoint] running seed --fresh"
  bun strav seed --fresh
  touch /app/.bootstrapped
else
  echo "[entrypoint] already bootstrapped — skipping role/seed setup"
fi

echo "[entrypoint] starting app"
exec bun run start
SH
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
