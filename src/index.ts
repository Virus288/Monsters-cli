#!/usr/bin/env node

import inquirer from 'inquirer';
import Creator from './modules/creator';
import Log from './tools/logger/log';
import * as process from 'process';

const QUESTIONS = [
  {
    name: 'module-name',
    type: 'input',
    message: 'Module name:',
    validate: (input: string): boolean | string => {
      if (/^([A-Za-z\-\\_\d])+$/u.test(input)) return true;
      return 'Module name may only include letters, numbers, underscores and hashes.';
    },
  },
];

inquirer
  .prompt(QUESTIONS)
  .then((answers: Record<string, string>) => {
    const moduleName = answers['module-name']!;
    const dir = process.cwd();

    const creator = new Creator(dir);

    creator.generateModule(moduleName);
  })
  .catch((err) => {
    Log.error('CLi', err);
  });
