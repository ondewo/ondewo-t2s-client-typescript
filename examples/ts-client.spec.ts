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

import { synthesizeText, type SynthesizedAudio, type T2sSynthesizeClient } from './ts-client';
import { SynthesizeRequest, SynthesizeResponse } from '../api/ondewo/t2s/text-to-speech_pb';

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
