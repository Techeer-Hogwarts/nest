import { UserEntity } from '../../entities/user.entity';

export class GetUserResponse {
    readonly id: number;
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
    readonly year: number;
    readonly stack: string[];

    readonly projectTeams: {
        id: number;
        name: string;
        resultImages: string[];
        mainImage: string;
    }[];
    readonly studyTeams: {
        id: number;
        name: string;
        resultImages: string[];
        mainImage: string;
    }[];
    readonly experiences: {
        id: number;
        position: string;
        companyName: string;
        startDate: string;
        endDate: string;
        category: string;
        isFinished: boolean;
    }[];

    constructor(userEntity: UserEntity) {
        this.id = userEntity.id;
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
        this.year = userEntity.year;
        this.stack = userEntity.stack;

        // 프로젝트 팀의 mainImage는 mainImages에서 가져옴
        this.projectTeams = Array.isArray(userEntity.projectMembers)
            ? userEntity.projectMembers.map((pm) => ({
                  id: pm.projectTeam.id,
                  name: pm.projectTeam.name,
                  resultImages: Array.isArray(pm.projectTeam.resultImages)
                      ? pm.projectTeam.resultImages.map((img) => img.imageUrl)
                      : [],
                  mainImage: pm.projectTeam.mainImages?.[0]?.imageUrl || '', // mainImages의 첫 번째 이미지 사용
              }))
            : [];

        // 스터디 팀의 mainImage는 resultImages 배열의 첫 번째 값을 사용
        this.studyTeams = Array.isArray(userEntity.studyMembers)
            ? userEntity.studyMembers.map((sm) => ({
                  id: sm.studyTeam.id,
                  name: sm.studyTeam.name,
                  resultImages: Array.isArray(sm.studyTeam.resultImages)
                      ? sm.studyTeam.resultImages.map((img) => img.imageUrl)
                      : [],
                  mainImage: sm.studyTeam.resultImages?.[0]?.imageUrl || '', // resultImages의 첫 번째 이미지 사용
              }))
            : [];

        this.experiences = Array.isArray(userEntity.experiences)
            ? userEntity.experiences.map((exp) => ({
                  id: exp.id,
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
