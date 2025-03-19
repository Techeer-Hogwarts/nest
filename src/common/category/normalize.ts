/**
 * 문자열을 표준화합니다.
 * - 공백을 언더스코어(_)로 치환
 * - 대문자로 변환
 * @param input 입력 문자열
 * @returns 표준화된 문자열
 */
export function normalizeString(
    input: string | null | undefined,
): string | null {
    if (!input) return null;

    return input
        .trim() // 문자열 앞뒤 공백 제거
        .replace(/\s+/g, '_') // 공백을 언더스코어(_)로 치환
        .toUpperCase(); // 대문자로 변환
}
