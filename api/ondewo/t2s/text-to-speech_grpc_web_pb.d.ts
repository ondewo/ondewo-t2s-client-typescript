import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as ondewo_t2s_text$to$speech_pb from '../../ondewo/t2s/text-to-speech_pb';


export class Text2SpeechClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  synthesize(
    request: ondewo_t2s_text$to$speech_pb.SynthesizeRequest,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: ondewo_t2s_text$to$speech_pb.SynthesizeResponse) => void
  ): grpcWeb.ClientReadableStream<ondewo_t2s_text$to$speech_pb.SynthesizeResponse>;

  getT2sPipeline(
    request: ondewo_t2s_text$to$speech_pb.T2sPipelineId,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: ondewo_t2s_text$to$speech_pb.Text2SpeechConfig) => void
  ): grpcWeb.ClientReadableStream<ondewo_t2s_text$to$speech_pb.Text2SpeechConfig>;

  createT2sPipeline(
    request: ondewo_t2s_text$to$speech_pb.Text2SpeechConfig,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: ondewo_t2s_text$to$speech_pb.T2sPipelineId) => void
  ): grpcWeb.ClientReadableStream<ondewo_t2s_text$to$speech_pb.T2sPipelineId>;

  deleteT2sPipeline(
    request: ondewo_t2s_text$to$speech_pb.T2sPipelineId,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  updateT2sPipeline(
    request: ondewo_t2s_text$to$speech_pb.Text2SpeechConfig,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listT2sPipelines(
    request: ondewo_t2s_text$to$speech_pb.ListT2sPipelinesRequest,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: ondewo_t2s_text$to$speech_pb.ListT2sPipelinesResponse) => void
  ): grpcWeb.ClientReadableStream<ondewo_t2s_text$to$speech_pb.ListT2sPipelinesResponse>;

}

export class Text2SpeechPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  synthesize(
    request: ondewo_t2s_text$to$speech_pb.SynthesizeRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<ondewo_t2s_text$to$speech_pb.SynthesizeResponse>;

  getT2sPipeline(
    request: ondewo_t2s_text$to$speech_pb.T2sPipelineId,
    metadata?: grpcWeb.Metadata
  ): Promise<ondewo_t2s_text$to$speech_pb.Text2SpeechConfig>;

  createT2sPipeline(
    request: ondewo_t2s_text$to$speech_pb.Text2SpeechConfig,
    metadata?: grpcWeb.Metadata
  ): Promise<ondewo_t2s_text$to$speech_pb.T2sPipelineId>;

  deleteT2sPipeline(
    request: ondewo_t2s_text$to$speech_pb.T2sPipelineId,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  updateT2sPipeline(
    request: ondewo_t2s_text$to$speech_pb.Text2SpeechConfig,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listT2sPipelines(
    request: ondewo_t2s_text$to$speech_pb.ListT2sPipelinesRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<ondewo_t2s_text$to$speech_pb.ListT2sPipelinesResponse>;

}

