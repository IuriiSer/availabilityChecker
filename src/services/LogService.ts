import EventEmitter from 'node:events';
import { mkdir, appendFile } from 'node:fs/promises';
import { EventTypes } from '../models/EventTypes';

class LogService {
	private _eventEmitter: EventEmitter;
	private PATH_TO_FOLDER: string = process.env['PATH_TO_LOGS_FOLDER'] || './logs';
	private FILE_NAME: string = `${new Date().toISOString()}.txt`;
	private PATH_TO_FILE: string = `${this.PATH_TO_FOLDER}/${this.FILE_NAME}`;
	private lineNumber: number = 0;

	constructor(eventEmitter: EventEmitter) {
		this._eventEmitter = eventEmitter;
	}

	public async init() {
		try {
			this.initFolder();
			this.initFile();
		} catch (err) {
			this._eventEmitter.emit(EventTypes.Exit, err);
		}
	}

	public async write(status: EventTypes, message: string, err?: Error) {
		await appendFile(this.PATH_TO_FILE, `${(this.lineNumber += 1)} - ${status} - ${message}\n`);
	}

	private async initFolder() {
		try {
			await mkdir(this.PATH_TO_FOLDER, { recursive: false });
		} catch (err) {
			const message = 'Can`t create folder for logs';
			if (err instanceof Error) {
				if (err.message.includes('EEXIST')) return;
				console.log(`${EventTypes.Error} -> ${message}\n${err.message}`);
			}
			console.log(`${EventTypes.Error} -> ${message}\n`);
			process.exit(1);
		}
	}

	private async initFile() {
		try {
			await appendFile(this.PATH_TO_FILE, `Log from ${new Date().toString()}\n\n`);
		} catch (err) {
			const message = 'Can`t create file for logs';
			if (err instanceof Error) {
				if (err.message.includes('EEXIST')) return;
				console.log(`${EventTypes.Error} -> ${message}\n${err.message}`);
			}
			console.log(`${EventTypes.Error} -> ${message}\n`);
			process.exit(1);
		}
	}
}

export default LogService;
