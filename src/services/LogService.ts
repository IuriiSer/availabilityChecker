import EventEmitter from 'node:events';
import { existsSync } from 'node:fs';
import { mkdir, appendFile } from 'node:fs/promises';
import { EventTypes } from '../models/EventTypes';
import { LogTask } from '../models/LogTask';

// LogService can show logs in a console and can write logs in a log file
// it init folder and file before work
// if it can`t init file/folder -> show logs only in the console
// service have task order and work until it have any task
// in fatal error case -> service will stop process with exit status (1)
class LogService {
	private taskStack: LogTask[] = [];
	private _isInWork: boolean = false;
	private lineNumber: number = 0;
	private PATH_TO_FOLDER: string = process.env['PATH_TO_LOGS_FOLDER'] || 'logs';
	private FILE_NAME: string = `${new Date().toISOString()}.txt`;
	private PATH_TO_FILE: string = `./${this.PATH_TO_FOLDER}/${this.FILE_NAME}`;
	private isActive: boolean = true;
	private eHandler: EventEmitter;

	constructor(_eHandler: EventEmitter) {
		this.eHandler = _eHandler;
	}

	get isInWork(): boolean {
		return this._isInWork;
	}

	public async init(): Promise<void> {
		try {
			await this.initFolder();
			await this.initFile();
		} catch (error) {
			return;
		}
	}

	public addTask(task: LogTask): void {
		this.taskStack.push(task);
		if (!this._isInWork) this.startProcessing();
	}

	private async startProcessing(): Promise<void> {
		this._isInWork = true;
		let taskInd = 0;

		while (this.taskStack.length > taskInd) {
			const { err, message, status } = this.taskStack[taskInd];
			const toWrite = this.getMessage({ status, message });
			this.writeToConsole(toWrite);
			await this.writeToFile(toWrite);
			if (err) {
				const errToWrite = this.getMessage({ status: EventTypes.Error, message: '', err });
				await this.writeToFile(errToWrite);
				if (this.taskStack[taskInd].status === EventTypes.ErrorFatal) process.exit(1);
			}
			taskInd += 1;
		}

		this.taskStack.length = 0;
		taskInd = 0;
		this._isInWork = false;
		this.eHandler.emit(EventTypes.Finish);
	}

	private getMessage(task: LogTask): string {
		if (task.err) {
			return `${this.lineNumber} - ${task.status} - ${task.err}`;
		}
		return `${(this.lineNumber += 1)} - ${task.status} - ${task.message}`;
	}

	private async writeToFile(message: string): Promise<void> {
		try {
			if (!this.isActive) return;
			await appendFile(this.PATH_TO_FILE, `${message}\n`);
		} catch (err) {
			this.isActive = false;
			const message = this.getMessage({
				status: EventTypes.Error,
				message: 'Can`t write to the log file',
			});
			if (err instanceof Error) {
				console.log(message);
				console.log(this.getMessage({ status: EventTypes.Error, message: '', err: err.message }));
				return;
			}
			console.log(message);
		}
	}

	private writeToConsole(message: string): void {
		console.log(message);
	}

	private async initFolder(): Promise<void> {
		try {
			if (!existsSync(this.PATH_TO_FOLDER)) {
				await mkdir(this.PATH_TO_FOLDER, { recursive: false });
			}
		} catch (err) {
			this.isActive = false;
			const message = this.getMessage({
				status: EventTypes.Error,
				message: 'Can`t create folder for logs',
			});
			if (err instanceof Error) {
				console.log(message);
				console.log(this.getMessage({ status: EventTypes.Error, message: '', err: err.message }));
				return;
			}
			console.log(message);
		}
	}

	private async initFile(): Promise<void> {
		try {
			await appendFile(this.PATH_TO_FILE, `Log from ${new Date().toString()}\n\n`);
		} catch (err) {
			this.isActive = false;
			const message = this.getMessage({
				status: EventTypes.Error,
				message: 'Can`t create file for logs',
			});
			if (err instanceof Error) {
				console.log(message);
				console.log(this.getMessage({ status: EventTypes.Error, message: '', err: err.message }));
				return;
			}
			console.log(message);
		}
	}
}

export default LogService;
