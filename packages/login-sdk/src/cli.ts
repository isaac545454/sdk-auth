import { createDatabaseFile } from './db.ts';

const file = createDatabaseFile();
console.log(`auth.sqlite criado em ${file}`);
