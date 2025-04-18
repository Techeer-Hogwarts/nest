import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../dto/users/request/user.interface';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): RequestUser => {
        const request = ctx.switchToHttp().getRequest<Request>();
        return request.user;
    },
);
