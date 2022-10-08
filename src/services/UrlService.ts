import { PrismaClient } from '@prisma/client';
import EventEmitter from 'events';
import { EventTypes } from '../models/EventTypes';
import validUrl from 'valid-url';

const prisma = new PrismaClient();

type Urls = string[];

class UrlService {
	private _urls: Urls = [];
	private _eHandler: EventEmitter;

	constructor(eHandler: EventEmitter) {
		this._eHandler = eHandler;
	}

	public get urls(): Urls {
		return this._urls;
	}

	public async getUrlsToCheck(): Promise<Urls | null> {
		try {
			this._eHandler.emit(EventTypes.Log, 'Start getting URLS from the data base');
			const rawUrls = await prisma.urlToCheck.findMany();
			if (!Array.isArray(rawUrls))
				throw new Error('Something with the data base. URLS should be an array');

			rawUrls.forEach((rawUrl) => {
				const { url } = rawUrl;

				if (typeof url !== 'string') {
					this._eHandler.emit(EventTypes.WorngUrl, url);
					return;
				}
        
				const formatedUrl = validUrl.isUri(url);
				if (!formatedUrl) {
          this._eHandler.emit(EventTypes.NotUrl, url);
					return;
				}

        if (this._urls.includes(formatedUrl)) {
          this._eHandler.emit(EventTypes.UrlInCheck, url);
					return;
        }

				this._urls.push(url);
			});

			this._eHandler.emit(EventTypes.Log, `Done to add URL that will be checked for availability, added ${this._urls.length} urls`);

      return this.urls;

    } catch (err) {
			const message = 'Something went wrong during getting urls to check. Exit programm.';
			if (err instanceof Error) {
				this._eHandler.emit(EventTypes.Error, `${message} Check logs.`, err.message);
        return null;
			}
      this._eHandler.emit(EventTypes.Error, message);
      return null;
		}
	}
}

export default UrlService;
