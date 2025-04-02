// 좋아요와 북마크 기능이 가능한 콘텐츠 타입 정의
export const INTERACTABLE_CONTENT_TYPES = [
    'SESSION',
    'BLOG',
    'RESUME',
    'PROJECT',
    'STUDY',
] as const;

export type InteractableContentType = typeof INTERACTABLE_CONTENT_TYPES[number];

export const isInteractableContentType = (type: string): type is InteractableContentType => {
    return INTERACTABLE_CONTENT_TYPES.includes(type as InteractableContentType);
}; 