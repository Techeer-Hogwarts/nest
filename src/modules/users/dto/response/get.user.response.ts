import { UserEntity } from '../../entities/user.entity';

export class GetUserResponse {
    readonly profileImage: string;
    readonly name: string;
    readonly nickname: string;
    readonly email: string;
    readonly school: string;
    readonly class: string;
    readonly mainPosition: string;
    readonly subPosition?: string;
    readonly githubUrl: string;
    readonly blogUrl: string;
    readonly isLft: boolean;
    readonly isIntern: boolean;
    readonly internCompanyName: string;
    readonly internPosition: string;
    readonly isFullTime: boolean;
    readonly fullTimeCompanyName: string;
    readonly fullTimePosition: string;

    readonly user: UserEntity;

    constructor(userEntity: UserEntity) {
        this.profileImage = userEntity.profileImage;
        this.name = userEntity.name;
        this.nickname = userEntity.nickname;
        this.email = userEntity.email;
        this.school = userEntity.school;
        this.class = userEntity.class;
        this.mainPosition = userEntity.mainPosition;
        this.subPosition = userEntity.subPosition;
        this.githubUrl = userEntity.githubUrl;
        this.blogUrl = userEntity.blogUrl;
        this.isLft = userEntity.isLft;
        this.isIntern = userEntity.isIntern;
        this.internCompanyName = userEntity.internCompanyName;
        this.internPosition = userEntity.internPosition;
        this.isFullTime = userEntity.isFullTime;
        this.fullTimeCompanyName = userEntity.fullTimeCompanyName;
        this.fullTimePosition = userEntity.fullTimePosition;
    }
}
