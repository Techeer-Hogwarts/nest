import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../types/request/user.interface';
import { Request } from 'express';

export const User = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): RequestUser => {
        const request = ctx.switchToHttp().getRequest<Request>();
        return request.user;
    },
);
