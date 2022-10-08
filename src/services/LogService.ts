import EventEmitter from 'node:events';
import { mkdir, appendFile } from 'node:fs/promises';
import { EventTypes } from '../models/EventTypes';

type Task = {
	status: EventTypes;
	message: string;
	err?: string;
};

class LogService {
	private taskStack: Task[] = [];
	private isInWork: Boolean = false;
	private lineNumber: number = 0;
	private PATH_TO_FOLDER: string = process.env['PATH_TO_LOGS_FOLDER'] || './logs';
	private FILE_NAME: string = `${new Date().toISOString()}.txt`;
	private PATH_TO_FILE: string = `${this.PATH_TO_FOLDER}/${this.FILE_NAME}`;

	public async init() {
		try {
			await this.initFolder();
			await this.initFile();
		} catch (error) {
			return;
		}
	}

	public addTask(task: Task) {
		this.taskStack.push(task);
		if (this.isInWork) return;
		this.startLogProcessing();
	}

	private async startLogProcessing() {
		this.isInWork = true;
		let taskInd = 0;

		while (this.taskStack.length > taskInd) {
			const task = this.taskStack[taskInd];
			await this.write(task);
			taskInd += 1;
		}

		this.taskStack.length = 0;
		taskInd = 0;
		this.isInWork = false;
	}

	private async write(task: Task) {
		try {
			const { status, message, err } = task;
			let toWrite = `${(this.lineNumber += 1)} - ${status} - ${message}`;
      console.log(toWrite);
      if (err) toWrite = `${toWrite}\n${this.lineNumber} - ${err}`
			await appendFile(this.PATH_TO_FILE, `${toWrite}\n`);
		} catch (err) {
      const message = 'Can`t write message to the log file';
			if (err instanceof Error) {
				console.log(`${EventTypes.Error} -> ${message}\n${err.message}\n`);
        return;
      }
			console.log(`${EventTypes.Error} -> ${message}\n`);
    }
	}

	private async initFolder() {
		try {
			await mkdir(this.PATH_TO_FOLDER, { recursive: false });
		} catch (err) {
			const message = 'Can`t create folder for logs';
			if (err instanceof Error) {
				if (err.message.includes('EEXIST')) return;
				console.log(`${EventTypes.Error} -> ${message}\n${err.message}`);
				process.exit(1);
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
				process.exit(1);
			}
			console.log(`${EventTypes.Error} -> ${message}\n`);
			process.exit(1);
		}
	}
}

export default LogService;
