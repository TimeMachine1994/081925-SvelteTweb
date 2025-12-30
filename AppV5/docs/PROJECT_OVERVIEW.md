Expository regarding journey scanner purpose
The Journey Scanner: A Vision for AI-Assisted Codebase Organization
Introduction
The Journey Scanner is a development tool designed to bridge the gap between raw code and human understanding. Rather than treating a codebase as a flat collection of files, this system organizes code by user experience flows—called Journeys—making it easier for developers to navigate, debug, and extend their applications. The tool serves as a living window into your codebase, one that evolves alongside your code and guides you toward what needs attention next.

The Core Concept: Journeys and POTJs
At the heart of the system lies a simple but powerful abstraction. A Journey represents a complete user experience flow through an application, organized around a specific persona such as a Guest, Admin, or Creator. Each Journey is divided into three temporal sections—Beginning, Middle, and End—reflecting the natural progression of a user's interaction with the system.

Within each Journey are Parts of the Journey (POTJs)—discrete, meaningful steps that a user takes. A POTJ might be "Landing Page Discovery," "Sign Up Flow," or "Email Verification." Each POTJ maps to actual code: a file, its dependencies, key behaviors, and contextual notes. This creates a two-way relationship between abstract user experience and concrete implementation.

The Workflow: Scan, View, Edit, Reconcile
The system operates through a cyclical workflow designed to keep documentation in sync with reality.

Initial Scan: When you first launch the application or point it at a new codebase, the scanner analyzes your project structure. Using AI (powered by Gemini), it examines your files, identifies user flows, and automatically generates Journey markdown files. These files are saved to disk in a /journeys/ folder, making them version-controllable alongside your code. This is a one-time heavy operation—not something that runs on every keystroke.

Dashboard View: Once Journeys are generated, they appear in a four-column dashboard. The first column shows Journey navigation, allowing you to switch between different Journeys. The second column displays the Journey's POTJs in a visual flow, organized by Beginning, Middle, and End sections. The third column—the Profile View—shows detailed information about a selected POTJ: its description, key behaviors, code references, dependencies, tags, notes, and an AI chat interface for asking questions. The fourth column is the Code Viewer, displaying the actual source code of any selected file.

Manual Editing: Journeys are not meant to be perfect on first generation. You will review them, spot inaccuracies, and make corrections. Perhaps the AI misclassified a file, or a description doesn't capture the nuance of what the code does. You can edit the Journey markdown files directly, or you can edit the source code itself in your IDE. The system is designed to support this iterative refinement.

Live Watching and Reconciliation: Here is where the system becomes truly useful for ongoing development. After the initial scan, a background watcher monitors the files referenced in your Journeys. When you edit a file in your IDE, the system detects this change. Rather than automatically regenerating everything—which would be slow and potentially destructive—it simply flags the affected POTJ in the UI. A badge appears: "Code changed since journey was generated." You can then choose to reconcile that specific POTJ, triggering a targeted re-scan that updates only the relevant portion of the Journey.

If a referenced file is deleted entirely, the system flags this differently: "File not found." This alerts you that the Journey has become stale in a more serious way. You must either create a replacement file or edit the Journey to remove or update the reference.

The Profile View: Your Debugging Companion
The Profile View is more than just a documentation panel. It aggregates everything relevant to a single piece of your codebase. You see the POTJ's description, which explains what this code does in human terms. You see its key behaviors—the specific actions it performs. You see its dependencies, which are clickable links that load those files into the Code Viewer. You see tags for quick categorization and notes for context that doesn't fit elsewhere.

Most importantly, you have access to an AI chat interface scoped to that specific POTJ. You can ask questions like "Why does this component re-render?" or "What happens if the user isn't authenticated?" The AI has context about the file, its metadata, and its role in the Journey, allowing it to give more relevant answers than a generic coding assistant.

Over time, as you accumulate notes and chat history for each POTJ, the Profile View becomes a repository of institutional knowledge. When you return to unfamiliar code months later, the context is preserved.

The Guiding Principle: Journeys as Snapshots
It is important to understand that Journeys are snapshots, not live mirrors. They represent your codebase at a moment in time, annotated with human understanding. Code will drift from these snapshots as development continues. The system's job is not to prevent this drift but to surface it—to show you where reality has diverged from documentation, so you can decide how to reconcile them.

This design acknowledges a fundamental truth about software development: documentation that tries to stay perfectly in sync with code usually fails, because it creates too much friction. By treating Journeys as intentional snapshots with explicit reconciliation points, the system remains useful without becoming a burden.

Conclusion
The Journey Scanner transforms a codebase from an opaque collection of files into a navigable map of user experiences. It automates the initial work of generating this map through AI-powered scanning, then supports ongoing maintenance through live file watching and targeted reconciliation. The Profile View serves as a debugging companion, aggregating context and providing AI assistance scoped to specific pieces of code. Together, these features create a tool that helps developers understand not just what their code does, but why it exists and how it fits into the larger picture of user experience.

The goal is simple: when you sit down to work on your codebase, the Journey Scanner should help you figure out what to do next.
