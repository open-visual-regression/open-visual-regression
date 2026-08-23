{{- define "ovr.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Resource name prefix.

Deliberately NOT the conventional "<release>-<chart>" fullname helper. This
chart has always rendered a bare .Release.Name, so switching to the
convention would rename every object in every existing install
(ovr-app-web -> ovr-app-ovr-web). A pruning GitOps controller reads that as
delete-and-recreate, which means downtime and a re-run of the migration
hook. The override hook below is new; the default is unchanged.
*/}}
{{- define "ovr.fullname" -}}
{{- default .Release.Name .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Labels for object metadata only. Safe to extend: none of these reach a
selector, which is immutable after create. Pod templates carry
ovr.selectorLabels alone, deliberately — putting helm.sh/chart on a pod
would roll every workload on a chart version bump that changed nothing.
*/}}
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

{{/*
Selector labels. Callers pass a synthetic dict, so it must carry Values for
ovr.name's nameOverride lookup. Changing what this renders breaks upgrades
of existing installs.
*/}}
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

{{/*
Image reference. Precedence: override > digest > tag > chart appVersion.
appVersion is stamped from the app release at package time, so a published
chart installs a real, immutable version by default rather than a moving
branch tag.
*/}}
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

{{/*
Pod annotations that roll a workload when its configuration changes.
An existingSecret is managed outside the chart, so there is nothing to
checksum for it.
*/}}
{{- define "ovr.configChecksums" -}}
checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
{{- if not .Values.existingSecret }}
checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
{{- end }}
{{- end -}}
