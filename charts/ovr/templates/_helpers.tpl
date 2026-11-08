{{- define "ovr.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "ovr.fullname" -}}
{{- default .Release.Name .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "ovr.labels" -}}
app.kubernetes.io/name: {{ include "ovr.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: ovr
{{- with .Chart.AppVersion }}
app.kubernetes.io/version: {{ . | quote }}
{{- end }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{- end -}}

{{- define "ovr.selectorLabels" -}}
app.kubernetes.io/name: {{ include "ovr.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{- define "ovr.secretName" -}}
{{- if .Values.existingSecret -}}
{{ .Values.existingSecret }}
{{- else -}}
{{ include "ovr.fullname" . }}-secret
{{- end -}}
{{- end -}}

{{- define "ovr.image" -}}
{{- if .override -}}
{{ .override }}
{{- else -}}
{{- $digest := .digest -}}
{{- $tag := .tag | default .Values.image.tag | default .Chart.AppVersion | required "no image tag: set image.tag, or use a chart with appVersion set" -}}
{{- if $digest -}}
{{ .Values.image.registry }}/{{ .name }}@{{ $digest }}
{{- else -}}
{{ .Values.image.registry }}/{{ .name }}:{{ $tag }}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "ovr.migrateJobName" -}}
{{- $base := printf "%s-migrate" (include "ovr.fullname" .) -}}
{{- with .Chart.AppVersion -}}
{{- printf "%s-%s" $base (. | lower | replace "+" "-") | trunc 63 | trimSuffix "-" | trimSuffix "." -}}
{{- else -}}
{{- $base -}}
{{- end -}}
{{- end -}}

{{- define "ovr.configChecksums" -}}
checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
{{- if not .Values.existingSecret }}
checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
{{- end }}
{{- if .Values.githubApp.privateKey }}
checksum/github-app-secret: {{ include (print $.Template.BasePath "/secret-github-app.yaml") . | sha256sum }}
{{- end }}
{{- end -}}

{{/* "true" when a GitHub App is configured. Fails on a half-configured one. */}}
{{- define "ovr.githubAppEnabled" -}}
{{- with .Values.githubApp -}}
{{- if or .appId .privateKey .existingSecret -}}
{{- if not .appId -}}
{{- fail "githubApp.appId is required when githubApp.privateKey or githubApp.existingSecret is set" -}}
{{- end -}}
{{- if and .privateKey .existingSecret -}}
{{- fail "set githubApp.privateKey or githubApp.existingSecret, not both" -}}
{{- end -}}
{{- if not (or .privateKey .existingSecret) -}}
{{- fail "githubApp.privateKey or githubApp.existingSecret is required when githubApp.appId is set" -}}
{{- end -}}
true
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "ovr.githubAppSecretName" -}}
{{- if .Values.githubApp.existingSecret -}}
{{ .Values.githubApp.existingSecret }}
{{- else -}}
{{ include "ovr.fullname" . }}-github-app
{{- end -}}
{{- end -}}

{{/* Mounted as a file rather than envFrom'd, so the key never sits in the environment. */}}
{{- define "ovr.githubAppEnv" -}}
- name: OVR_GITHUB_APP_PRIVATE_KEY_FILE
  value: /etc/ovr/github-app/private-key.pem
{{- end -}}

{{- define "ovr.githubAppVolumeMount" -}}
- name: github-app
  mountPath: /etc/ovr/github-app
  readOnly: true
{{- end -}}

{{- define "ovr.githubAppVolume" -}}
- name: github-app
  secret:
    secretName: {{ include "ovr.githubAppSecretName" . }}
    items:
      - key: {{ .Values.githubApp.existingSecretKey }}
        path: private-key.pem
{{- end -}}

{{- define "ovr.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{ default (include "ovr.fullname" .) .Values.serviceAccount.name }}
{{- else -}}
{{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/* KEDA's generated trigger only counts the wait list, which deadline and round-robin groups never enter. */}}
{{- define "ovr.captureQueuePolicy" -}}
{{- $policy := .Values.worker.captureQueuePolicy -}}
{{- $generatedTrigger := and .Values.worker.enabled .Values.worker.keda.enabled (not .Values.worker.keda.triggers) -}}
{{- if and $generatedTrigger (has $policy (list "deadline" "round-robin")) -}}
{{- fail (printf "worker.captureQueuePolicy %s keeps queued capture groups out of the list worker.keda's generated trigger watches. Use fifo, or set worker.keda.triggers." $policy) -}}
{{- end -}}
{{- if and $generatedTrigger (not $policy) -}}
fifo
{{- else -}}
{{- $policy -}}
{{- end -}}
{{- end -}}

{{- define "ovr.metricsEnv" -}}
- name: OVR_METRICS_PORT
  value: {{ .Values.metrics.port | quote }}
{{- end -}}

{{- define "ovr.metricsPort" -}}
- name: metrics
  containerPort: {{ .Values.metrics.port }}
{{- end -}}

{{/* Read by scrapers that discover pods by annotation. */}}
{{- define "ovr.metricsAnnotations" -}}
prometheus.io/scrape: "true"
prometheus.io/port: {{ .Values.metrics.port | quote }}
prometheus.io/path: /metrics
{{- end -}}
