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
    /** ProjectTeam **/
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
        status: HttpStatus.NOT_FOUND,
        message: '스터디 리더가 존재하지 않습니다.',
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
        code: 'STUDY_TEAM_INVALID_UPDATE_MEMBER',
        status: HttpStatus.BAD_REQUEST,
        message: '유효한 스터디 팀 지원자가 아닙니다.',
    },
    STUDY_TEAM_INVALID_USER: {
        code: 'STUDY_TEAM_INVALID_UPDATE_MEMBER',
        status: HttpStatus.BAD_REQUEST,
        message: '유효한 사용자가 아닙니다.',
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
