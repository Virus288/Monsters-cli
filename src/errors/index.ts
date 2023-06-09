// eslint-disable-next-line max-classes-per-file
export class FullError extends Error {
  code = '000';
  status = 500;
}

export class MissingProcessPlatformError extends FullError {
  constructor() {
    super('MissingProcessPlatformError');
    this.message = 'process.platform is missing';
    this.name = 'MissingProcessPlatformError';
    this.code = '001';
    this.status = 500;
  }
}

export class MissingSourceFileError extends FullError {
  constructor() {
    super('MissingSourceFileError');
    this.message = 'SourceFile is missing';
    this.name = 'MissingSourceFileError';
    this.code = '002';
    this.status = 400;
  }
}
