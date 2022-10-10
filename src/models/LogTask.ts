import { EventTypes } from './EventTypes';

export type LogTask = {
	status: EventTypes;
	message: string;
	err?: string;
};
