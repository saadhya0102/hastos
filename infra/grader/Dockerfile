# HastOS bundled grader image.
#
# FROM the official Piston engine, plus cloudflared and a small agent that:
#   1. starts the Piston API,
#   2. installs the language packs,
#   3. opens a Cloudflare quick tunnel,
#   4. self-registers with the HastOS worker and heartbeats.
#
# We KEEP Piston's ENTRYPOINT (it performs required root/cgroup/isolate setup and
# then execs the CMD) and only swap the CMD to our agent.
FROM ghcr.io/engineer-man/piston:latest

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates bash \
 && ARCH="$(dpkg --print-architecture)" \
 && curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}" \
      -o /usr/local/bin/cloudflared \
 && chmod +x /usr/local/bin/cloudflared \
 && rm -rf /var/lib/apt/lists/*

COPY agent.sh /usr/local/bin/agent.sh
RUN chmod +x /usr/local/bin/agent.sh

# Piston's ENTRYPOINT runs first (root/cgroup setup) then `exec "$@"` -> our agent.
CMD ["/usr/local/bin/agent.sh"]
