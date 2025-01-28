import { UserEntity } from '../../entities/user.entity';

export class GetUserResponse {
    readonly profileImage: string;
    readonly name: string;
    readonly nickname: string;
    readonly email: string;
    readonly school: string;
    readonly grade: string;
    readonly mainPosition: string;
    readonly subPosition?: string;
    readonly githubUrl: string;
    readonly mediumUrl: string;
    readonly velogUrl: string;
    readonly tistoryUrl: string;
    readonly isLft: boolean;

    readonly projectTeams: { name: string; resultImages: string[] }[];
    readonly studyTeams: { name: string; resultImages: string[] }[];
    readonly experiences: {
        position: string;
        companyName: string;
        startDate: string;
        endDate: string;
        category: string;
        isFinished: boolean;
    }[];

    constructor(userEntity: UserEntity) {
        this.profileImage = userEntity.profileImage;
        this.name = userEntity.name;
        this.nickname = userEntity.nickname;
        this.email = userEntity.email;
        this.school = userEntity.school;
        this.grade = userEntity.grade;
        this.mainPosition = userEntity.mainPosition;
        this.subPosition = userEntity.subPosition;
        this.githubUrl = userEntity.githubUrl;
        this.mediumUrl = userEntity.mediumUrl;
        this.velogUrl = userEntity.velogUrl;
        this.tistoryUrl = userEntity.tistoryUrl;
        this.isLft = userEntity.isLft;

        // projectMembers와 studyMembers가 undefined일 경우 빈 배열로 초기화
        this.projectTeams = Array.isArray(userEntity.projectMembers)
            ? userEntity.projectMembers.map((pm) => ({
                  name: pm.projectTeam.name,
                  resultImages: pm.projectTeam.resultImages,
              }))
            : [];

        this.studyTeams = Array.isArray(userEntity.studyMembers)
            ? userEntity.studyMembers.map((sm) => ({
                  name: sm.studyTeam.name,
                  resultImages: sm.studyTeam.resultImages,
              }))
            : [];

        this.experiences = Array.isArray(userEntity.experiences)
            ? userEntity.experiences.map((exp) => ({
                  position: exp.position,
                  companyName: exp.companyName,
                  startDate: exp.startDate,
                  endDate: exp.endDate,
                  category: exp.category,
                  isFinished: exp.isFinished,
              }))
            : [];
    }
}
