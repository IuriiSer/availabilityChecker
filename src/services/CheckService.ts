import { Url, Urls } from '../models/UrlTypes';
import EventEmitter from 'events';
import { EventTypes } from '../models/EventTypes';
import { ReqStatuses } from '../models/RequestStatuses';

const importDynamic = new Function('modulePath', 'return import(modulePath)');

const fetch = async (...args: any[]) => {
	const module = await importDynamic('node-fetch');
	return module.default(...args);
};

class CheckService {
	private taskStack: Urls = [];
	private isInWork: boolean = false;
	private eHandler: EventEmitter;

	constructor(_eHandler: EventEmitter) {
		this.eHandler = _eHandler;
	}

	public addTask(task: Url): void {
		this.eHandler.emit(EventTypes.Log, `Request Task - ${task} -> ${ReqStatuses.New}`);
		this.taskStack.push(task);
		if (this.isInWork) return;
		this.startProcessing();
	}

	private async startProcessing(): Promise<void> {
		this.isInWork = true;
		let taskInd = 0;

		while (this.taskStack.length > taskInd) {
			this.createRequest(this.taskStack[taskInd]);
			taskInd += 1;
		}

		this.taskStack.length = 0;
		taskInd = 0;
		this.isInWork = false;
	}

	private async createRequest(task: Url): Promise<void> {
		try {
			this.eHandler.emit(EventTypes.Log, `Request Task - ${task} -> ${ReqStatuses.Processing}`);
			const req = await fetch(task);
			this.eHandler.emit(EventTypes.Log, `Request Task - ${task} -> ${ReqStatuses.Done} with status ${req.status}`);
		} catch (err) {
			const message = `Request Task - ${task} -> ${ReqStatuses.Error}`;
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
