export class PagableMeta {
    readonly totalPages: number;
    readonly currentPage: number;
    readonly hasNextPage: boolean;
    readonly totalItems: number;

    constructor(total: number, offset: number, limit: number) {
        this.totalItems = total; // 전체 아이템 개수
        this.totalPages = Math.ceil(total / limit); // 전체 페이지 수
        this.currentPage = Math.floor(offset / limit) + 1; // 현재 페이지 번호
        this.hasNextPage = this.currentPage < this.totalPages; // 다음 페이지 여부
    }
}
