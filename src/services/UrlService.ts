import { PrismaClient } from '@prisma/client';
import EventEmitter from 'events';
import { EventTypes } from '../models/EventTypes';
import validUrl from 'valid-url';
import { Urls } from '../models/UrlTypes';

const prisma = new PrismaClient();

// UrlService can get urls from db
// check it
// add notify throw eHandler about new events
class UrlService {
	private urls: Urls = [];
	private eHandler: EventEmitter;
	private _isInWork: boolean = false;

	constructor(_eHandler: EventEmitter) {
		this.eHandler = _eHandler;
	}

	get isInWork(): boolean {
		return this._isInWork;
	}

	public async getUrlsToCheck(): Promise<Urls | null> {
		try {
			this._isInWork = true;
			this.eHandler.emit(EventTypes.Log, 'Start getting URLS from the data base');
			const rawUrls = await prisma.urlToCheck.findMany();
			if (!Array.isArray(rawUrls))
				throw new Error('Something with the data base. URLS should be an array');

			await Promise.all(
				rawUrls.map((rawUrl) => {
					const { url } = rawUrl;
					this.eHandler.emit(EventTypes.Log, `Get ${url} for checking`);
					return this.validateUrl(url);
				}),
			);

			this._isInWork = false;

			this.eHandler.emit(
				EventTypes.Log,
				`Done to add URL that will be checked for availability, added ${this.urls.length} urls`,
			);
			this.eHandler.emit(EventTypes.Finish);
			return this.urls;
		} catch (err) {
			const message = 'Something went wrong during getting urls to check. Exit programm.';
			if (err instanceof Error) {
				this.eHandler.emit(EventTypes.ErrorFatal, `${message} Check logs.`, err.message);
				return null;
			}
			this.eHandler.emit(EventTypes.ErrorFatal, message);
			return null;
		}
	}

	private validateUrl(url: string): Promise<void> {
		return new Promise((res) => {
			setTimeout(() => {
				this.eHandler.emit(EventTypes.Log, `Url - ${url} -> Validating`);

				if (typeof url !== 'string') {
					this.eHandler.emit(EventTypes.WorngUrl, url);
					res();
					return;
				}

				const formatedUrl = validUrl.isUri(url);
				if (!formatedUrl) {
					this.eHandler.emit(EventTypes.NotUrl, url);
					res();
					return;
				}

				if (this.urls.includes(formatedUrl)) {
					this.eHandler.emit(EventTypes.UrlAlreadyInCheck, url);
					res();
					return;
				}

				this.eHandler.emit(EventTypes.Log, `Url - ${url} -> OK`);
				this.eHandler.emit(EventTypes.CheckUrl, url);

				this.urls.push(url);

				res();
			}, 0);
		});
	}
}

export default UrlService;
