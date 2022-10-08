import EventEmitter from 'events';
import { EventTypes } from './models/EventTypes';
import LogService from './services/LogService';
import UrlService from './services/UrlService';

async function app() {
	try {
		const events = new EventEmitter();
		const urlService = new UrlService(events);
		const logService = new LogService(events);

		events.on(EventTypes.Exit, async () => {
			process.exit(0);
		});

		events.on(EventTypes.Log, async (message: string, data?: any) => {
			logService.write(EventTypes.Ok, message);
			console.log(`${message}\n`);
		});

		events.on(EventTypes.WorngUrl, async (url: string) => {
			const message = `Wrong format for URL -> '${url}'`;
			logService.write(EventTypes.Warning, message);
			console.log(`${message}\n`);
		});

		events.on(EventTypes.NotUrl, async (url: string) => {
			const message = `URL looks like a not real url -> '${url}'. It will be skipped.`;
			logService.write(EventTypes.Warning, message);
			console.log(`${message}\n`);
		});

		events.on(EventTypes.UrlInCheck, async (url: string) => {
			const message = `URL '${url}' is already il list for checks. It will be skipped.`;
			logService.write(EventTypes.Warning, message);
			console.log(`${message}\n`);
		});

		await logService.init();
		urlService.getUrlsToCheck();
	} catch (e) {
		console.error(e);
	}
}

app();
