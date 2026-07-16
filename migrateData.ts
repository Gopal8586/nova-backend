import * as fs from 'fs';
import * as path from 'path';
import { servicesDetailData } from '../frontend/src/data/servicesData';

const outputPath = path.join(process.cwd(), 'src/data/services.json');

// Convert the object to JSON. We need to handle the icons.
// The icons are functions in the object. We can stringify and replace them.
// Wait, the icons are React components (functions). When stringified, they might disappear or turn into undefined if they are functions, but wait... they are imported objects or functions.

const processData = (data: any) => {
  const result = JSON.parse(JSON.stringify(data, (key, value) => {
    // If the value is a function, we can't easily get its name unless we know it.
    // However, in our object, the icon is already imported.
    return value;
  }));
  return result;
}

// Actually, in the frontend, the icon is a reference to a function from react-icons. 
// At runtime, it's just a function. We can't know it's "FaHeartbeat".
