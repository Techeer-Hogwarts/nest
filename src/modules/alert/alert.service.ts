import axios from 'axios';
import { CreateProjectAlertRequest } from './dto/request/create.project.alert.request';
import { CreateStudyAlertRequest } from './dto/request/create.study.alert.request';
import { Injectable } from '@nestjs/common';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';

const SLACKBOT_URL = process.env.SLACKBOT_URL;

type SlackAlertPayload = CreateProjectAlertRequest | CreateStudyAlertRequest;

@Injectable()
export class AlertServcie {
    constructor(private readonly logger: CustomWinstonLogger) {}

    async sendSlackAlert(payload: SlackAlertPayload): Promise<void> {
        try {
            await axios.post(SLACKBOT_URL, payload);
            this.logger.debug('Slack alert sent successfully!');
        } catch (error) {
            this.logger.error('Error sending Slack alert:', error);
        }
    }
}
