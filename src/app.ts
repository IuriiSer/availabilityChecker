import EventEmitter from 'events';
import { EventTypes } from './models/EventTypes';
import LogService from './services/LogService';
import UrlService from './services/UrlService';
import CheckService from './services/CheckService';
import { Url } from './models/UrlTypes';
import { CsvService } from './services/CsvService';


async function app() {
	try {
		const events = new EventEmitter();
		const urlService = new UrlService(events);
		const checkService = new CheckService(events);
		const logService = new LogService();
		const csvService = new CsvService(events);
		let isErr = false;
		events.setMaxListeners(20);
		events.on(EventTypes.Log, (message: string) => {
			if (isErr) return;
			logService.addTask({ status: EventTypes.Ok, message });
		});

		events.on(EventTypes.Error, (message: string, err?: string) => {
			if (isErr) return;
			logService.addTask({ status: EventTypes.Error, message, err });
		});

		events.on(EventTypes.ErrorFatal, (message: string, err?: string) => {
			if (isErr) return;
			isErr = true;
			logService.addTask({ status: EventTypes.ErrorFatal, message, err });
		});

		events.on(EventTypes.WorngUrl, (url: Url) => {
			if (isErr) return;
			const message = `Wrong format for URL -> '${url}'`;
			logService.addTask({ status: EventTypes.Warning, message });
		});

		events.on(EventTypes.NotUrl, (url: Url) => {
			if (isErr) return;
			const message = `URL looks like a not real url -> '${url}'. It will be skipped.`;
			logService.addTask({ status: EventTypes.Warning, message });
		});

		events.on(EventTypes.UrlAlreadyInCheck, (url: Url) => {
			if (isErr) return;
			const message = `URL '${url}' is already il list for checks. It will be skipped.`;
			logService.addTask({ status: EventTypes.Warning, message });
		});

		events.on(EventTypes.CheckUrl, (url: Url) => {
			if (isErr) return;
			checkService.addTask(url);
		});

		await logService.init();
		await csvService.init();
		urlService.getUrlsToCheck();
	} catch (e) {
		console.error(e);
	}
}

app();
