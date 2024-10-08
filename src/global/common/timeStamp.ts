import {
    BaseEntity,
    CreateDateColumn,
    DeleteDateColumn,
    UpdateDateColumn,
} from 'prisma';

export abstract class Timestamp extends BaseEntity {
    @CreateDateColumn({ type: 'timestamp' }) createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' }) updatedAt: Date;

    @DeleteDateColumn({
        type: 'timestamp',
        nullable: true,
    })
    deletedAt: Date | null;
}
