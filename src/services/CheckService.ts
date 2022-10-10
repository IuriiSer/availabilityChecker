import { Url, Urls } from '../models/UrlTypes';
import EventEmitter from 'events';
import { EventTypes } from '../models/EventTypes';
import { ReqStatuses } from '../models/RequestStatuses';

const importDynamic = new Function('modulePath', 'return import(modulePath)');

const fetch = async (...args: any[]) => {
	const module = await importDynamic('node-fetch');
	return module.default(...args);
};

// CheckService checks for availability urls
// service have task order and work until it have any task
// service notify app for every changes in url checks by eHandler
class CheckService {
	private taskStack: Urls = [];
	private _isInWork: boolean = false;
	private eHandler: EventEmitter;
	private sendedReq: { req: number; res: number } = { req: 0, res: 0 };

	constructor(_eHandler: EventEmitter) {
		this.eHandler = _eHandler;
	}

	get isInWork(): boolean {
		return this.sendedReq.req !== this.sendedReq.res;
	}

	public addTask(task: Url): void {
		this.eHandler.emit(EventTypes.Log, `Request Task - ${task} -> ${ReqStatuses.New}`);
		this.eHandler.emit(EventTypes.CsvWrite, EventTypes.CsvAdd, {
			url: task,
			status: ReqStatuses.New,
			http_code: 'null',
		});
		this.taskStack.push(task);
		if (this._isInWork) return;
		this.startProcessing();
	}

	private async startProcessing(): Promise<void> {
		this._isInWork = true;
		let taskInd = 0;

		while (this.taskStack.length > taskInd) {
			this.createRequest(this.taskStack[taskInd]);
			taskInd += 1;
		}

		this.taskStack.length = 0;
		taskInd = 0;
		this._isInWork = false;
		this.eHandler.emit(EventTypes.Finish);
	}

	private async createRequest(task: Url): Promise<void> {
		try {
			this.sendedReq.req += 1;
			this.eHandler.emit(EventTypes.CsvWrite, EventTypes.CsvUpdate, {
				url: task,
				status: ReqStatuses.Processing,
				http_code: 'null',
			});
			this.eHandler.emit(EventTypes.Log, `Request Task - ${task} -> ${ReqStatuses.Processing}`);
			const req = await fetch(task);
			this.sendedReq.res += 1;
			this.eHandler.emit(EventTypes.CsvWrite, EventTypes.CsvUpdate, {
				url: task,
				status: ReqStatuses.Done,
				http_code: req.status,
			});
			this.eHandler.emit(
				EventTypes.Log,
				`Request Task - ${task} -> ${ReqStatuses.Done} with status ${req.status}`,
			);
		} catch (err) {
			this.sendedReq.res += 1;
			const message = `Request Task - ${task} -> ${ReqStatuses.Error}`;
			this.eHandler.emit(EventTypes.CsvWrite, EventTypes.CsvUpdate, {
				url: task,
				status: ReqStatuses.Error,
				http_code: 'null',
			});
			if (err instanceof Error) {
				this.eHandler.emit(EventTypes.Error, message, err.message);
				return;
			}
			this.eHandler.emit(EventTypes.Error, message);
			return;
		}
	}
}

export default CheckService;
