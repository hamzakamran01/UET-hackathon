# ADR: Admin AI Assistant for DQMS

## Context

Admin and queue managers need a faster way to understand the current state
of queues and perform common operations (view stats, cancel or complete
tokens) using natural language, without bypassing existing security and
business rules.

## Decision

- Implement an `AiModule` inside the existing NestJS backend.
- Use **Google Gemini** via the Generative Language HTTP API, configured through
  `GEMINI_API_KEY` and `GEMINI_MODEL_NAME` (default `gemini-2.5-pro`).
- Keep all domain logic in existing modules (`services`, `tokens`, `admin`);
  the AI layer only orchestrates and calls these modules.
- Expose a single admin-protected endpoint `POST /api/ai/chat` and surface
  it through an embedded assistant panel in the Next.js admin UI.

## Consequences

- No separate Python/OpenAI Agents service to operate; deployment remains
  a single backend plus the existing frontend.
- The AI can only perform whitelisted operations (queue overview, service
  stats, admin cancel/complete token) and cannot access raw database or
  secrets directly.
- Future expansion to a full agents SDK or additional tools is possible
  by extending the `AiToolsService` and intent types without changing
  callers.

