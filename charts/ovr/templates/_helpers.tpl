{{- define "ovr.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "ovr.fullname" -}}
{{- .Release.Name -}}
{{- end -}}

{{- define "ovr.labels" -}}
app.kubernetes.io/name: {{ include "ovr.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
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
{{- $digest := .digest | default .Values.image.digest -}}
{{- $tag := .tag | default .Values.image.tag -}}
{{- if $digest -}}
{{ .Values.image.registry }}/{{ .name }}@{{ $digest }}
{{- else -}}
{{ .Values.image.registry }}/{{ .name }}:{{ $tag }}
{{- end -}}
{{- end -}}
{{- end -}}
