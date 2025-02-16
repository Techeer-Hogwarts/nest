import axios from 'axios';
import { CreateProjectAlertRequest } from './dto/request/create.project.alert.request';
import { CreateStudyAlertRequest } from './dto/request/create.study.alert.request';
import { Injectable } from '@nestjs/common';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';
import { CreatePersonalAlertRequest } from './dto/request/create.personal.alert.request';

const SLACKBOT_URL = process.env.SLACKBOT_URL;
const SLACKBOT_PERSONAL_URL = process.env.SLACKBOT_PERSONAL_URL;

type SlackAlertPayload = CreateProjectAlertRequest | CreateStudyAlertRequest;

@Injectable()
export class AlertServcie {
    constructor(private readonly logger: CustomWinstonLogger) {}

    /**
     * 공고가 올라오면 알림을 슬랙 채널로 전송합니다.
     */
    async sendSlackAlert(payload: SlackAlertPayload): Promise<void> {
        try {
            await axios.post(SLACKBOT_URL, payload);
            this.logger.debug('Slack channel alert sent successfully!');
        } catch (error) {
            this.logger.error('Error sending Slack channel alert:', error);
        }
    }

    /**
     * 공고에 지원/승인/거절 등 사용자에게 전달(슬랙 개인 디엠)할 알림을 전송합니다.
     */
    async sendUserAlert(payload: CreatePersonalAlertRequest): Promise<void> {
        try {
            await axios.post(SLACKBOT_PERSONAL_URL, payload);
            this.logger.debug('User alert sent successfully!');
        } catch (error) {
            this.logger.error('Error sending user alert:', error);
        }
    }
}
