export interface Session {
    id: number;
    userId: number;
    eventId: number;
    status: string;
    thumbnail: string;
    title: string;
    presenter: string;
    date: string;
    position: string;
    category: string;
    videoUrl: string;
    fileUrl: string;
    likeCount: number;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
} 