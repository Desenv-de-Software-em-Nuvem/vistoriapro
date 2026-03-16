import fs from 'fs';
import path from 'path';
import { getSwaggerSpec } from '../src/swaggerOptions.js';

const spec = getSwaggerSpec();
const outPath = path.resolve(process.cwd(), 'swagger.json');

fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf-8');
console.log(`Swagger spec written to ${outPath}`);
