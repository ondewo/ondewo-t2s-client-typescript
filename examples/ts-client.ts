// Copyright 2021-2026 ONDEWO GmbH
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

/**
 * @file Minimal, runnable example for the ONDEWO T2S TypeScript (grpc-web) client.
 *
 * It demonstrates the full D18 flow end-to-end:
 *   1. headless Keycloak login (ROPC + `offline_access`) -> a live, auto-refreshed bearer token
 *      (see `../auth/offlineTokenProvider`),
 *   2. construct the generated grpc-web `Text2SpeechPromiseClient`,
 *   3. call the flagship `synthesize` RPC with an `Authorization: Bearer <token>` metadata header,
 *   4. map the `SynthesizeResponse` to plain data (audio bytes + metadata).
 *
 * The request-building and response-mapping live in {@link synthesizeText}, which takes an injectable
 * client, so it can be unit-tested against a mock with NO network (see `ts-client.spec.ts`). `main`
 * wires the real auth provider + real client and is only executed when this file is run directly.
 *
 * A consumer of the published package imports the same symbols from `@ondewo/t2s-client-typescript`;
 * inside this repo the example imports them via relative paths to the generated stubs.
 *
 * Configuration is read from `examples/environment.env` (loaded via dotenv, resolved relative to this
 * script so the working directory does not matter). Fill that file in, then run it (after `make build`
 * has generated the stubs) with:
 *   node --experimental-strip-types examples/ts-client.ts
 */

import * as path from 'path';

import * as dotenv from 'dotenv';
import * as grpcWeb from 'grpc-web';

import { Text2SpeechPromiseClient } from '../api/ondewo/t2s/text-to-speech_grpc_web_pb';
import { RequestConfig, SynthesizeRequest, SynthesizeResponse } from '../api/ondewo/t2s/text-to-speech_pb';
import { login, OfflineTokenProvider, type OfflineTokenLoginOptions } from '../auth/offlineTokenProvider';

/**
 * The subset of the generated `Text2SpeechPromiseClient` that {@link synthesizeText} needs. Typing the
 * dependency structurally (rather than as the concrete client) lets tests inject a plain mock while the
 * real `Text2SpeechPromiseClient` still satisfies it.
 */
export interface T2sSynthesizeClient {
	/**
	 * Synthesize speech for a single request.
	 *
	 * @param request - The populated {@link SynthesizeRequest}.
	 * @param metadata - Optional gRPC metadata (carries the `Authorization` bearer header).
	 * @returns A promise resolving to the {@link SynthesizeResponse}.
	 */
	synthesize(request: SynthesizeRequest, metadata?: grpcWeb.Metadata): Promise<SynthesizeResponse>;
}

/** The plain-data view of a {@link SynthesizeResponse} returned by {@link synthesizeText}. */
export interface SynthesizedAudio {
	/** Server-assigned identifier of the synthesized audio. */
	audioUuid: string;
	/** Raw audio bytes (decoded from the response's bytes field). */
	audio: Uint8Array;
	/** Length of the synthesized audio in seconds. */
	audioLengthInS: number;
	/** Sample rate of the synthesized audio in Hz. */
	sampleRate: number;
}

/**
 * Build a {@link SynthesizeRequest} for `text` on pipeline `pipelineId`, call the `synthesize` RPC with
 * the bearer `Authorization` metadata, and map the response to plain data.
 *
 * @param client - The (real or mocked) T2S client exposing `synthesize`.
 * @param authorizationHeader - The `Bearer <token>` value from `OfflineTokenProvider.getAuthorizationHeader()`.
 * @param pipelineId - Id of the T2S pipeline to synthesize with.
 * @param text - The text to synthesize.
 * @returns A promise resolving to the {@link SynthesizedAudio} plain-data view of the response.
 */
export async function synthesizeText(
	client: T2sSynthesizeClient,
	authorizationHeader: string,
	pipelineId: string,
	text: string
): Promise<SynthesizedAudio> {
	const config: RequestConfig = new RequestConfig();
	config.setT2sPipelineId(pipelineId);

	const request: SynthesizeRequest = new SynthesizeRequest();
	request.setText(text);
	request.setConfig(config);

	const metadata: grpcWeb.Metadata = { Authorization: authorizationHeader };
	const response: SynthesizeResponse = await client.synthesize(request, metadata);

	return {
		audioUuid: response.getAudioUuid(),
		audio: response.getAudio_asU8(),
		audioLengthInS: response.getAudioLength(),
		sampleRate: response.getSampleRate()
	};
}

