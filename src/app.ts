import EventEmitter from 'events';
import { EventTypes } from './models/EventTypes';
import LogService from './services/LogService';
import UrlService from './services/UrlService';

async function app() {
	try {
		const events = new EventEmitter();
		const urlService = new UrlService(events);
		const logService = new LogService();
		let isErr = false;

		events.on(EventTypes.Log, (message: string) => {
			if (isErr) return;
			logService.addTask({ status: EventTypes.Ok, message });
		});

		events.on(EventTypes.Error, (message: string, err?: string) => {
			if (isErr) return;
      isErr = true;
			logService.addTask({ status: EventTypes.Error, message, err });
		});

		events.on(EventTypes.WorngUrl, (url: string) => {
			if (isErr) return;
			const message = `Wrong format for URL -> '${url}'`;
			logService.addTask({ status: EventTypes.Warning, message });
		});

		events.on(EventTypes.NotUrl, (url: string) => {
			if (isErr) return;
			const message = `URL looks like a not real url -> '${url}'. It will be skipped.`;
			logService.addTask({ status: EventTypes.Warning, message });
		});

		events.on(EventTypes.UrlInCheck, (url: string) => {
			if (isErr) return;
			const message = `URL '${url}' is already il list for checks. It will be skipped.`;
			logService.addTask({ status: EventTypes.Warning, message });
		});

		await logService.init();
		urlService.getUrlsToCheck();
	} catch (e) {
		console.error(e);
	}
}

app();
