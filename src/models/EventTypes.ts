export enum EventTypes {
	// common types
	Log = 'LOG',
	CheckUrl = 'CHECK_URL',
	WorngUrl = 'WRONG_URL',
	NotUrl = 'NOT_URL',
	UrlAlreadyInCheck = 'URL_IN_CHECK',
	ErrorFatal = 'ERROR_FATAL',

	// types for LOGS
	Ok = 'OK',
	Warning = 'WARNING',
	Error = 'ERROR',
}
