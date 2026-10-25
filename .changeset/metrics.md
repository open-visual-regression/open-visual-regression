---
"@ovr/web": minor
"@ovr/worker": minor
---

The web app and worker can serve metrics on builds, queues, snapshot captures, and worker health, so Prometheus, Grafana, Datadog, and other monitoring tools can track OVR without parsing its logs. Set `OVR_METRICS_PORT` (Helm: `metrics.enabled`) to turn them on. With the Prometheus Operator, the Helm chart can also create the scrape config, alerting rules, and a Grafana dashboard. See the Metrics page in the self-hosting docs.
