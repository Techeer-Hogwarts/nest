import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { Request } from 'express';

import { RequestUser } from '../dto/users/request/user.interface';

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): RequestUser => {
        const request = ctx.switchToHttp().getRequest<Request>();
        return request.user;
    },
);
