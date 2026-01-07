#!/usr/bin/env bash

# Force using-skills protocol for every response
cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "⚠️ CRITICAL PROTOCOL VIOLATION PREVENTION: You MUST execute Skill('skills:using-skills') before ANY response. No exceptions.\n\nRequired flow:\n1. Receive user input\n2. IMMEDIATELY execute Skill('skills:using-skills')\n3. Wait for skill to complete\n4. Check for matching skills\n5. Use skill if matched\n6. Only then answer user\n\nThis applies to EVERY. SINGLE. MESSAGE. No 'established conversation' exemptions."
  }
}
EOF

exit 0