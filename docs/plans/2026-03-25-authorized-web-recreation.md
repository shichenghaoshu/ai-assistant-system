# Authorized Web Recreation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a reusable skill that recreates websites or web apps the user owns or is explicitly authorized to access, producing a high-fidelity React + Vite frontend replica.

**Architecture:** Initialize a new skill under `~/.codex/skills`, write a concise workflow-focused `SKILL.md`, add only the reusable references and scripts that reduce repeated work, then validate the finished skill with the bundled validator.

**Tech Stack:** Markdown, YAML, Bash, Python validation script, React + Vite bootstrap commands.

---

### Task 1: Initialize the skill skeleton

**Files:**
- Create: `~/.codex/skills/authorized-web-recreation/`
- Create: `~/.codex/skills/authorized-web-recreation/SKILL.md`
- Create: `~/.codex/skills/authorized-web-recreation/agents/openai.yaml`

**Step 1: Run the initializer**

Run:

```bash
python /Users/admin/.codex/skills/.system/skill-creator/scripts/init_skill.py \
  authorized-web-recreation \
  --path ~/.codex/skills \
  --resources scripts,references \
  --interface 'display_name=Authorized Web Recreation' \
  --interface 'short_description=Recreate an authorized website' \
  --interface 'default_prompt=Use $authorized-web-recreation to audit an authorized website and build a React + Vite recreation with matched routes, styling, and frontend interactions.'
```

Expected: The skill directory, `SKILL.md`, `agents/openai.yaml`, `scripts/`, and `references/` are created.

### Task 2: Replace template content with the real workflow

**Files:**
- Modify: `~/.codex/skills/authorized-web-recreation/SKILL.md`

**Step 1: Write the final frontmatter and workflow**

Replace the template with instructions that:
- restrict use to owned or explicitly authorized sites,
- require React + Vite output by default,
- define credential handling and refusal boundaries,
- define capture, recreation, and verification steps,
- point to bundled references and scripts.

Expected: `SKILL.md` has no template TODOs.

### Task 3: Add reusable support files

**Files:**
- Create: `~/.codex/skills/authorized-web-recreation/references/reconstruction-checklist.md`
- Create: `~/.codex/skills/authorized-web-recreation/references/credential-handling.md`
- Create: `~/.codex/skills/authorized-web-recreation/scripts/bootstrap_react_vite.sh`

**Step 1: Add the references**

Write concise references for:
- route and state coverage,
- visual and interaction parity checks,
- safe credential storage choices.

**Step 2: Add the bootstrap script**

Create a small shell script that scaffolds a React + Vite app and installs dependencies.

Expected: The skill has only the support files it directly uses.

### Task 4: Validate the finished skill

**Files:**
- Test: `~/.codex/skills/authorized-web-recreation/`

**Step 1: Run the validator**

Run:

```bash
python /Users/admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  ~/.codex/skills/authorized-web-recreation
```

Expected: `Skill is valid!`

**Step 2: Perform a manual sanity check**

Verify:
- the description starts with `Use when`,
- the skill name is hyphen-case,
- no placeholders remain,
- the guidance never instructs bypassing access controls,
- the references are linked from `SKILL.md`.
