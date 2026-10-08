# Security

harness-forge writes into your Claude Code configuration. Every write is
journaled and backed up first; `/harness-forge:reset` restores the previous
state. Third-party skills are installed at pinned commits and are read by a
vetting agent before you are asked to approve them. Nothing is sent anywhere
except the Claude API calls your own session makes.

Report a vulnerability by opening a GitHub issue with the "security" label, or
privately to the maintainer listed in `package.json` once the repo is public.
