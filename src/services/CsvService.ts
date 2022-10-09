import { CsvFormatterStream, format, Row } from '@fast-csv/format';

import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

import { EOL } from 'os';
import { WriteStream, createWriteStream } from 'fs';
import { parse } from 'fast-csv';
import { EventTypes } from '../models/EventTypes';
import EventEmitter from 'node:events';

export class CsvService {
	private eHandler: EventEmitter;
	private PATH_TO_FOLDER: string = process.env['PATH_TO_CSV_RESULTS'] || 'results';
	private FILE_NAME: string = `${new Date().toISOString()}.csv`;
	private PATH_TO_FILE: string = `./${this.PATH_TO_FOLDER}/${this.FILE_NAME}`;
  
    private csvStream: CsvFormatterStream<Row, Row> | undefined;
    private writeStream: WriteStream | undefined;
  
	private csvCache = {};

	constructor(_eHandler: EventEmitter) {
		this.eHandler = _eHandler;
	}

  // this.csvStream.write({
  // 	id: 1,
  // 	url: 'test',
  // 	status: 200,
  // 	http_code: 400,
  // });
	public async init(): Promise<void> {
		try {
			await this.initFolder();
			['id', 'url', 'status', 'http_code'];
			this.csvStream = format({ headers: true });
			this.writeStream = createWriteStream(this.PATH_TO_FILE);
			this.csvStream.pipe(this.writeStream);
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
