import { PrismaClient } from '@prisma/client';
import EventEmitter from 'events';
import { EventTypes } from '../models/EventTypes';
import validUrl from 'valid-url';
import { Urls } from '../models/UrlTypes';

const prisma = new PrismaClient();

class UrlService {
	private _urls: Urls = [];
	private eHandler: EventEmitter;

	constructor(_eHandler: EventEmitter) {
		this.eHandler = _eHandler;
	}

	public get urls(): Urls {
		return this._urls;
	}

	public async getUrlsToCheck(): Promise<Urls | null> {
		try {
			this.eHandler.emit(EventTypes.Log, 'Start getting URLS from the data base');
			const rawUrls = await prisma.urlToCheck.findMany();
			if (!Array.isArray(rawUrls))
				throw new Error('Something with the data base. URLS should be an array');

			rawUrls.forEach((rawUrl) => {
				const { url } = rawUrl;

				this.eHandler.emit(EventTypes.Log, `Url - ${url} -> Validating`);

				if (typeof url !== 'string') {
					this.eHandler.emit(EventTypes.WorngUrl, url);
					return;
				}

				const formatedUrl = validUrl.isUri(url);
				if (!formatedUrl) {
					this.eHandler.emit(EventTypes.NotUrl, url);
					return;
				}

				if (this._urls.includes(formatedUrl)) {
					this.eHandler.emit(EventTypes.UrlAlreadyInCheck, url);
					return;
				}

				this.eHandler.emit(EventTypes.Log, `Url - ${url} -> OK`);
				this.eHandler.emit(EventTypes.CheckUrl, url);

				this._urls.push(url);
			});

			this.eHandler.emit(
				EventTypes.Log,
				`Done to add URL that will be checked for availability, added ${this._urls.length} urls`,
			);

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
}

export default UrlService;
