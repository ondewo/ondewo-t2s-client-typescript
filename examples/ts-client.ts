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
 * Run it (after `make build` has generated the stubs) with the connection env vars set, e.g.:
 *   ONDEWO_T2S_KEYCLOAK_URL=... ONDEWO_T2S_USER_NAME=... ONDEWO_T2S_USER_PASSWORD=... \
 *   ONDEWO_T2S_GRPC_WEB_HOST=https://t2s.example.com ONDEWO_T2S_PIPELINE_ID=<id> \
 *   node --experimental-strip-types examples/ts-client.ts
 */

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

	const metadata: grpcWeb.Metadata = { authorization: authorizationHeader };
	const response: SynthesizeResponse = await client.synthesize(request, metadata);

	return {
		audioUuid: response.getAudioUuid(),
		audio: response.getAudio_asU8(),
		audioLengthInS: response.getAudioLength(),
		sampleRate: response.getSampleRate()
	};
}

/**
 * Read a connection value from the environment, falling back to `fallback` when unset or empty. Kept
 * tiny so the example stays self-contained (a real app would use `dotenv`, already a devDependency).
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
 * Entry point: log in headlessly, construct the client, synthesize a line of text and print a summary.
 * Only invoked when this file is run directly; importing it (e.g. from the spec) does NOT run it.
 *
 * @returns A promise that resolves once the synthesis summary has been printed.
 */
export async function main(): Promise<void> {
	const loginOptions: OfflineTokenLoginOptions = {
		keycloakUrl: envOr('ONDEWO_T2S_KEYCLOAK_URL', 'https://auth.example.com/auth'),
		realm: envOr('ONDEWO_T2S_KEYCLOAK_REALM', 'ondewo-ccai-platform'),
		clientId: envOr('ONDEWO_T2S_KEYCLOAK_CLIENT_ID', 'ondewo-t2s-cai-sdk-public'),
		username: envOr('ONDEWO_T2S_USER_NAME', ''),
		password: envOr('ONDEWO_T2S_USER_PASSWORD', '')
	};
	const grpcWebHost: string = envOr('ONDEWO_T2S_GRPC_WEB_HOST', 'http://localhost:8080');
	const pipelineId: string = envOr('ONDEWO_T2S_PIPELINE_ID', '');
	const text: string = envOr('ONDEWO_T2S_TEXT', 'Hello from the ONDEWO T2S TypeScript client.');

	const tokenProvider: OfflineTokenProvider = await login(loginOptions);
	try {
		const client: Text2SpeechPromiseClient = new Text2SpeechPromiseClient(grpcWebHost, null, null);
		const audio: SynthesizedAudio = await synthesizeText(
			client,
			tokenProvider.getAuthorizationHeader(),
			pipelineId,
			text
		);
		console.log(
			`Synthesized ${audio.audio.length} bytes of audio ` +
				`(uuid=${audio.audioUuid}, length=${audio.audioLengthInS}s, sampleRate=${audio.sampleRate}Hz).`
		);
	} finally {
		// Stop the background token-refresh loop so the process can exit cleanly.
		tokenProvider.stop();
	}
}

if (require.main === module) {
	main().catch((error: unknown): void => {
		console.error(error);
		process.exitCode = 1;
	});
}
