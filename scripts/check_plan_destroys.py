#!/usr/bin/env python3
"""Summarise destructive changes in a Terraform plan.

Usage:
    terraform show -json tfplan > plan.json
    python3 scripts/check_plan_destroys.py plan.json

The script never fails the build. It prints a GitHub Actions annotation when
resources would be destroyed and, when ``GITHUB_STEP_SUMMARY`` is set, appends
a Markdown report to the job summary.
"""

from __future__ import annotations

import json
import os
import sys

SUMMARY_TITLE = "Terraform plan — destructive change guard"


def collect_destroys(plan: dict) -> list[tuple[str, str]]:
    """Return ``(address, actions)`` for every resource that would be deleted."""
    destroys: list[tuple[str, str]] = []

    for change in plan.get("resource_changes", []):
        actions = change.get("change", {}).get("actions", [])
        if "delete" in actions:
            destroys.append(
                (change.get("address", "unknown"), " → ".join(actions))
            )

    return destroys


def build_summary(destroys: list[tuple[str, str]]) -> str:
    lines = [f"### {SUMMARY_TITLE}", ""]

    if not destroys:
        lines.append("No resources would be destroyed by this plan.")
        return "\n".join(lines) + "\n"

    lines.append(f"**{len(destroys)} resource(s) would be destroyed.** Review before applying.")
    lines.append("")
    lines.append("| Resource | Actions |")
    lines.append("| --- | --- |")
    for address, actions in destroys:
        lines.append(f"| `{address}` | `{actions}` |")
    lines.append("")
    lines.append("`terraform apply` is deliberately a human decision in this repository.")

    return "\n".join(lines) + "\n"


def main(argv: list[str]) -> int:
    plan_path = argv[1] if len(argv) > 1 else "plan.json"

    try:
        with open(plan_path, encoding="utf-8") as handle:
            plan = json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        print(f"::warning::Could not read Terraform plan JSON ({plan_path}): {error}")
        return 0

    destroys = collect_destroys(plan)
    summary = build_summary(destroys)

    if destroys:
        print(
            f"::warning::{len(destroys)} resource(s) would be destroyed — "
            "review the plan before applying."
        )
    else:
        print("No resources would be destroyed by this plan.")

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as handle:
            handle.write(summary)
    else:
        print()
        print(summary)

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
