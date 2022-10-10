import { format } from '@fast-csv/format';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

import { createWriteStream } from 'fs';
import { EventTypes } from '../models/EventTypes';
import EventEmitter from 'node:events';
import { CsvData } from '../models/CsvData';
import { CsvTask } from '../models/CsvTask';
import { Url } from '../models/UrlTypes';

// CheckService checks for availability urls
// it init folder and file before work
// if it can`t init file/folder -> throw fatal error
// service have task order and work until it have any task
// service notify app for every changes in url checks by eHandler
export class CsvService {
	private eHandler: EventEmitter;
	private PATH_TO_FOLDER: string = process.env['PATH_TO_CSV_RESULTS'] || 'results';
	private FILE_NAME: string = `${new Date().toISOString()}.csv`;
	private PATH_TO_FILE: string = `./${this.PATH_TO_FOLDER}/${this.FILE_NAME}`;

	private csvRowOrder: Url[] = [];
	private csvDataCache: { [url: Url]: CsvData } = {};
	private currRow: number = 1;
	private taskStack: CsvTask[] = [];
	private _isInWork: boolean = false;

	constructor(_eHandler: EventEmitter) {
		this.eHandler = _eHandler;
	}

	get isInWork(): boolean {
		return this._isInWork;
	}

	public async init(): Promise<void> {
		try {
			await this.initFolder();
		} catch (err) {
			const message = 'Something went wrong while init csv table';
			if (err instanceof Error) {
				this.eHandler.emit(EventTypes.ErrorFatal, `${message} Check logs.`, err.message);
				return;
			}
			this.eHandler.emit(EventTypes.ErrorFatal, message);
			return;
		}
	}

	public addTask(task: CsvTask): void {
		this.taskStack.push(task);
		if (!this._isInWork) this.startProcessing();
	}

	private async startProcessing(): Promise<void> {
		try {
			this._isInWork = true;
			let taskInd = 0;

			const csvStream = format({ headers: true });
			const writeStream = createWriteStream(this.PATH_TO_FILE);
			csvStream.pipe(writeStream);

			while (this.taskStack.length > taskInd) {
				const { data, action } = this.taskStack[taskInd];
				if (action === EventTypes.CsvAdd) await this.addRow(data);
				if (action === EventTypes.CsvUpdate) await this.updRow(data);
				taskInd += 1;
			}

			this.csvRowOrder.forEach((urlInOrder) => {
				const data = this.csvDataCache[urlInOrder];
				csvStream.write(data);
			});

			writeStream.end();
			csvStream.end();

			this.taskStack.length = 0;
			taskInd = 0;
			this._isInWork = false;
			this.eHandler.emit(EventTypes.Finish);
		} catch (err) {
			const message = 'Something went wrong during working with CSV Table. Exit programm.';
			if (err instanceof Error) {
				this.eHandler.emit(EventTypes.ErrorFatal, `${message} Check logs.`, err.message);
			} else this.eHandler.emit(EventTypes.ErrorFatal, message);
		}
	}

	private addRow(data: CsvData): Promise<void> {
		return new Promise((res) => {
			setTimeout(() => {
				const id = this.currRow;
				const { url, status, http_code } = data;
				this.currRow += 1;
				this.csvDataCache[url] = { id, url, status, http_code };
				this.csvRowOrder.push(url);
				res();
			}, 0);
		});
	}

	private updRow(data: CsvData): Promise<void> {
		return new Promise((res) => {
			setTimeout(() => {
				const { url, status, http_code } = data;
				this.csvDataCache[url] = { ...this.csvDataCache[url], status, http_code };
				res();
			}, 0);
		});
	}

	private async initFolder(): Promise<void> {
		try {
			if (!existsSync(this.PATH_TO_FOLDER)) {
				await mkdir(this.PATH_TO_FOLDER, { recursive: false });
			}
		} catch (err) {
			const message = 'Can`t create folder for results';
			if (err instanceof Error) {
				this.eHandler.emit(EventTypes.ErrorFatal, `${message} Check logs.`, err.message);
				return;
			}
			this.eHandler.emit(EventTypes.ErrorFatal, message);
			return;
		}
	}
}
