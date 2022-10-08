import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const URLS: string[] = ['ya.ru', 'https://google.ru/?soneVal', 'some_wrong_url', 'ws://google.ru/', 'ftp://some.store.com'];

async function main() {
	console.log('Starting to SEED the data base');
	const urls = await prisma.urlToCheck.createMany({
		data: URLS.map((url) => ({ url })),
	});
	console.log(`Finished to seed, added ${urls.count} urls`);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.log('Error during SEED the data base');
		if (e.toString().includes('Unique constraint failed'))
			console.error('Some of URLS that you want to seed are already IN data base');
		else console.error('Something went wrong. Check error\n', e);
		console.log('Exit the programm');
		await prisma.$disconnect();
		process.exit(1);
	});
