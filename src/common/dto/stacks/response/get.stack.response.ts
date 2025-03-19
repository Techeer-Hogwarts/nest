import { StackEntity } from '../../../../core/stacks/entities/stack.entity';

export class GetStackResponse {
    readonly category: string;
    readonly name: string;

    constructor(stackEntity: StackEntity) {
        this.category = stackEntity.category;
        this.name = stackEntity.name;
    }
}
