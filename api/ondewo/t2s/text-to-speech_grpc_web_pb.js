/**
 * @fileoverview gRPC-Web generated client stub for ondewo.t2s
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');


var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js')
const proto = {};
proto.ondewo = {};
proto.ondewo.t2s = require('./text-to-speech_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.ondewo.t2s.Text2SpeechClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'binary';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.ondewo.t2s.Text2SpeechPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'binary';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.ondewo.t2s.SynthesizeRequest,
 *   !proto.ondewo.t2s.SynthesizeResponse>}
 */
const methodDescriptor_Text2Speech_Synthesize = new grpc.web.MethodDescriptor(
  '/ondewo.t2s.Text2Speech/Synthesize',
  grpc.web.MethodType.UNARY,
  proto.ondewo.t2s.SynthesizeRequest,
  proto.ondewo.t2s.SynthesizeResponse,
  /**
   * @param {!proto.ondewo.t2s.SynthesizeRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.ondewo.t2s.SynthesizeResponse.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.ondewo.t2s.SynthesizeRequest,
 *   !proto.ondewo.t2s.SynthesizeResponse>}
 */
const methodInfo_Text2Speech_Synthesize = new grpc.web.AbstractClientBase.MethodInfo(
  proto.ondewo.t2s.SynthesizeResponse,
  /**
   * @param {!proto.ondewo.t2s.SynthesizeRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.ondewo.t2s.SynthesizeResponse.deserializeBinary
);


/**
 * @param {!proto.ondewo.t2s.SynthesizeRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.ondewo.t2s.SynthesizeResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.ondewo.t2s.SynthesizeResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.ondewo.t2s.Text2SpeechClient.prototype.synthesize =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/Synthesize',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_Synthesize,
      callback);
};


/**
 * @param {!proto.ondewo.t2s.SynthesizeRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.ondewo.t2s.SynthesizeResponse>}
 *     Promise that resolves to the response
 */
proto.ondewo.t2s.Text2SpeechPromiseClient.prototype.synthesize =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/Synthesize',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_Synthesize);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.ondewo.t2s.T2sPipelineId,
 *   !proto.ondewo.t2s.Text2SpeechConfig>}
 */
const methodDescriptor_Text2Speech_GetT2sPipeline = new grpc.web.MethodDescriptor(
  '/ondewo.t2s.Text2Speech/GetT2sPipeline',
  grpc.web.MethodType.UNARY,
  proto.ondewo.t2s.T2sPipelineId,
  proto.ondewo.t2s.Text2SpeechConfig,
  /**
   * @param {!proto.ondewo.t2s.T2sPipelineId} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.ondewo.t2s.Text2SpeechConfig.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.ondewo.t2s.T2sPipelineId,
 *   !proto.ondewo.t2s.Text2SpeechConfig>}
 */
const methodInfo_Text2Speech_GetT2sPipeline = new grpc.web.AbstractClientBase.MethodInfo(
  proto.ondewo.t2s.Text2SpeechConfig,
  /**
   * @param {!proto.ondewo.t2s.T2sPipelineId} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.ondewo.t2s.Text2SpeechConfig.deserializeBinary
);


/**
 * @param {!proto.ondewo.t2s.T2sPipelineId} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.ondewo.t2s.Text2SpeechConfig)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.ondewo.t2s.Text2SpeechConfig>|undefined}
 *     The XHR Node Readable Stream
 */
proto.ondewo.t2s.Text2SpeechClient.prototype.getT2sPipeline =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/GetT2sPipeline',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_GetT2sPipeline,
      callback);
};


/**
 * @param {!proto.ondewo.t2s.T2sPipelineId} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.ondewo.t2s.Text2SpeechConfig>}
 *     Promise that resolves to the response
 */
proto.ondewo.t2s.Text2SpeechPromiseClient.prototype.getT2sPipeline =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/GetT2sPipeline',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_GetT2sPipeline);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.ondewo.t2s.Text2SpeechConfig,
 *   !proto.ondewo.t2s.T2sPipelineId>}
 */
const methodDescriptor_Text2Speech_CreateT2sPipeline = new grpc.web.MethodDescriptor(
  '/ondewo.t2s.Text2Speech/CreateT2sPipeline',
  grpc.web.MethodType.UNARY,
  proto.ondewo.t2s.Text2SpeechConfig,
  proto.ondewo.t2s.T2sPipelineId,
  /**
   * @param {!proto.ondewo.t2s.Text2SpeechConfig} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.ondewo.t2s.T2sPipelineId.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.ondewo.t2s.Text2SpeechConfig,
 *   !proto.ondewo.t2s.T2sPipelineId>}
 */
const methodInfo_Text2Speech_CreateT2sPipeline = new grpc.web.AbstractClientBase.MethodInfo(
  proto.ondewo.t2s.T2sPipelineId,
  /**
   * @param {!proto.ondewo.t2s.Text2SpeechConfig} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.ondewo.t2s.T2sPipelineId.deserializeBinary
);


/**
 * @param {!proto.ondewo.t2s.Text2SpeechConfig} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.ondewo.t2s.T2sPipelineId)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.ondewo.t2s.T2sPipelineId>|undefined}
 *     The XHR Node Readable Stream
 */
proto.ondewo.t2s.Text2SpeechClient.prototype.createT2sPipeline =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/CreateT2sPipeline',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_CreateT2sPipeline,
      callback);
};


