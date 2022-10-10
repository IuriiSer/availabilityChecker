import { CsvData } from './CsvData';
import { EventTypes } from './EventTypes';

export type CsvTask = {
	action: EventTypes;
	data: CsvData;
};