/**
 * Read a value from the environment, falling back to `fallback` when unset or empty.
 *
 * @param name - Environment variable name.
 * @param fallback - Value to use when the variable is unset or empty.
 * @returns The environment value, or `fallback`.
 */
function envOr(name: string, fallback: string): string {
	const value: string | undefined = process.env[name];
	return value !== undefined && value.length > 0 ? value : fallback;
}

/**
 * Read a boolean value from the environment. `"true"` (case-insensitive) is `true`; anything else
 * (including unset) falls back to `fallback`.
 *
 * @param name - Environment variable name.
 * @param fallback - Value to use when the variable is unset or empty.
 * @returns The parsed boolean value, or `fallback`.
 */
function envBool(name: string, fallback: boolean): boolean {
	const value: string | undefined = process.env[name];
	if (value === undefined || value.length === 0) {
		return fallback;
	}
	return value.trim().toLowerCase() === 'true';
}

/**
 * Assemble the grpc-web endpoint URL from the canonical connection env vars: it is
 * `<scheme>://ONDEWO_HOST:ONDEWO_PORT`, where `<scheme>` is `https` when `ONDEWO_USE_SECURE_CHANNEL`
 * is `true`, otherwise `http`.
 *
 * @returns The fully-qualified grpc-web host URL.
 */
function buildGrpcWebHost(): string {
	const host: string = envOr('ONDEWO_HOST', 'localhost');
	const port: string = envOr('ONDEWO_PORT', '8080');
	const scheme: string = envBool('ONDEWO_USE_SECURE_CHANNEL', false) ? 'https' : 'http';
	return `${scheme}://${host}:${port}`;
}

/**
 * Entry point: log in headlessly, construct the client, synthesize a line of text and print a summary.
 * Only invoked when this file is run directly; importing it (e.g. from the spec) does NOT run it.
 *
 * @returns A promise that resolves once the synthesis summary has been printed.
 */
export async function main(): Promise<void> {
	// Load examples/environment.env relative to this script so cwd does not matter.
	dotenv.config({ path: path.join(__dirname, 'environment.env') });

	const loginOptions: OfflineTokenLoginOptions = {
		keycloakUrl: envOr('KEYCLOAK_URL', 'https://localhost:8443/auth'),
		realm: envOr('KEYCLOAK_REALM', 'ondewo-ccai-platform'),
		clientId: envOr('KEYCLOAK_CLIENT_ID', 'ondewo-t2s-cai-sdk-public'),
		username: envOr('KEYCLOAK_USER_NAME', ''),
		password: envOr('KEYCLOAK_PASSWORD', ''),
		keycloakVerifySsl: envBool('KEYCLOAK_VERIFY_SSL', true)
	};
	const grpcWebHost: string = buildGrpcWebHost();
	const pipelineId: string = envOr('ONDEWO_T2S_PIPELINE_ID', '');
	const text: string = envOr('ONDEWO_T2S_TEXT', 'Hello from the ONDEWO T2S TypeScript client.');

	console.log(`START: authenticating with Keycloak at ${loginOptions.keycloakUrl} (realm=${loginOptions.realm}).`);
	const tokenProvider: OfflineTokenProvider = await login(loginOptions);
	console.log('DONE: obtained a live access token.');
	try {
		console.log(`START: synthesizing on pipeline "${pipelineId}" via ${grpcWebHost}.`);
		const client: Text2SpeechPromiseClient = new Text2SpeechPromiseClient(grpcWebHost, null, null);
		const audio: SynthesizedAudio = await synthesizeText(
			client,
			tokenProvider.getAuthorizationHeader(),
			pipelineId,
			text
		);
		console.log(
			`DONE: synthesized ${audio.audio.length} bytes of audio ` +
				`(uuid=${audio.audioUuid}, length=${audio.audioLengthInS}s, sampleRate=${audio.sampleRate}Hz).`
		);
	} finally {
		// Stop the background token-refresh loop so the process can exit cleanly.
		tokenProvider.stop();
	}
}

if (require.main === module) {
	main().catch((error: unknown): void => {
		console.error('ERROR: T2S synthesis example failed.', error);
		process.exit(1);
	});
}