/**
 * @param {!proto.ondewo.t2s.Text2SpeechConfig} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.ondewo.t2s.T2sPipelineId>}
 *     Promise that resolves to the response
 */
proto.ondewo.t2s.Text2SpeechPromiseClient.prototype.createT2sPipeline =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/CreateT2sPipeline',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_CreateT2sPipeline);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.ondewo.t2s.T2sPipelineId,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Text2Speech_DeleteT2sPipeline = new grpc.web.MethodDescriptor(
  '/ondewo.t2s.Text2Speech/DeleteT2sPipeline',
  grpc.web.MethodType.UNARY,
  proto.ondewo.t2s.T2sPipelineId,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.ondewo.t2s.T2sPipelineId} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.ondewo.t2s.T2sPipelineId,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Text2Speech_DeleteT2sPipeline = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.ondewo.t2s.T2sPipelineId} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.ondewo.t2s.T2sPipelineId} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.ondewo.t2s.Text2SpeechClient.prototype.deleteT2sPipeline =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/DeleteT2sPipeline',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_DeleteT2sPipeline,
      callback);
};


/**
 * @param {!proto.ondewo.t2s.T2sPipelineId} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.ondewo.t2s.Text2SpeechPromiseClient.prototype.deleteT2sPipeline =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/DeleteT2sPipeline',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_DeleteT2sPipeline);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.ondewo.t2s.Text2SpeechConfig,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Text2Speech_UpdateT2sPipeline = new grpc.web.MethodDescriptor(
  '/ondewo.t2s.Text2Speech/UpdateT2sPipeline',
  grpc.web.MethodType.UNARY,
  proto.ondewo.t2s.Text2SpeechConfig,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.ondewo.t2s.Text2SpeechConfig} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.ondewo.t2s.Text2SpeechConfig,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Text2Speech_UpdateT2sPipeline = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.ondewo.t2s.Text2SpeechConfig} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.ondewo.t2s.Text2SpeechConfig} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.ondewo.t2s.Text2SpeechClient.prototype.updateT2sPipeline =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/UpdateT2sPipeline',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_UpdateT2sPipeline,
      callback);
};


/**
 * @param {!proto.ondewo.t2s.Text2SpeechConfig} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.ondewo.t2s.Text2SpeechPromiseClient.prototype.updateT2sPipeline =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/UpdateT2sPipeline',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_UpdateT2sPipeline);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.ondewo.t2s.ListT2sPipelinesRequest,
 *   !proto.ondewo.t2s.ListT2sPipelinesResponse>}
 */
const methodDescriptor_Text2Speech_ListT2sPipelines = new grpc.web.MethodDescriptor(
  '/ondewo.t2s.Text2Speech/ListT2sPipelines',
  grpc.web.MethodType.UNARY,
  proto.ondewo.t2s.ListT2sPipelinesRequest,
  proto.ondewo.t2s.ListT2sPipelinesResponse,
  /**
   * @param {!proto.ondewo.t2s.ListT2sPipelinesRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.ondewo.t2s.ListT2sPipelinesResponse.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.ondewo.t2s.ListT2sPipelinesRequest,
 *   !proto.ondewo.t2s.ListT2sPipelinesResponse>}
 */
const methodInfo_Text2Speech_ListT2sPipelines = new grpc.web.AbstractClientBase.MethodInfo(
  proto.ondewo.t2s.ListT2sPipelinesResponse,
  /**
   * @param {!proto.ondewo.t2s.ListT2sPipelinesRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.ondewo.t2s.ListT2sPipelinesResponse.deserializeBinary
);


/**
 * @param {!proto.ondewo.t2s.ListT2sPipelinesRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.ondewo.t2s.ListT2sPipelinesResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.ondewo.t2s.ListT2sPipelinesResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.ondewo.t2s.Text2SpeechClient.prototype.listT2sPipelines =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/ListT2sPipelines',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_ListT2sPipelines,
      callback);
};


/**
 * @param {!proto.ondewo.t2s.ListT2sPipelinesRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.ondewo.t2s.ListT2sPipelinesResponse>}
 *     Promise that resolves to the response
 */
proto.ondewo.t2s.Text2SpeechPromiseClient.prototype.listT2sPipelines =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/ondewo.t2s.Text2Speech/ListT2sPipelines',
      request,
      metadata || {},
      methodDescriptor_Text2Speech_ListT2sPipelines);
};


module.exports = proto.ondewo.t2s;

