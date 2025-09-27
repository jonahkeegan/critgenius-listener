# Development Proxy Routes

This file is generated from the centralized proxy registry. Do not edit manually.

## Environment Keys

- DEV_PROXY_ALLOWED_HOSTS
- DEV_PROXY_ASSEMBLYAI_ENABLED
- DEV_PROXY_ASSEMBLYAI_PATH
- DEV_PROXY_AUTO_DISCOVER
- DEV_PROXY_DISCOVERY_PORTS
- DEV_PROXY_DISCOVERY_TIMEOUT_MS
- DEV_PROXY_ENABLED
- DEV_PROXY_HTTPS_ENABLED
- DEV_PROXY_PROBE_TIMEOUT_MS
- DEV_PROXY_REJECT_UNAUTHORIZED
- DEV_PROXY_TARGET_HTTPS_PORT
- DEV_PROXY_TARGET_PORT
- DEV_PROXY_TIMEOUT_MS

## Routes

| id         | path              | ws  | optional | enableEnvVar                 |
| ---------- | ----------------- | --- | -------- | ---------------------------- |
| api        | /api              | no  | no       |                              |
| assemblyai | /proxy/assemblyai | no  | yes      | DEV_PROXY_ASSEMBLYAI_ENABLED |
| ws         | /socket.io        | yes | no       |                              |
