'use strict';

import { PrismaInstrumentation } from '@prisma/instrumentation';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';

// import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { CustomWinstonLogger } from './common/logger/winston.logger';

// Initialize the SDK and register with the OpenTelemetry API

const logger = new CustomWinstonLogger();

const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
        url:
            process.env.TRACING_AGENT_URL ||
            'http://otel-collector:4318/v1/traces',
    }),
    instrumentations: [
        new PrismaInstrumentation(),
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new NestInstrumentation(),
        // getNodeAutoInstrumentations(),
    ],
    resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: process.env.TRACING_SERVICE_NAME || 'nestjs-app',
    }),
});

// Enable the API to record telemetry
logger.log('Starting tracing');
sdk.start();

// Gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => logger.log('Tracing terminated'))
        .catch((error) => logger.log('Error terminating tracing', error))
        .finally(() => process.exit(0));
});

export default sdk;
