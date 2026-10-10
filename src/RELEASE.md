# Release History

*****************

## Release ONDEWO T2S Typescript Client 6.6.2

### New Features

* [[OND211-2443]](https://ondewo.atlassian.net/browse/OND211-2443) `createGrpcWebEndpoint({ host, port, useSecureChannel, withCredentials })`
  (`auth/grpcWebEndpoint`, re-exported from `auth/offlineTokenProvider` and the package entry point) builds the
  `hostname` URL and the client options a generated `*Client` / `*PromiseClient` takes. `https://` is the default;
  `useSecureChannel: false` builds `http://` and logs a warning naming `host:port`; a bare IPv6 host is bracketed;
  `host`, `port` and both flags are validated (`'false'` is refused, not read as `true`).
* TLS in a browser is the browser's TLS: the server certificate is checked against the browser / OS trust store and a
  client certificate (mutual TLS) comes from the browser's certificate store. A config carrying a non-empty
  `grpcCert` / `grpcClientCert` / `grpcClientKey` (or `grpc_cert` / `grpc_client_cert` / `grpc_client_key`) is
  therefore refused with an error naming the field, never the value; empty values are ignored. `withCredentials: true`
  lets a cross-origin call present the browser's client certificate. No error message renders a refused value.
* README section "TLS, mutual TLS and certificates": modes, the Envoy side of mutual TLS, a test PKI with openssl,
  security notes and troubleshooting. Documented gap: the generated clients need `XMLHttpRequest`, so gRPC calls run
  in browsers only; in Node.js only the Keycloak `login` helper is usable and there is no Node.js path for a custom CA
  or client certificate.

### Bug Fixes

* [[OND211-2443]](https://ondewo.atlassian.net/browse/OND211-2443) `OfflineTokenProvider` no longer leaks its tokens
  when logged: `JSON.stringify`, `console.log` and `util.inspect` of a provider (also nested in another object) render
  the access and refresh tokens as `***REDACTED***`. `getAuthorizationHeader()` is unchanged.
* The npm package now ships the hand-written `auth/` module: the Keycloak `login` helper / `OfflineTokenProvider`
  (`auth/offlineTokenProvider`) and `auth/grpcWebEndpoint`, re-exported from the package entry point. Up to 6.6.1
  `create_npm_package` never compiled `auth/`, so the Keycloak helper was not published.
* `login` rejects a blank offline `refresh_token` (it used to accept `""`, so every renewal failed minutes later
  instead of the login failing). The insecure undici agent options used for `keycloakVerifySsl: false` are the
  exported `INSECURE_AGENT_OPTIONS` constant and pinned by a test.
* `google-protobuf` is pinned to `4.0.2` (was exactly `3.21.4`). The generated code, regenerated with
  [ondewo-proto-compiler 5.15.2](https://github.com/ondewo/ondewo-proto-compiler/releases/tag/5.15.2),
  calls `reader.readStringRequireUtf8()` and `jspb.internal.public_for_gencode.serializeMapToBinary()`,
  which 3.21.4 does not have: with the old pin every `deserializeBinary` of a message carrying a string would throw
  `TypeError: reader.readStringRequireUtf8 is not a function` (the defect nlu-client-typescript 7.1.0-7.1.2 and
  csi-client-typescript 5.5.0-5.5.2 shipped). No released version of this package was affected. The regenerated
  `api/` is committed with this release.
* Guard: `tests/bundleStringRoundTrip.spec.ts` round-trips a string with multi-byte characters through the generated
  code; against google-protobuf 3.21.4 it reports 0 passed, 2 failed with that exact TypeError.

### Improvements

* Tests: the endpoint helper's edge cases, including calls through the real grpc-web runtime with a recording
  `XMLHttpRequest`, and the token redaction. `tests/releaseNotes.spec.ts` pins the RELEASE.md heading spelling the
  Makefile slices, a `*****` separator ending every section, and non-empty notes for the version being released.
* RELEASE.md: every section now ends at its separator and the 1.4.0 notes are restored.
* The release gates the npm tarball (`verify_npm_package_contents`: no spec, raw `.ts`, map or examples file; the
  `auth/` files present), tolerates an empty "Preparing for Release" commit, and the 100% coverage gate covers every
  hand-written file under `auth/` and `examples/` instead of one allow-listed file. `.husky/pre-push` runs `npm test`;
  `test:drift` keeps package.json and .ci-package.json in step.
* Tracking API Version [6.6.0](https://github.com/ondewo/ondewo-t2s-api/releases/tag/6.6.0) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )

*****************

## Release ONDEWO T2S Typescript Client 6.6.1

### Bug Fixes

* [[OND221-2830]](https://ondewo.atlassian.net/browse/OND221-2830) Regenerated with [ondewo-proto-compiler 5.13.0](https://github.com/ondewo/ondewo-proto-compiler/releases/tag/5.13.0).
* [[OND221-2830]](https://ondewo.atlassian.net/browse/OND221-2830) The hand-written `auth/` surface is now re-exported from the generated public-api barrel. It was compiled and shipped inside the package but nothing re-exported it, so importing a symbol from the package root did not resolve and consumers could only deep-import the module. The re-export is emitted by the compiler, so it survives the regeneration that rewrites the barrel on every build.
* [[OND221-2830]](https://ondewo.atlassian.net/browse/OND221-2830) Tooling: `conventional-pre-commit` now runs before `giticket` at the commit-msg stage - with giticket first, its `[OND221-2830] fix: ...` rewrite was no longer valid Conventional Commits and every commit on a ticket branch failed. `README.md` is prettier-ignored where `.prettierrc` sets `useTabs` and markdownlint's MD010 de-tabs the same blocks, and the codegen `docker run` invocations no longer pass `-it`, which fails outside a TTY.

*****************
## Release ONDEWO T2S Typescript Client 6.6.0

### Improvements
 * Tracking API Version [6.6.0](https://github.com/ondewo/ondewo-t2s-api/releases/tag/6.6.0) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 6.5.0

### Improvements
 * Tracking API Version [6.5.0](https://github.com/ondewo/ondewo-t2s-api/releases/tag/6.5.0) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 6.4.2

### Improvements
 * Tracking API Version [6.4.2](https://github.com/ondewo/ondewo-t2s-api/releases/tag/6.4.2) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 6.4.1

### Improvements
 * Tracking API Version [6.4.1](https://github.com/ondewo/ondewo-t2s-api/releases/tag/6.4.1) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 6.4.0

### Improvements
 * Tracking API Version [6.4.0](https://github.com/ondewo/ondewo-t2s-api/releases/tag/6.4.0) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 6.2.0

### Improvements
 * Tracking API Version [6.2.0](https://github.com/ondewo/ondewo-t2s-api/releases/tag/6.2.0) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 6.1.0

### Improvements
 * Tracking API Version [6.1.0](https://github.com/ondewo/ondewo-t2s-api/releases/tag/6.1.0) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 6.0.0

### Improvements
 * Tracking API Version [6.0.0](https://github.com/ondewo/ondewo-t2s-api/releases/tag/6.0.0) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 5.4.0

### Improvements
 * Tracking API Version [5.4.0](https://github.com/ondewo/ondewo-t2s-api/releases/tag/5.4.0) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 5.3.0

### Improvements
 * Tracking API Version [5.3.0](https://github.com/ondewo/ondewo-t2s-api/releases/tag/5.3.0) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 5.2.0

### Improvements
 * Tracking API Version [5.2.0](https://github.com/ondewo/ondewo-t2s-api/releases/tag/5.2.0) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 5.0.0

### Improvements
 * Tracking API Version [5.0.0](https://github.com/ondewo/ondewo-t2s-api/releases/tag/5.0.0) ( [Documentation](https://ondewo.github.io/ondewo-t2s-api/) )


*****************
## Release ONDEWO T2S Typescript Client 4.3.0

### Improvements
 * Update to T2S client version tag 4.3.0
 * [[OND211-2039]](https://ondewo.atlassian.net/browse/OND211-2039) - Implemented automated release for GitHub and NPM
 * [[OND211-2039]](https://ondewo.atlassian.net/browse/OND211-2039) - Added pre-commit hooks and adjusted files to them

*****************

## Release ONDEWO T2S Typescript Client 1.4.0

### New Features
 * Added first public release
 * Javascript and Typescript clients
 * Uses version 1.4.0 from <a href="https://github.com/ondewo/ondewo-t2s-api">ONDEWO T2S APIs</a>

*****************
