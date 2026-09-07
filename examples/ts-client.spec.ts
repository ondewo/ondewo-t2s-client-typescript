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
 * @file Unit tests proving the T2S example works WITHOUT a live server. The gRPC client is a plain
 * in-memory mock (no network); the test exercises real protobuf request/response objects to assert the
 * example builds the right `SynthesizeRequest`, sends the bearer metadata, and maps the response.
 */

import { test as runTestCase } from 'node:test';
import assert from 'node:assert/strict';

import * as grpcWeb from 'grpc-web';

import {
	buildGrpcWebHost,
	envBool,
	envOr,
	main,
	synthesizeText,
	type SynthesizedAudio,
	type T2sSynthesizeClient
} from './ts-client';
import { SynthesizeRequest, SynthesizeResponse } from '../api/ondewo/t2s/text-to-speech_pb';
import { Text2SpeechPromiseClient } from '../api/ondewo/t2s/text-to-speech_grpc_web_pb';
import * as offlineTokenProviderModule from '../auth/offlineTokenProvider';
import type { OfflineTokenLoginOptions, OfflineTokenProvider } from '../auth/offlineTokenProvider';

/** One `synthesize` call captured by the mock, with the request and metadata it received. */
interface RecordedSynthesizeCall {
	/** The request the example built and passed to the client. */
	request: SynthesizeRequest;
	/** The gRPC metadata the example attached (carries the `Authorization` bearer header). */
	metadata: grpcWeb.Metadata | undefined;
}

/** A mock T2S client plus the list of calls it has recorded. */
interface SynthesizeClientStub {
	/** The injectable client to pass to {@link synthesizeText}. */
	client: T2sSynthesizeClient;
	/** The `synthesize` calls recorded so far, in order. */
	calls: RecordedSynthesizeCall[];
}

/**
 * Build a mock {@link T2sSynthesizeClient} that records each `synthesize` call and returns `response`.
 *
 * @param response - The canned {@link SynthesizeResponse} every call resolves to.
 * @returns A {@link SynthesizeClientStub} pairing the mock client with its recorded calls.
 */
function makeSynthesizeClientStub(response: SynthesizeResponse): SynthesizeClientStub {
	const calls: RecordedSynthesizeCall[] = [];
	const client: T2sSynthesizeClient = {
		synthesize(request: SynthesizeRequest, metadata?: grpcWeb.Metadata): Promise<SynthesizeResponse> {
			calls.push({ request, metadata });
			return Promise.resolve(response);
		}
	};
	return { client, calls };
}

runTestCase('synthesizeText sends the text + pipeline id and the bearer authorization metadata', async () => {
	const expectedAudio: Uint8Array = new Uint8Array([1, 2, 3, 4]);
	const cannedResponse: SynthesizeResponse = new SynthesizeResponse();
	cannedResponse.setAudioUuid('audio-uuid-1');
	cannedResponse.setAudio(expectedAudio);
	cannedResponse.setAudioLength(1.5);
	cannedResponse.setSampleRate(22050);

	const stub: SynthesizeClientStub = makeSynthesizeClientStub(cannedResponse);

	const audio: SynthesizedAudio = await synthesizeText(stub.client, 'Bearer access-1', 'pipeline-42', 'Hello world');

	// The example issued exactly one RPC with the expected request payload.
	assert.equal(stub.calls.length, 1);
	const sentRequest: SynthesizeRequest = stub.calls[0].request;
	assert.equal(sentRequest.getText(), 'Hello world');
	assert.equal(sentRequest.getConfig()?.getT2sPipelineId(), 'pipeline-42');

	// The bearer token is forwarded verbatim as the `authorization` gRPC metadata header.
	assert.deepEqual(stub.calls[0].metadata, { Authorization: 'Bearer access-1' });

	// The response is mapped to the plain-data view.
	assert.equal(audio.audioUuid, 'audio-uuid-1');
	assert.deepEqual(audio.audio, expectedAudio);
	assert.equal(audio.audioLengthInS, 1.5);
	assert.equal(audio.sampleRate, 22050);
});

runTestCase('synthesizeText maps an empty synthesize response to zero-length audio', async () => {
	const emptyResponse: SynthesizeResponse = new SynthesizeResponse();
	const stub: SynthesizeClientStub = makeSynthesizeClientStub(emptyResponse);

	const audio: SynthesizedAudio = await synthesizeText(stub.client, 'Bearer t', 'pipeline-1', '');

	assert.equal(audio.audio.length, 0);
	assert.equal(audio.audioUuid, '');
	assert.equal(audio.audioLengthInS, 0);
	assert.equal(audio.sampleRate, 0);
});

/**
 * Every environment variable {@link main} and the configuration helpers read. `withEnv` clears all of
 * them before applying its overrides, so a test never inherits a value from the developer's shell.
 */
