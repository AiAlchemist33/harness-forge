# Settings Presets by Role

Pick the preset closest to the user's role from Phase 1, then customize based on their specific languages and tools. Merge with any additional permissions they need.

## Web Developer (JavaScript / TypeScript)

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(node *)",
      "Bash(pnpm *)",
      "Bash(yarn *)",
      "Bash(bun *)",
      "Bash(tsc *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)",
      "Bash(npm publish *)"
    ]
  }
}
```

## Python Developer

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(python *)",
      "Bash(python3 *)",
      "Bash(pip *)",
      "Bash(pip3 *)",
      "Bash(pytest *)",
      "Bash(ruff *)",
      "Bash(mypy *)",
      "Bash(uv *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)",
      "Bash(pip install --break-system-packages *)"
    ]
  }
}
```

## Full-Stack Developer

Combine Web + Python presets, plus:
```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(node *)",
      "Bash(python *)",
      "Bash(python3 *)",
      "Bash(pip *)",
      "Bash(pytest *)",
      "Bash(docker ps *)",
      "Bash(docker compose *)",
      "Bash(docker logs *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)"
    ]
  }
}
```

## DevOps / Infrastructure

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(terraform plan *)",
      "Bash(terraform validate *)",
      "Bash(kubectl get *)",
      "Bash(kubectl describe *)",
      "Bash(kubectl logs *)",
      "Bash(docker ps *)",
      "Bash(docker compose *)",
      "Bash(docker logs *)",
      "Bash(aws sts get-caller-identity)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)",
      "Bash(terraform apply *)",
      "Bash(terraform destroy *)",
      "Bash(kubectl delete *)"
    ]
  }
}
```

## Data Scientist / ML Engineer

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(python *)",
      "Bash(python3 *)",
      "Bash(pip *)",
      "Bash(pytest *)",
      "Bash(jupyter *)",
      "Bash(conda *)",
      "Bash(uv *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)"
    ]
  }
}
```

## Student / Beginner

Minimal permissions — ask for everything, deny dangerous commands:
```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)",
      "Bash(sudo *)"
    ]
  }
}
```

## Go Developer

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(go build *)",
      "Bash(go test *)",
      "Bash(go run *)",
      "Bash(go vet *)",
      "Bash(go mod *)",
      "Bash(golangci-lint *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)"
    ]
  }
}
```

## Rust Developer

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(cargo build *)",
      "Bash(cargo test *)",
      "Bash(cargo run *)",
      "Bash(cargo clippy *)",
      "Bash(cargo fmt *)",
      "Bash(rustc *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)"
    ]
  }
}
```

## Customization Guide

After picking a preset, add these based on user's specific tools:

| Tool | Permissions to Add |
|------|--------------------|
| GitHub CLI | `Bash(gh *)` |
| Docker | `Bash(docker *)`, deny `Bash(docker rm -f *)` |
| AWS CLI | `Bash(aws s3 ls *)`, `Bash(aws sts *)`, deny `Bash(aws * --delete *)` |
| Database CLI | `Bash(psql *)`, `Bash(mysql *)` |
| Vercel/Netlify | `Bash(vercel *)`, `Bash(netlify *)` |
| Make | `Bash(make *)` |
