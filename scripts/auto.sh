#!/bin/bash
cd ~/infoishai

case $1 in
    morning)
        claude --print "Morning standup: Review commits, check errors, create today's tasks, save to DAILY_TASKS.md"
        ;;
    fix)
        claude --print "Fix ALL TypeScript, lint, and build errors. Be thorough."
        ;;
    feature)
        claude --print "Complete the '$2' feature fully with error handling and tests."
        ;;
    audit)
        claude --print "Full audit: find all bugs, security issues, incomplete features. Save to AUDIT_REPORT.md"
        ;;
    evening)
        claude --print "Wrap up: commit all changes, update CHANGELOG.md, create tomorrow's priorities."
        ;;
    blog)
        claude --print "Write 1500-word SEO blog post titled '$2' for Infoishai. Save as MDX."
        ;;
    *)
        echo "Commands: morning | fix | feature 'name' | audit | evening | blog 'title'"
        ;;
esac