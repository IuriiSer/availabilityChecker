import { ReqStatuses } from './RequestStatuses';
import { Url } from './UrlTypes';

export type CsvData = {
	id?: number;
	url: Url;
	status: ReqStatuses;
	http_code: number | string;
};
