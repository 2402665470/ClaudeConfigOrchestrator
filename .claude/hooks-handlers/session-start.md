{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "⚠️ MANDATORY PROTOCOL: Before responding to ANY user message, you MUST execute Skill('skills:using-skills') first. This is not optional. \n\nSteps to follow for EVERY response:\n1. User sends message\n2. IMMEDIATELY execute Skill('skills:using-skills')\n3. Check for matching skills\n4. Use skill if found, or declare no match\n5. Only then process the user's actual request\n\nThere are no exceptions. There is no 'established conversation' exemption. Every single message triggers this protocol.\n\nYou must demonstrate this execution in your response by showing: [PROTOCOL] Executing using-skills..."
  }
}