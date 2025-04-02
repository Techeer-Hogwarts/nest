export interface ProjectLeaderEmails {
    user: {
        email: string;
    };
}
export interface ProjectTeamLeadersAlert {
    name: string;
    projectMember: {
        user: {
            email: string;
        };
    }[];
}