const CONFIG_ENV_KEYS: string[] = [
	'ONDEWO_HOST',
	'ONDEWO_PORT',
	'ONDEWO_USE_SECURE_CHANNEL',
	'KEYCLOAK_URL',
	'KEYCLOAK_REALM',
	'KEYCLOAK_CLIENT_ID',
	'KEYCLOAK_USER_NAME',
	'KEYCLOAK_PASSWORD',
	'KEYCLOAK_VERIFY_SSL',
	'ONDEWO_T2S_PIPELINE_ID',
	'ONDEWO_T2S_TEXT'
];

/**
 * Run `body` with exactly `overrides` set in {@link CONFIG_ENV_KEYS} (every other config variable is
 * unset for the duration), restoring the previous environment afterwards.
 *
 * `main()` also calls `dotenv.config()` on `<script dir>/environment.env`. That template is
 * deliberately NOT copied into `.test-build/`, so the call is a silent no-op here and the test -- not
 * the checked-in template -- owns the environment.
 *
 * @param overrides - Config variables to set for the duration of `body`.
 * @param body - The (possibly async) test body to run.
 * @returns A promise that resolves once `body` has settled and the environment is restored.
 */
async function withEnv(overrides: Record<string, string>, body: () => void | Promise<void>): Promise<void> {
	const saved: Record<string, string | undefined> = {};
	for (const key of CONFIG_ENV_KEYS) {
		saved[key] = process.env[key];
		delete process.env[key];
	}
	Object.assign(process.env, overrides);
	try {
		await body();
	} finally {
		for (const key of CONFIG_ENV_KEYS) {
			const value: string | undefined = saved[key];
			if (value === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = value;
			}
		}
	}
}

runTestCase('envOr returns the environment value and falls back when the variable is unset or empty', async () => {
	await withEnv({ ONDEWO_HOST: 't2s.example.com' }, (): void => {
		assert.equal(envOr('ONDEWO_HOST', 'localhost'), 't2s.example.com');
		assert.equal(envOr('ONDEWO_PORT', '8080'), '8080');
	});
	// Set but blank counts as unset: environment.env ships the credential/pipeline keys empty.
	await withEnv({ ONDEWO_PORT: '' }, (): void => {
		assert.equal(envOr('ONDEWO_PORT', '8080'), '8080');
	});
});

runTestCase('envBool accepts only a case-insensitive "true" and falls back when unset or empty', async () => {
	await withEnv({ ONDEWO_USE_SECURE_CHANNEL: '  TrUe  ' }, (): void => {
		assert.equal(envBool('ONDEWO_USE_SECURE_CHANNEL', false), true);
	});
	await withEnv({ ONDEWO_USE_SECURE_CHANNEL: 'yes' }, (): void => {
		// Anything that is not "true" is false -- it does NOT fall back to the (true) default.
		assert.equal(envBool('ONDEWO_USE_SECURE_CHANNEL', true), false);
	});
	await withEnv({ ONDEWO_USE_SECURE_CHANNEL: '' }, (): void => {
		assert.equal(envBool('ONDEWO_USE_SECURE_CHANNEL', true), true);
	});
	await withEnv({}, (): void => {
		assert.equal(envBool('ONDEWO_USE_SECURE_CHANNEL', true), true);
		assert.equal(envBool('ONDEWO_USE_SECURE_CHANNEL', false), false);
	});
});

runTestCase('buildGrpcWebHost assembles <scheme>://host:port from the connection variables', async () => {
	await withEnv({}, (): void => {
		assert.equal(buildGrpcWebHost(), 'http://localhost:8080');
	});
	await withEnv(
		{ ONDEWO_HOST: 't2s.example.com', ONDEWO_PORT: '9443', ONDEWO_USE_SECURE_CHANNEL: 'true' },
		(): void => {
			assert.equal(buildGrpcWebHost(), 'https://t2s.example.com:9443');
		}
	);
});

/** What a {@link runMain} invocation captured from the stubbed login / RPC / console. */
interface MainRun {
	/** The options {@link main} passed to `login`. */
	loginOptions: OfflineTokenLoginOptions | null;
	/** The grpc-web hostname the constructed client was pointed at. */
	hostname: string;
	/** The request the example built, or `null` when the RPC was never reached. */
	request: SynthesizeRequest | null;
	/** The gRPC metadata the example attached. */
	metadata: grpcWeb.Metadata | undefined;
	/** Whether the token provider's `stop()` was called (the `finally` in {@link main}). */
	stopped: boolean;
	/** Everything {@link main} wrote to `console.log`. */
	logs: string[];
	/** The error {@link main} rejected with, or `null` when it resolved. */
	error: unknown;
}

/**
 * Run {@link main} with `login`, `Text2SpeechPromiseClient.prototype.synthesize` and `console.log`
 * stubbed, so the full example flow is exercised with NO network and NO real Keycloak.
 *
 * `login` and the generated client are patched on the module/prototype objects the compiled example
 * resolves through `require`, which is the only seam available: `main` wires them itself.
 *
 * @param env - Config environment variables to run `main` with.
 * @param synthesize - What the stubbed `synthesize` RPC resolves (or rejects) with.
 * @returns A promise resolving to everything the stubs captured.
 */
