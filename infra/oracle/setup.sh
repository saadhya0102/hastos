#!/usr/bin/env bash
# Bootstrap an Oracle Cloud "Always Free" ARM (Ampere A1) Ubuntu 22.04 box to run Judge0
# for HastOS. Run as a sudo-capable user:  bash setup.sh
#
# What it does:
#   1. Installs Docker Engine + compose plugin
#   2. Switches the kernel to cgroup v1 (Judge0's isolate sandbox requires it)  -> needs reboot
#   3. Opens host firewall for the Judge0 port (2358)
# After it reboots, re-run with `--run` to start Judge0.
#
# You STILL must add an ingress rule for TCP 2358 in the OCI Console
# (Networking -> VCN -> Security List), restricted to your Cloudflare Worker if possible.

set -euo pipefail

JUDGE0_PORT=2358

install_docker() {
  echo "==> Installing Docker..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl git
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
}

enable_cgroup_v1() {
  echo "==> Enabling cgroup v1 (required by Judge0 isolate)..."
  if grep -q "systemd.unified_cgroup_hierarchy=0" /etc/default/grub 2>/dev/null; then
    echo "    already set."
  else
    sudo sed -i 's/^GRUB_CMDLINE_LINUX="\(.*\)"/GRUB_CMDLINE_LINUX="\1 systemd.unified_cgroup_hierarchy=0 cgroup_enable=memory swapaccount=1"/' /etc/default/grub
    sudo update-grub || sudo grub2-mkconfig -o /boot/grub2/grub.cfg || true
    echo "    cgroup v1 configured; a REBOOT is required."
  fi
}

open_firewall() {
  echo "==> Opening host firewall for port ${JUDGE0_PORT}..."
  sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport "${JUDGE0_PORT}" -j ACCEPT || true
  sudo netfilter-persistent save 2>/dev/null || \
    (sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save) || true
}

run_judge0() {
  echo "==> Starting Judge0 (arm64)..."
  cd "$(dirname "$0")/../judge0"
  if [ ! -f judge0.conf ]; then
    cp ../oracle/judge0.conf.example judge0.conf
    echo "!! Created judge0.conf from the example. EDIT IT (set passwords + AUTHN_TOKEN) and re-run with --run."
    exit 1
  fi
  docker compose -f docker-compose.arm64.yml up -d
  echo "==> Waiting for Judge0 to come up..."
  sleep 15
  curl -s "http://localhost:${JUDGE0_PORT}/languages" | head -c 400 || true
  echo
  echo "==> If you see a JSON list of languages above, Judge0 is running."
  echo "    Verify the C language id and reconcile packages/shared/languages.ts + the Worker if needed."
}

if [ "${1:-}" = "--run" ]; then
  run_judge0
else
  install_docker
  enable_cgroup_v1
  open_firewall
  echo
  echo "============================================================"
  echo "Base setup complete. Now:"
  echo "  1) sudo reboot        (to apply cgroup v1)"
  echo "  2) edit infra/judge0/judge0.conf (copy from example)"
  echo "  3) bash setup.sh --run"
  echo "  4) In OCI Console, add an ingress rule for TCP ${JUDGE0_PORT}"
  echo "============================================================"
fi
