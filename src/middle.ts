import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TraceLoggingMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        // Log the trace context header, e.g., "uber-trace-id"
        const traefikTraceId =
            req.headers['uber-trace-id'] || 'No TraceId found';
        const traceId = req.headers['x-b3-traceid'] || 'No TraceId found';
        const spanId = req.headers['x-b3-spanid'] || 'No SpanId found';
        const parentSpanId =
            req.headers['x-b3-parentspanid'] || 'No ParentSpanId found';
        const sampled = req.headers['x-b3-sampled'] || 'No Sampled flag found';
        const flags = req.headers['x-b3-flags'] || 'No Flags found';

        console.log(`Received Request with Trace Information:
            TraefikTraceId: ${traefikTraceId}
          TraceId: ${traceId}
          SpanId: ${spanId}
          ParentSpanId: ${parentSpanId}
          Sampled: ${sampled}
          Flags: ${flags}
        `);

        // Continue processing the request
        next();
    }
}
