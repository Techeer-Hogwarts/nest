import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PrismaInstrumentation } from '@prisma/instrumentation';
// import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
// import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { resourceFromAttributes } from '@opentelemetry/resources';

@Injectable()
export class TracingService implements OnModuleInit, OnModuleDestroy {
    private sdk: NodeSDK;

    private readonly logger = new CustomWinstonLogger();

    async onModuleInit(): Promise<void> {
        this.sdk = new NodeSDK({
            resource: resourceFromAttributes({
                [ATTR_SERVICE_NAME]: process.env.TRACE_SERVICE_NAME || 'nestjs-app',
            }),
            traceExporter: new OTLPTraceExporter({
                url:
                    process.env.TRACE_OTLP_EXPORTER_URL ||
                    'http://otel-collector:4318/v1/traces',
            }),
            instrumentations: [
                new HttpInstrumentation(),
                new ExpressInstrumentation(),
                new PrismaInstrumentation(),
                // new PgInstrumentation(),
            ],
        });

        await this.sdk.start();
        this.logger.log('✅ OpenTelemetry tracing started');
    }

    async onModuleDestroy(): Promise<void> {
        await this.sdk.shutdown();
        this.logger.log('OpenTelemetry tracing stopped');
    }
}