async function runMain(env: Record<string, string>, synthesize: () => Promise<SynthesizeResponse>): Promise<MainRun> {
	const run: MainRun = {
		loginOptions: null,
		hostname: '',
		request: null,
		metadata: undefined,
		stopped: false,
		logs: [],
		error: null
	};

	type LoginFn = (options: OfflineTokenLoginOptions) => Promise<OfflineTokenProvider>;
	// Both are widened to a MUTABLE structural type: a namespace import and a class prototype are
	// read-only to TypeScript, but patching them at runtime is the only seam -- main() wires its own
	// login() and its own client.
	const authModule: { login: LoginFn } = offlineTokenProviderModule;
	const clientPrototype: { synthesize: unknown } = Text2SpeechPromiseClient.prototype;
	const originalLogin: LoginFn = authModule.login;
	const originalSynthesize: unknown = clientPrototype.synthesize;
	const originalLog: typeof console.log = console.log;

	authModule.login = (options: OfflineTokenLoginOptions): Promise<OfflineTokenProvider> => {
		run.loginOptions = options;
		return Promise.resolve({
			getAuthorizationHeader: (): string => 'Bearer main-token',
			stop: (): void => {
				run.stopped = true;
			}
		} as unknown as OfflineTokenProvider);
	};
	clientPrototype.synthesize = function (
		this: { hostname_: string },
		request: SynthesizeRequest,
		metadata?: grpcWeb.Metadata
	): Promise<SynthesizeResponse> {
		run.hostname = this.hostname_;
		run.request = request;
		run.metadata = metadata;
		return synthesize();
	};
	console.log = (message: string): void => {
		run.logs.push(message);
	};

	try {
		await withEnv(env, async (): Promise<void> => {
			await main().catch((error: unknown): void => {
				run.error = error;
			});
		});
	} finally {
		console.log = originalLog;
		authModule.login = originalLogin;
		clientPrototype.synthesize = originalSynthesize;
	}
	return run;
}

runTestCase('main logs in, synthesizes over the configured grpc-web host and stops the token provider', async () => {
	const cannedResponse: SynthesizeResponse = new SynthesizeResponse();
	cannedResponse.setAudioUuid('audio-uuid-main');
	cannedResponse.setAudio(new Uint8Array([7, 7, 7]));
	cannedResponse.setAudioLength(0.5);
	cannedResponse.setSampleRate(16000);

	const run: MainRun = await runMain(
		{
			ONDEWO_HOST: 't2s.example.com',
			ONDEWO_PORT: '9443',
			ONDEWO_USE_SECURE_CHANNEL: 'true',
			KEYCLOAK_URL: 'https://auth.example.com/auth',
			KEYCLOAK_REALM: 'ondewo-ccai-platform',
			KEYCLOAK_CLIENT_ID: 'ondewo-t2s-cai-sdk-public',
			KEYCLOAK_USER_NAME: 'tech-user@example.com',
			KEYCLOAK_PASSWORD: 'super-secret',
			KEYCLOAK_VERIFY_SSL: 'false',
			ONDEWO_T2S_PIPELINE_ID: 'pipeline-main',
			ONDEWO_T2S_TEXT: 'main text'
		},
		(): Promise<SynthesizeResponse> => Promise.resolve(cannedResponse)
	);

	assert.equal(run.error, null);
	assert.deepEqual(run.loginOptions, {
		keycloakUrl: 'https://auth.example.com/auth',
		realm: 'ondewo-ccai-platform',
		clientId: 'ondewo-t2s-cai-sdk-public',
		username: 'tech-user@example.com',
		password: 'super-secret',
		keycloakVerifySsl: false
	});
	// ONDEWO_USE_SECURE_CHANNEL=true -> the https scheme reaches the generated client.
	assert.equal(run.hostname, 'https://t2s.example.com:9443');
	assert.equal(run.request?.getText(), 'main text');
	assert.equal(run.request?.getConfig()?.getT2sPipelineId(), 'pipeline-main');
	assert.deepEqual(run.metadata, { Authorization: 'Bearer main-token' });
	assert.equal(run.stopped, true);
	assert.ok(run.logs.some((line: string): boolean => line.includes('DONE: synthesized 3 bytes of audio')));
});

runTestCase('main stops the token provider even when the synthesize RPC fails', async () => {
	const rpcError: Error = new Error('UNAVAILABLE');

	const run: MainRun = await runMain({ KEYCLOAK_USER_NAME: 'tech-user@example.com' }, () => Promise.reject(rpcError));

	// The failure propagates to the caller, but the background refresh loop is shut down first.
	assert.equal(run.error, rpcError);
	assert.equal(run.stopped, true);
	// No connection variables set -> the documented defaults are used.
	assert.equal(run.hostname, 'http://localhost:8080');
	assert.equal(run.loginOptions?.keycloakUrl, 'https://localhost:8443/auth');
	assert.equal(run.loginOptions?.keycloakVerifySsl, true);
});
