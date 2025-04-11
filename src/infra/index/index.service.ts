import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';

@Injectable()
export class IndexService {
    private readonly indexApiUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: CustomWinstonLogger,
    ) {
        this.indexApiUrl = this.configService.get<string>('INDEX_API_URL');
    }

    async deleteIndex(index: string, id: string): Promise<void> {
        try {
            const url = `${this.indexApiUrl}/delete/document?index=${index}&id=${id}`;
            this.logger.debug(`DELETE 요청을 보냄: ${url}`, IndexService.name);

            const response = await axios.delete(url);

            this.logger.debug(
                `${index} ID: ${id} 인덱스 삭제 요청 응답 상태 코드: ${response.status}`,
                `deleteIndex`,
            );
            if (response.status !== 200) {
                this.logger.error('인덱스 삭제 실패', IndexService.name);
            }
        } catch (error) {
            this.logger.error(
                `인덱스 삭제 중 오류 발생: ${error.message}`,
                IndexService.name,
            );
            this.logger.debug(
                `오류 상세 정보: ${JSON.stringify(error.response)}`,
                IndexService.name,
            );
        }
    }

    async createIndex<T>(index: string, data: T): Promise<void> {
        try {
            const url = `${this.indexApiUrl}/index/${index}`;
            this.logger.debug(`POST 요청을 보냄: ${url}`, IndexService.name);
            this.logger.debug(
                `전송 데이터: ${JSON.stringify(data)}`,
                IndexService.name,
            );
            const response = await axios.post(url, data);
            this.logger.debug(
                `${index} 인덱스 생성 요청 응답 상태 코드: ${response.status}`,
                'createIndex',
            );
            if (response.status !== 200) {
                this.logger.error('인덱스 생성 실패', IndexService.name);
            }
        } catch (error) {
            this.logger.error(
                `인덱스 생성 중 오류 발생: ${error.message}`,
                IndexService.name,
            );
            this.logger.debug(
                `오류 상세 정보: ${JSON.stringify(error.response)}`,
                IndexService.name,
            );
        }
    }
}
