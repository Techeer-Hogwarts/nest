import { HttpStatus } from '@nestjs/common';

export const ErrorCode = {
    /** Alert **/
    /** Auth **/
    /** AwsS3 **/
    /** Blog **/
    /** Bookmark **/
    /** Event **/
    /** GoogleDrive **/
    /** Like **/
    /** ProjectMember **/
    PROJECT_MEMBER_NOT_FOUND: {
        code: 'PROJECT_MEMBER_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '존재하지 않는 프로젝트 멤버입니다.',
    },
    PROJECT_MEMBER_INVALID_TEAM_ROLE: {
        code: 'PROJECT_MEMBER_INVALID_TEAM_ROLE',
        status: HttpStatus.BAD_REQUEST,
        message: '프로젝트 멤버의 팀 역할이 유효하지 않습니다.',
    },
    PROJECT_MEMBER_INVALID_ACTIVE_REQUESTER: {
        code: 'PROJECT_MEMBER_INVALID_ACTIVE_REQUESTER',
        status: HttpStatus.BAD_REQUEST,
        message: '프로젝트 멤버만 접근할 수 있습니다.',
    },
    PROJECT_MEMBER_APPLICATION_EXISTS: {
        code: 'PROJECT_MEMBER_APPLICATION_EXISTS',
        status: HttpStatus.BAD_REQUEST,
        message: '이미 해당 프로젝트에 지원하셨습니다.',
    },
    PROJECT_MEMBER_ALREADY_ACTIVE: {
        code: 'PROJECT_MEMBER_ALREADY_ACTIVE',
        status: HttpStatus.BAD_REQUEST,
        message: '이미 해당 프로젝트에서 활동 중인 멤버입니다.',
    },

    /** ProjectTeam **/
    PROJECT_TEAM_NOT_FOUND: {
        code: 'PROJECT_TEAM_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '프로젝트 팀을 찾을 수 없습니다.',
    },
    PROJECT_TEAM_MAIN_IMAGE_BAD_REQUEST: {
        code: 'PROJECT_TEAM_MAIN_IMAGE_BAD_REQUEST',
        status: HttpStatus.NOT_FOUND,
        message: '메인 이미지를 확인해주세요.',
    },
    PROJECT_TEAM_MISSING_LEADER: {
        code: 'PROJECT_TEAM_MISSING_LEADER',
        status: HttpStatus.BAD_REQUEST,
        message: '프로젝트 팀 리더가 존재하지 않습니다.',
    },
    PROJECT_TEAM_MISSING_MAIN_IMAGE: {
        code: 'PROJECT_TEAM_MISSING_MAIN_IMAGE',
        status: HttpStatus.BAD_REQUEST,
        message: '메인 이미지가 존재하지 않습니다.',
    },
    PROJECT_TEAM_DUPLICATE_TEAM_NAME: {
        code: 'PROJECT_TEAM_DUPLICATE_TEAM_NAME',
        status: HttpStatus.CONFLICT,
        message: '존재하는 프로젝트 이름입니다.',
    },
    PROJECT_TEAM_DUPLICATE_DELETE_UPDATE: {
        code: 'PROJECT_TEAM_DUPLICATE_DELETE_UPDATE',
        status: HttpStatus.CONFLICT,
        message: '프로젝트 삭제 멤버와 업데이트 멤버가 중복됩니다.',
    },
    PROJECT_TEAM_INVALID_TEAM_STACK: {
        code: 'PROJECT_TEAM_INVALID_TEAM_STACK',
        status: HttpStatus.BAD_REQUEST,
        message: '팀 스택이 유효하지 않은 존재합니다.',
    },
    PROJECT_TEAM_INVALID_RECRUIT_NUM: {
        code: 'PROJECT_TEAM_INVALID_RECRUIT_NUM',
        status: HttpStatus.BAD_REQUEST,
        message: '모집 인원이 음수 입니다.',
    },
    PROJECT_TEAM_MISSING_UPDATE_MEMBER: {
        code: 'PROJECT_TEAM_MISSING_UPDATE_MEMBER',
        status: HttpStatus.BAD_REQUEST,
        message: '프로젝트 팀 멤버 업데이트에 누락된 인원이 존재합니다.',
    },
    PROJECT_TEAM_RECRUITMENT_ENDED: {
        code: 'PROJECT_TEAM_RECRUITMENT_ENDED',
        status: HttpStatus.BAD_REQUEST,
        message: '프로젝트 팀 모집이 종료되었습니다.',
    },
    PROJECT_TEAM_INVALID_TEAM_ROLE: {
        code: 'PROJECT_TEAM_INVALID_TEAM_ROLE',
        status: HttpStatus.BAD_REQUEST,
        message: '유효하지 않은 팀 역할입니다.',
    },
    PROJECT_TEAM_INVALID_APPLICANT: {
        code: 'PROJECT_TEAM_INVALID_APPLICANT',
        status: HttpStatus.BAD_REQUEST,
        message: '유효하지 않은 지원자입니다.',
    },
    PROJECT_TEAM_EXCEEDED_RESULT_IMAGE: {
        code: 'PROJECT_TEAM_EXCEEDED_RESULT_IMAGE',
        status: HttpStatus.BAD_REQUEST,
        message: '결과 이미지는 10개까지만 등록 가능합니다.',
    },
    PROJECT_TEAM_ALREADY_APPROVED: {
        code: 'PROJECT_TEAM_ALREADY_APPROVED',
        status: HttpStatus.BAD_REQUEST,
        message: '이미 승인된 프로젝트 멤버입니다.',
    },
    /** Resumes **/
    /** Session **/
    /** Stack **/

    /** StudyMember **/
    STUDY_MEMBER_BAD_REQUEST: {
        code: 'STUDY_MEMBER_BAD_REQUEST',
        status: HttpStatus.BAD_REQUEST,
        message: '유효하지 않은 요청입니다.',
    },
    STUDY_MEMBER_NOT_FOUND: {
        code: 'STUDY_MEMBER_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '스터디 멤버를 찾을 수 없습니다.',
    },
    STUDY_MEMBER_IS_ACTIVE_MEMBER: {
        code: 'STUDY_MEMBER_IS_ACTIVE_MEMBER',
        status: HttpStatus.CONFLICT,
        message: '이미 활동 중인 스터디 멤버입니다.',
    },

    STUDY_MEMBER_INVALID_TEAM_MEMBER: {
        code: 'STUDY_MEMBER_INVALID_TEAM_MEMBER',
        status: HttpStatus.BAD_REQUEST,
        message: '유효하지 않은 스터디 멤버입니다.',
    },

    /** StudyTeam **/
    STUDY_TEAM_BAD_REQUEST: {
        code: 'STUDY_TEAM_BAD_REQUEST',
        status: HttpStatus.BAD_REQUEST,
        message: '유효하지 않은 요청입니다.',
    },
    STUDY_TEAM_NOT_FOUND: {
        code: 'STUDY_TEAM_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '요청한 스터디 팀을 찾을 수 없습니다.',
    },
    STUDY_TEAM_DUPLICATE_TEAM_NAME: {
        code: 'STUDY_TEAM_DUPLICATE_TEAM_NAME',
        status: HttpStatus.CONFLICT,
        message: '존재하는 스터디 이름입니다.',
    },
    STUDY_TEAM_INVALID_RECRUIT_NUM: {
        code: 'STUDY_TEAM_INVALID_RECRUIT_NUM',
        status: HttpStatus.BAD_REQUEST,
        message: '모집 인원이 음수 입니다.',
    },
    STUDY_TEAM_MISSING_LEADER: {
        code: 'STUDY_TEAM_MISSING_LEADER',
        status: HttpStatus.BAD_REQUEST,
        message: '스터디 팀 리더가 존재하지 않습니다.',
    },
    STUDY_TEAM_INVALID_UPDATE_MEMBER: {
        code: 'STUDY_TEAM_INVALID_UPDATE_MEMBER',
        status: HttpStatus.BAD_REQUEST,
        message: '스터디 업데이트 멤버가 유효하지 않습니다.',
    },
    STUDY_TEAM_ALREADY_ACTIVE_MEMBER: {
        code: 'STUDY_TEAM_ALREADY_ACTIVE_MEMBER',
        status: HttpStatus.BAD_REQUEST,
        message: '이미 활동중인 스터디 멤버입니다.',
    },
    STUDY_TEAM_ALREADY_REJECT_MEMBER: {
        code: 'STUDY_TEAM_ALREADY_REJECT_MEMBER',
        status: HttpStatus.BAD_REQUEST,
        message: '이미 거절된 스터디 팀 지원자 입니다.',
    },
    STUDY_TEAM_INVALID_APPLICANT: {
        code: 'STUDY_TEAM_INVALID_APPLICANT',
        status: HttpStatus.BAD_REQUEST,
        message: '유효한 스터디 팀 지원자가 아닙니다.',
    },
    STUDY_TEAM_INVALID_USER: {
        code: 'STUDY_TEAM_INVALID_USER',
        status: HttpStatus.BAD_REQUEST,
        message: '유효한 사용자가 아닙니다.',
    },
    STUDY_TEAM_NOT_ACTIVE_MEMBER: {
        code: 'STUDY_TEAM_NOT_ACTIVE_MEMBER',
        status: HttpStatus.BAD_REQUEST,
        message: '스터디 팀 활동 중인 멤버가 아닙니다.',
    },
    /** TeamStack **/
    /** UserExperience **/
    /** User **/
    /** Global**/
    INTERNAL_SERVER_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    },
} as const;
