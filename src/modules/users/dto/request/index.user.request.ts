import { UserEntity } from '../../entities/user.entity';

export class IndexUserRequest {
    readonly email: string;
    readonly grade: string;
    readonly id: string;
    readonly name: string;
    readonly profileImage: string;
    readonly school: string;
    readonly stack: string[];
    readonly year: string;

    constructor(user: UserEntity) {
        this.email = user.email;
        this.grade = user.grade;
        this.id = String(user.id);
        this.name = user.name;
        this.profileImage = user.profileImage;
        this.school = user.school;
        this.stack = user.stack;
        this.year = String(user.year);
    }
}
