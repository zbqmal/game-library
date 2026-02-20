# Copilot Agent Instructions

> Read this file at the start of every task. All items listed here are non-negotiable unless explicitly overridden in the task prompt.

---

## 🧠 General Principles

- Prioritize **clean, maintainable, and performant** code. Choose the most efficient and scalable solution while keeping readability high.
- Avoid **unnecessary refactoring** outside the scope of the task. Stay focused.
- Do **not** introduce new dependencies unless clearly justified and discussed.
- Prefer **explicit over implicit** — avoid magic values, unclear abbreviations, or overly clever code.
- Use **TypeScript strictly**: avoid `any`, prefer narrowed types, and leverage type inference where appropriate.

---

## 🧪 Testing

- Add or update tests to **fully cover your changes** when necessary.
- Remove or refactor **outdated tests** if they are no longer valid after your changes.
- Do **not** leave skipped (`it.skip`, `xit`) or commented-out tests without explanation.
- Tests should be meaningful — avoid testing implementation details; prefer testing behavior.
- This project uses **Jest** for unit/integration tests and **Playwright** for e2e tests — use the appropriate tool for the appropriate scope.
- E2e tests should cover **critical user flows** only; do not write e2e tests for logic better covered by unit tests.

---

## 📄 Documentation

- Update `README.md` files **only if the changes meaningfully affect** usage, setup, configuration, or developer experience.
- Avoid unnecessary expansion of documentation — keep it concise and accurate.
- Do **not** add inline comments for self-evident code. Comment only when the *why* is non-obvious.

---

## 🔒 Security

- **Never hardcode secrets**, API keys, tokens, or credentials. Use environment variables (see `.env.example` for reference).
- Validate and sanitize **all external inputs**.
- Follow the **principle of least privilege** — only request/grant the permissions actually needed.
- Be mindful of **information leakage** in error messages — do not expose internals in production.
- Keep dependencies **up to date** and flag any known vulnerabilities when encountered.

---

## ♿ Accessibility

- Ensure interactive elements are **keyboard accessible** and have appropriate focus management.
- Use **semantic HTML** elements (`<button>`, `<nav>`, `<main>`, etc.) instead of generic `<div>` wrappers.
- Provide meaningful `alt` text for images and `aria-label` for icon-only controls.
- Maintain sufficient **color contrast** for text and interactive elements (WCAG AA minimum).

---

## ⚡ Performance

- Avoid **unnecessary re-renders** — use memoization (`useMemo`, `useCallback`, `React.memo`) only where measurable benefit exists.
- Do **not** perform heavy computation or side effects in the render path.
- Prefer **lazy loading** for non-critical routes and large components.
- Optimize images and static assets where possible (use Next.js `<Image>` component).

---

## 🗂️ Code Structure & Conventions

- Follow the **existing file and folder structure** of the project. Do not reorganize without explicit instruction.
- Keep **components small and focused** — a component should do one thing well.
- Place **shared logic** in appropriate utility or hook files (`lib/`) rather than duplicating it.
- Co-locate **tests** with the code they test where the project convention supports it.
- Follow Next.js **App Router** conventions — use Server Components by default, Client Components only when necessary.

---

## 🔁 Scope Discipline

- Stick to the **task at hand**. Do not fix unrelated issues or improve unrelated code unless directly asked.
- If you notice something outside scope that warrants attention, **mention it as a comment** rather than silently changing it.
- Prefer **small, focused commits** — do not bundle unrelated changes.
