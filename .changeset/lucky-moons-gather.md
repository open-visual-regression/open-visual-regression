---
"@ovr/db": patch
---

Stop an idle database connection from crashing the process.

The connection pool had no `error` listener. node-postgres emits `error` on the
pool when a backend or network fault hits an **idle** client, and an `error`
event with no listener becomes an uncaught exception — so the process exited 1
and the container restarted.

Neon's pooler drops idle connections, so the worker hit this whenever it sat
between builds: three restarts over eight days in the dogfood deployment, each
after hours of inactivity, all `Connection terminated unexpectedly` thrown from
`Client.idleListener`. The pool already replaces dead clients on its own; it
just needed the fault logged instead of thrown.

Web was unaffected in practice only because its traffic kept connections from
going idle.
