export class BlogPostDto {
    readonly title: string;
    readonly url: string;
    readonly author: string;
    readonly authorImage: string;
    readonly thumbnail: string;
    readonly category: string;
    readonly date: string;
    readonly tags: string[];

    constructor(post: any) {
        this.title = post.title;
        this.url = post.url;
        this.author = post.author;
        this.authorImage = post.authorImage;
        this.thumbnail = post.thumbnail;
        this.category = post.category;
        this.date = post.date;
        this.tags = post.tags || [];
    }
}
