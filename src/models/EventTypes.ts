export enum EventTypes {
	// CALL log service
	// ......................
	Log = 'LOG',
	Warning = 'WARNING',
	Error = 'ERROR',
	Ok = 'OK', // noy in use, just to show in log OK
	WorngUrl = 'WRONG_URL',
	NotUrl = 'NOT_URL',
	UrlAlreadyInCheck = 'URL_IN_CHECK',
	ErrorFatal = 'ERROR_FATAL',

	// CALL checkUrl service
	// ......................
	CheckUrl = 'CHECK_URL',

	// CALL checkUrl service
	// ......................
	CsvWrite = 'CSV_WRITE',
	CsvAdd = 'CSV_ADD', // modifier of EventTypes.CsvWrite
	CsvUpdate = 'CSV_UPDATE', // modifier of EventTypes.CsvWrite

	Finish = 'Finish',
}
