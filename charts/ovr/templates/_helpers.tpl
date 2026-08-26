{{- define "ovr.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Bare .Release.Name, not <release>-<chart> -- changing it renames every existing install's objects. */}}
{{- define "ovr.fullname" -}}
{{- default .Release.Name .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Metadata only, never a selector (immutable after create) -- ovr.selectorLabels is separate for that reason. */}}
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

{{/* Callers pass a synthetic dict; must carry Values for ovr.name's nameOverride lookup. */}}
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

{{/* Precedence: override > digest > tag > chart appVersion. */}}
{{- define "ovr.image" -}}
{{- if .override -}}
{{ .override }}
{{- else -}}
{{- $digest := .digest | default .Values.image.digest -}}
{{- $tag := .tag | default .Values.image.tag | default .Chart.AppVersion | required "no image tag: set image.tag, or use a chart with appVersion set" -}}
{{- if $digest -}}
{{ .Values.image.registry }}/{{ .name }}@{{ $digest }}
{{- else -}}
{{ .Values.image.registry }}/{{ .name }}:{{ $tag }}
{{- end -}}
{{- end -}}
{{- end -}}

{{/* Rolls a workload on config/secret change. No secret checksum when existingSecret is set -- it's not ours to hash. */}}
{{- define "ovr.configChecksums" -}}
checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
{{- if not .Values.existingSecret }}
checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
{{- end }}
{{- end -}}

{{- define "ovr.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{ default (include "ovr.fullname" .) .Values.serviceAccount.name }}
{{- else -}}
{{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}
