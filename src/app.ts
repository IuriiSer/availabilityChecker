import EventEmitter from 'events';
import { EventTypes } from './models/EventTypes';
import LogService from './services/LogService';
import UrlService from './services/UrlService';
import CheckService from './services/CheckService';
import { Url } from './models/UrlTypes';
import { CsvService } from './services/CsvService';
import { CsvData } from './models/CsvData';

// Init all Services
// and start UrlService work
// Adding events for app work
async function app() {
	try {
		const services: { [obj: string]: any } = {};
		const events = new EventEmitter();
		services.url = new UrlService(events);
		services.check = new CheckService(events);
		services.log = new LogService(events);
		services.csv = new CsvService(events);
		let isFatalErr = false;

		events.setMaxListeners(20);

		events.on(EventTypes.Log, (message: string) => {
			if (isFatalErr) return;
			services.log.addTask({ status: EventTypes.Ok, message });
		});

		events.on(EventTypes.Error, (message: string, err?: string) => {
			if (isFatalErr) return;
			services.log.addTask({ status: EventTypes.Error, message, err });
		});

		events.on(EventTypes.ErrorFatal, (message: string, err?: string) => {
			if (isFatalErr) return;
			isFatalErr = true;
			services.log.addTask({ status: EventTypes.ErrorFatal, message, err });
		});

		events.on(EventTypes.WorngUrl, (url: Url) => {
			if (isFatalErr) return;
			const message = `Wrong format for URL -> '${url}'`;
			services.log.addTask({ status: EventTypes.Warning, message });
		});

		events.on(EventTypes.NotUrl, (url: Url) => {
			if (isFatalErr) return;
			const message = `URL looks like a not real url -> '${url}'. It will be skipped.`;
			services.log.addTask({ status: EventTypes.Warning, message });
		});

		events.on(EventTypes.UrlAlreadyInCheck, (url: Url) => {
			if (isFatalErr) return;
			const message = `URL '${url}' is already il list for checks. It will be skipped.`;
			services.log.addTask({ status: EventTypes.Warning, message });
		});

		events.on(EventTypes.CheckUrl, (url: Url) => {
			if (isFatalErr) return;
			services.check.addTask(url);
		});

		events.on(EventTypes.CsvWrite, (action: EventTypes, data: CsvData) => {
			if (isFatalErr) return;
			services.csv.addTask({ action, data });
		});

		events.on(EventTypes.Finish, () => {
			let statusSum = true;
			for (const service in services) {
				if (services[service].isInWork) {
					statusSum = false;
					return;
				}
			}

			if (statusSum) {
				console.log('Programm finished to work');
				process.exit(0);
			}
		});

		await services.log.init();
		await services.csv.init();
		services.url.getUrlsToCheck();
	} catch (err) {
		console.log('Something went wrong');
		if (err instanceof Error) console.log(err.message);
		process.exit(1);
	}
}

app();
